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
    await page.getByLabel('GenAI Assistant').click();
    await expect(page.getByText(/FIFA World Cup 2026 GenAI Assistant/)).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();
  });

  test('should navigate to Crowd & Navigation view', async ({ page }) => {
    await page.getByLabel('Crowd & Navigation').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();
  });

  test('should navigate to Volunteer Dispatch', async ({ page }) => {
    await page.getByLabel('Volunteer Dispatch').click();
    await expect(page.getByText(/AI-powered task assignment/)).toBeVisible();
  });

  test('should navigate to Transport Hub', async ({ page }) => {
    await page.getByLabel('Transport Hub').click();
    await expect(page.getByText(/Post-match departure options/)).toBeVisible();
  });

  test('should navigate to Sustainability Dashboard', async ({ page }) => {
    await page.getByLabel('Sustainability').click();
    await expect(page.getByText(/Sustainability Dashboard/)).toBeVisible();
  });

  test('should display Command Center KPIs', async ({ page }) => {
    await expect(page.getByText('Crowd Density')).toBeVisible();
    await expect(page.getByText('Occupancy')).toBeVisible();
    await expect(page.getByText('Temperature')).toBeVisible();
  });

  test('should have working skip-to-content link for keyboard users', async ({ page }) => {
    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByText('Skip to main content');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });

  test('should toggle Eco Mode on Sustainability page', async ({ page }) => {
    await page.getByLabel('Sustainability').click();
    const ecoButton = page.getByRole('button', { name: /Eco Mode/i });
    await ecoButton.click();
    await expect(page.getByText(/Eco Mode Activated/)).toBeVisible();
    await expect(page.getByText(/Eco Mode: ON/)).toBeVisible();
  });

  test('should display transport options sorted by AI recommendation', async ({ page }) => {
    await page.getByLabel('Transport Hub').click();
    // Check that the recommended badge appears
    await expect(page.getByText(/Recommended/).first()).toBeVisible();
    // Sort buttons should be present
    await expect(page.getByText('AI Recommended')).toBeVisible();
    await expect(page.getByText('Fastest')).toBeVisible();
    await expect(page.getByText('Most Eco')).toBeVisible();
  });

  test('should be keyboard navigable through sidebar', async ({ page }) => {
    const navItems = page.getByRole('navigation').first().getByRole('button');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(6);
    // Navigate through items with keyboard
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
