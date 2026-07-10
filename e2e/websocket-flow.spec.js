import { test, expect } from '@playwright/test';

test.describe('Real-time WebSocket Flow', () => {
  test('should display assertive alert when critical event is received', async ({ page }) => {
    // Increase test timeout to handle Vite cold start compile times
    test.setTimeout(30000);

    // Inject mock WebSocket constructor on the window object before page load
    await page.addInitScript(() => {
      window.activeSockets = [];

      class MockWebSocket extends EventTarget {
        constructor(url, _protocols) {
          super();
          this.url = url;
          this.readyState = 0; // CONNECTING

          window.activeSockets.push(this);

          // Simulate connection delay and initial state update
          setTimeout(() => {
            this.readyState = 1; // OPEN
            if (this.onopen) this.onopen();
            this.dispatchEvent(new Event('open'));

            // Send default telemetry state update immediately
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'STATE_UPDATE',
                  data: {
                    gates: [
                      {
                        id: 'A',
                        density: 0.5,
                        waitTimeMinutes: 10,
                        accessible: true,
                        status: 'normal',
                        direction: 'North',
                        accessibleFeatures: [],
                      },
                    ],
                    volunteers: [],
                    stadium: {
                      currentOccupancy: 85000,
                      capacity: 100000,
                      homeTeam: 'Brazil',
                      awayTeam: 'France',
                      score: '2 - 1',
                      weather: { temperature: 25, humidity: 45, conditions: 'Clear' },
                      sustainability: {
                        ecoModeActive: false,
                        waterRecyclingLitres: 142000,
                        energyDrawMW: 4.8,
                        wasteDivertedPercentage: 82,
                        renewablePercentage: 40,
                      },
                      zones: [],
                    },
                    vendors: [],
                    incidents: [],
                    tasks: [],
                  },
                }),
              });
            }
          }, 100);
        }

        send(msg) {
          this.sentMessages = this.sentMessages || [];
          this.sentMessages.push(msg);
        }

        close() {
          this.readyState = 3; // CLOSED
          if (this.onclose) this.onclose({ code: 1000, reason: 'Normal' });
          this.dispatchEvent(new Event('close'));
        }
      }

      window.WebSocket = MockWebSocket;
    });

    await page.goto('/');

    // Verify it loads with basic metrics
    await expect(page.getByText('Crowd Density', { exact: true })).toBeVisible({ timeout: 15000 });

    // Wait for the mock WebSocket to be instantiated
    await page.waitForFunction(() => window.activeSockets && window.activeSockets.length > 0);

    // Simulate pushing a critical crowd warning notification from the socket server
    await page.evaluate(() => {
      const payload = {
        type: 'NOTIFICATION',
        data: {
          title: 'CRITICAL: Crowd Crush Alert',
          message: 'Potential crush risk in East Wing sector. Reroute volunteers.',
          severity: 'critical',
          duration: 10000,
        },
      };

      const ws = window.activeSockets[window.activeSockets.length - 1];
      if (!ws) return;

      const sendNotification = () => {
        if (ws && ws.onmessage) {
          ws.onmessage({ data: JSON.stringify(payload) });
        }
      };

      if (ws.readyState === 1) {
        sendNotification();
      } else {
        // wait for the mock socket open event before sending
        ws.addEventListener('open', sendNotification, { once: true });
      }
    });

    // Add a small rendering buffer
    await page.waitForTimeout(500);

    // Assert that the toast is displayed on the screen with dynamic timeout & case-insensitive regex
    await expect(page.getByText(/CRITICAL:\s*Crowd Crush Alert/i)).toBeVisible({ timeout: 15000 });
    await expect(
      page
        .getByLabel('Notifications')
        .getByText(/Potential crush risk in East Wing sector.?\s*Reroute volunteers./i),
    ).toBeVisible({ timeout: 15000 });

    // Assert that the assertive aria-live announcer received the notification for screen readers
    const announcer = page.locator('[data-testid="assertive-announcer"]');
    await expect(announcer).toHaveAttribute('aria-live', 'assertive');
    await expect(announcer).toHaveText(
      /Potential crush risk in East Wing sector.?\s*Reroute volunteers./i,
      { timeout: 15000 },
    );
  });
});
