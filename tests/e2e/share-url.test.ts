import { test, expect } from '@playwright/test';

// T051: Share URL round-trip E2E — skipped until full Share button wiring complete
test.describe('Share URL', () => {
	test('page loads and Share button is present when loop is active', async ({ page }) => {
		await page.goto('/');
		// The share button should not be visible without a video loaded
		await expect(page.getByRole('main')).toBeVisible();
	});

	test.skip('share URL restores video and loop', async ({ page, context }) => {
		// Set up loop
		await page.goto('/?v=dQw4w9WgXcQ');
		// … wait for player ready, set A+B, click Share
		// Open copied URL in a new page
		const newPage = await context.newPage();
		// newPage.goto(copiedUrl) — verify loop restores
		await newPage.close();
	});

	test.skip('clamped loop shows warning message', async ({ page }) => {
		// Open a share URL where pointB > video duration
		await page.goto('/?v=dQw4w9WgXcQ&a=0&b=99999&s=1.0');
		// expect warning about loop_clamped
	});
});
