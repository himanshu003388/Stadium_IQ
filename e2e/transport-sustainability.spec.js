import { test, expect } from '@playwright/test';

test.describe('Transport & Sustainability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Transport Hub', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    await expect(page.getByRole('tab', { name: 'Post-Match Departure' })).toBeVisible();
  });

  test('should display transport options sorted by AI recommendation', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    await expect(page.getByText(/Recommended/).first()).toBeVisible();
    await expect(page.getByText('AI Recommended', { exact: true })).toBeVisible();
    await expect(page.getByText('Fastest', { exact: true })).toBeVisible();
    await expect(page.getByText('Most Eco', { exact: true })).toBeVisible();
  });

  test('should navigate to Sustainability Dashboard', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/Sustainability Dashboard/)).toBeVisible();
  });

  test('should display Sustainability Dashboard with eco metrics', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/Energy Draw/)).toBeVisible();
    await expect(page.getByText(/Solar Output/)).toBeVisible();
    await expect(page.getByText(/CO₂ Savings/)).toBeVisible();
  });

  test('should toggle Eco Mode on Sustainability page', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    const ecoButton = page.getByRole('button', { name: /Eco Mode/i });
    await ecoButton.click();
    await expect(page.getByText(/Eco Mode Activated/)).toBeVisible();
  });

  test('should display proactive AI Sustainability recommendations and eco mode status', async ({
    page,
  }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/AI Sustainability Insight/)).toBeVisible();
  });
});
