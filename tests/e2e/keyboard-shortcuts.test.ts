import { test, expect } from '@playwright/test';

// T039b: Keyboard shortcuts E2E — skipped until Phase 5 wiring (T041) complete
test.describe('Keyboard Shortcuts', () => {
	test('page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('main')).toBeVisible();
	});

	test.skip('Space toggles play/pause', async ({ page }) => {
		await page.goto('/?v=dQw4w9WgXcQ');
		await page.keyboard.press('Space');
	});

	test.skip('A sets point A', async ({ page }) => {
		await page.goto('/?v=dQw4w9WgXcQ');
		await page.keyboard.press('a');
	});

	test.skip('Escape clears loop', async ({ page }) => {
		await page.goto('/?v=dQw4w9WgXcQ');
		await page.keyboard.press('Escape');
	});
});
