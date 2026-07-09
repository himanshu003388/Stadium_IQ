import { test, expect } from '@playwright/test';

test.describe('Volunteer Dispatch & Mobile View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Volunteer Dispatch', async ({ page }) => {
    await page.locator('button[aria-label="Volunteer Dispatch"]:visible').click();
    await expect(page.getByText(/AI-powered task assignment/)).toBeVisible();
  });

  test('should navigate to Volunteer Mobile view', async ({ page }) => {
    await page.locator('button[aria-label^="Select User Role"]').waitFor({ state: 'visible' });
    await page.locator('button[aria-label^="Select User Role"]').click();
    await page.getByRole('option', { name: /Volunteer/ }).click();
    await page.locator('button[aria-label="Volunteer Mobile"]:visible').click();
    await expect(page.getByText(/Responder View/)).toBeVisible();
  });

  test('should display Volunteer Mobile view with active task', async ({ page }) => {
    await page.locator('button[aria-label^="Select User Role"]').waitFor({ state: 'visible' });
    await page.locator('button[aria-label^="Select User Role"]').click();
    await page.getByRole('option', { name: /Volunteer/ }).click();
    await page.locator('button[aria-label="Volunteer Mobile"]:visible').click();
    await expect(page.getByText(/Active Mission/).first()).toBeVisible();
  });

  test('should allow switching volunteer simulated logins in volunteer mobile view', async ({
    page,
  }) => {
    await page.locator('button[aria-label^="Select User Role"]').waitFor({ state: 'visible' });
    await page.locator('button[aria-label^="Select User Role"]').click();
    await page.getByRole('option', { name: /Volunteer/ }).click();
    await page.locator('button[aria-label="Volunteer Mobile"]:visible').click();

    // Check initial volunteer name (use first() to avoid dropdown option match)
    await expect(page.getByText('Elena Vargas').first()).toBeVisible();

    // Select Marcus Dupont (ID: V2)
    await page.locator('#volunteer-simulator-select').selectOption('V2');

    // Check updated volunteer name
    await expect(page.getByText('Marcus Dupont').first()).toBeVisible();
  });
});
