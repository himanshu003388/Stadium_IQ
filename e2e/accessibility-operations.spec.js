import { test, expect } from '@playwright/test';

test.describe('Accessibility & Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Accessibility Hub', async ({ page }) => {
    await page.locator('button[aria-label="Accessibility"]:visible').click();
    await expect(page.getByText(/Accessibility Hub/)).toBeVisible();
  });

  test('should display Accessibility Hub with vision settings', async ({ page }) => {
    await page.locator('button[aria-label="Accessibility"]:visible').click();
    await expect(page.getByText(/Global Vision Settings/)).toBeVisible();
    await expect(page.getByLabel(/Toggle High Contrast Mode/)).toBeVisible();
    await expect(page.getByLabel(/Toggle Dyslexia-Friendly Font/)).toBeVisible();
  });

  test('should navigate to Smart Concessions', async ({ page }) => {
    await page.locator('button[aria-label="Concessions"]:visible').click();
    await expect(page.getByText(/Smart Concessions/)).toBeVisible();
  });

  test('should display Smart Concessions vendor cards', async ({ page }) => {
    await page.locator('button[aria-label="Concessions"]:visible').click();
    await expect(page.getByText(/AI-driven supply chain management/)).toBeVisible();
    await expect(page.getByText(/STOCK/).first()).toBeVisible();
  });

  test('should generate and broadcast translated PA announcements', async ({ page }) => {
    const textarea = page.locator('textarea#broadcast-message');
    await textarea.fill('Weather advisory: heavy rain expected.');

    const broadcastBtn = page.getByRole('button', { name: /Generate & Broadcast/i });
    await broadcastBtn.click();

    await expect(page.getByText('Active Audio Broadcast Transcripts:')).toBeVisible();
    await expect(page.getByText(/Weather advisory/)).toBeVisible();
  });
});
