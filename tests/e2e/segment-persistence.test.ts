import { test, expect } from '@playwright/test';

// T044b: Segment persistence E2E — skipped until full wiring (T048) complete
test.describe('Segment Persistence', () => {
	test('page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('main')).toBeVisible();
	});

	test.skip('saves a segment and shows it in the list', async ({ page }) => {
		await page.goto('/?v=dQw4w9WgXcQ');
		// Wait for player to be ready
		// Set A, set B
		// Fill segment name
		// Click Save Loop
		// Verify segment appears in list
	});

	test.skip('segment persists after page reload', async ({ page: _page }) => {
		// Save segment as above
		// Reload page
		// Verify segment still in list
	});

	test.skip('clicking Load activates loop', async ({ page: _page }) => {
		// Save segment
		// Reload page
		// Click Load button
		// Verify loop is active
	});
});
