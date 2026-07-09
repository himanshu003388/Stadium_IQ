/**
 * End-to-End tests for Stadium IQ
 * Tests core user flows across the application
 */
import { test, expect } from '@playwright/test';

test.describe('Stadium IQ Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Stadium IQ|FIFA World Cup 2026/);
  });

  test('should display the header with stadium branding', async ({ page }) => {
    await expect(page.getByText('Stadium IQ')).toBeVisible();
    await expect(page.getByText('FIFA World Cup 2026')).toBeVisible();
  });

  test('should show match score in header', async ({ page }) => {
    await expect(page.getByText(/Brazil|France/).first()).toBeVisible();
    await expect(page.getByText(/\d+ - \d+/).first()).toBeVisible();
  });

  test('should display AI Active status indicator', async ({ page }) => {
    await expect(page.getByText('AI Active')).toBeVisible();
  });

  test('should navigate to GenAI Assistant when clicking nav item', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    await expect(page.getByText(/FIFA World Cup 2026 GenAI Assistant/)).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();
  });

  test('should navigate to Crowd & Navigation view', async ({ page }) => {
    await page.locator('button[aria-label="Crowd Map"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();
  });

  test('should navigate to Volunteer Dispatch', async ({ page }) => {
    await page.locator('button[aria-label="Volunteer Dispatch"]:visible').click();
    await expect(page.getByText(/AI-powered task assignment/)).toBeVisible();
  });

  test('should navigate to Transport Hub', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    await expect(page.getByText(/Post-match departure options/)).toBeVisible();
  });

  test('should navigate to Sustainability Dashboard', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/Sustainability Dashboard/)).toBeVisible();
  });

  test('should navigate to Accessibility Hub', async ({ page }) => {
    await page.locator('button[aria-label="Accessibility"]:visible').click();
    await expect(page.getByText(/Accessibility Hub/)).toBeVisible();
  });

  test('should navigate to Smart Concessions', async ({ page }) => {
    await page.locator('button[aria-label="Concessions"]:visible').click();
    await expect(page.getByText(/Smart Concessions/)).toBeVisible();
  });

  test('should navigate to Volunteer Mobile view', async ({ page }) => {
    await page.locator('button[aria-label^="Select User Role"]').click();
    await page.getByRole('option', { name: /Volunteer/ }).click();
    await page.locator('button[aria-label="Volunteer Mobile"]:visible').click();
    await expect(page.getByText(/Responder View/)).toBeVisible();
  });

  test('should display Command Center KPIs', async ({ page }) => {
    await expect(page.getByText('Crowd Density', { exact: true })).toBeVisible();
    await expect(page.getByText('Occupancy', { exact: true })).toBeVisible();
    await expect(page.getByText('Temperature', { exact: true })).toBeVisible();
  });

  test('should have working skip-to-content link for keyboard users', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' }).first();
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });

  test('should toggle Eco Mode on Sustainability page', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    const ecoButton = page.getByRole('button', { name: /Eco Mode/i });
    await ecoButton.click();
    await expect(page.getByText(/Eco Mode Activated/)).toBeVisible();
  });

  test('should display transport options sorted by AI recommendation', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    await expect(page.getByText(/Recommended/).first()).toBeVisible();
    await expect(page.getByText('AI Recommended', { exact: true })).toBeVisible();
    await expect(page.getByText('Fastest', { exact: true })).toBeVisible();
    await expect(page.getByText('Most Eco', { exact: true })).toBeVisible();
  });

  test('should be keyboard navigable through sidebar', async ({ page }) => {
    const navItems = page.getByRole('navigation').first().getByRole('button');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < Math.min(count, 3); i++) {
      await navItems.nth(i).focus();
      await expect(navItems.nth(i)).toBeFocused();
    }
  });

  test('should have accessible name for all interactive elements', async ({ page }) => {
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    const missingLabels = [];
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute('aria-label');
      const text = await btn.textContent();
      if (!label && !text?.trim()) {
        missingLabels.push(i);
      }
    }
    expect(missingLabels).toEqual([]);
  });

  test('should send a message in AI chat and receive a demo response', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();

    const input = page.getByPlaceholder(/Ask Stadium IQ/);
    await input.fill('Which gate should I enter through?');

    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    await expect(page.getByText('Which gate should I enter through?')).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(page.getByText(/Gate/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('should send a message using Enter key', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    const input = page.getByPlaceholder(/Ask Stadium IQ/);
    await input.fill('Tell me about transport options');
    await input.press('Enter');

    await expect(page.getByText('Tell me about transport options')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('should allow changing AI language and show the selection', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();

    const langBtn = page.getByRole('button', { name: /Select language/i });
    await expect(langBtn).toBeVisible();
    await langBtn.click();
    await expect(page.getByText('Español')).toBeVisible();
    await page.getByText('Español').click();
    await expect(langBtn).toContainText('Español');
  });

  test('should show quick prompt buttons that send messages when clicked', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();
    await expect(page.getByText(/your AI guide/)).toBeVisible();

    const quickBtns = page.locator('button[data-testid="quick-prompt-btn"]');
    const count = await quickBtns.count();

    if (count > 0) {
      await quickBtns.first().click();
      await expect(page.locator('.chat-bubble-user').first()).toBeVisible();
    }
  });

  test('should navigate to Gate from CrowdMap using directions link', async ({ page }) => {
    await page.locator('button[aria-label="Crowd Map"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();

    const directionLinks = page.getByRole('link', { name: /Navigate to Gate/i });
    const count = await directionLinks.count();
    expect(count).toBeGreaterThan(0);

    const href = await directionLinks.first().getAttribute('href');
    expect(href).toContain('google.com/maps');
  });

  test('should display Accessibility Hub with vision settings', async ({ page }) => {
    await page.locator('button[aria-label="Accessibility"]:visible').click();
    await expect(page.getByText(/Global Vision Settings/)).toBeVisible();
    await expect(page.getByLabel(/Toggle High Contrast Mode/)).toBeVisible();
    await expect(page.getByLabel(/Toggle Dyslexia-Friendly Font/)).toBeVisible();
  });

  test('should display Sustainability Dashboard with eco metrics', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/Energy Draw/)).toBeVisible();
    await expect(page.getByText(/Solar Output/)).toBeVisible();
    await expect(page.getByText(/CO₂ Savings/)).toBeVisible();
  });

  test('should display Smart Concessions vendor cards', async ({ page }) => {
    await page.locator('button[aria-label="Concessions"]:visible').click();
    await expect(page.getByText(/AI-driven supply chain management/)).toBeVisible();
    await expect(page.getByText(/STOCK/).first()).toBeVisible();
  });

  test('should display Volunteer Mobile view with active task', async ({ page }) => {
    await page.locator('button[aria-label^="Select User Role"]').click();
    await page.getByRole('option', { name: /Volunteer/ }).click();
    await page.locator('button[aria-label="Volunteer Mobile"]:visible').click();
    await expect(page.getByText(/Active Mission/).first()).toBeVisible();
  });
});
