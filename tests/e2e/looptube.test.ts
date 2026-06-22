import { test, expect } from '@playwright/test';

// T012: Dark-theme mobile layout — fails until T013-T018 complete

test.describe('Dark-theme mobile layout (375px)', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('no horizontal overflow', async ({ page }) => {
		await page.goto('/');
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		expect(bodyWidth).toBeLessThanOrEqual(375);
	});

	test('LOOPTUBE logotype is present', async ({ page }) => {
		await page.goto('/');
		const logotype = page.getByText('LOOPTUBE');
		await expect(logotype).toBeVisible();
	});

	test('primary interactive controls are within viewport', async ({ page }) => {
		await page.goto('/');
		// All buttons must be within the 375px viewport — none overflowing right
		const buttons = page.locator('button');
		const count = await buttons.count();
		for (let i = 0; i < count; i++) {
			const box = await buttons.nth(i).boundingBox();
			if (box) {
				expect(box.x + box.width).toBeLessThanOrEqual(375 + 1); // 1px tolerance
			}
		}
	});

	test('page has dark background color', async ({ page }) => {
		await page.goto('/');
		const bgColor = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
		);
		// CSS custom property --color-bg must be defined (non-empty = dark theme applied)
		expect(bgColor).not.toBe('');
	});
});
