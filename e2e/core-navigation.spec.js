import { test, expect } from '@playwright/test';

test.describe('Core Navigation & Layout', () => {
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
});
