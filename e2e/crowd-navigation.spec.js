import { test, expect } from '@playwright/test';

test.describe('Crowd Map & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Crowd & Navigation view', async ({ page }) => {
    await page.locator('button[aria-label="Crowd Map"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();
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

  test('should support indoor wayfinding navigation paths for gates on CrowdMap', async ({
    page,
  }) => {
    await page.locator('button[aria-label="Crowd Map"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();

    const indoorNavButtons = page.locator('button[aria-label^="Show indoor wayfinding for Gate"]');
    const count = await indoorNavButtons.count();
    expect(count).toBeGreaterThan(0);

    // Toggle indoor navigation on the first gate (Gate A)
    await indoorNavButtons.first().click();

    // Verify wayfinding instructions card displays
    await expect(page.getByText(/Indoor Navigation from Gate A/)).toBeVisible();
    await expect(page.getByText(/Enter through Gate A/)).toBeVisible();

    // Close indoor navigation
    await page.getByLabel('Close indoor navigation').click();
    await expect(page.getByText(/Indoor Navigation from Gate A/)).not.toBeVisible();
  });
});
