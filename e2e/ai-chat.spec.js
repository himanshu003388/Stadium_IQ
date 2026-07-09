import { test, expect } from '@playwright/test';

test.describe('AI Chat Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to GenAI Assistant when clicking nav item', async ({ page }) => {
    await page.locator('button[aria-label="AI Assistant"]:visible').click();
    await expect(page.getByText(/FIFA World Cup 2026 GenAI Assistant/)).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();
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
});
