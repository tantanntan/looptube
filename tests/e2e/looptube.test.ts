import { test, expect } from '@playwright/test';

// T021: Timeline drag and zoom — fails until T023-T025 complete
test.describe('Timeline drag and zoom (T021 - RED)', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('timeline track element is present on the page', async ({ page }) => {
		// Timeline.svelte must render data-testid="timeline-track"
		// FAILS before T023: ProgressBar has no timeline-track test id
		await page.goto('/');
		const timeline = page.locator('[data-testid="timeline-track"]');
		await expect(timeline).toBeVisible();
	});

	test('zoom button appears when A-B loop is active', async ({ page }) => {
		// Zoom button only renders when pointA !== null && pointB !== null (contract)
		// FAILS before T023/T024: Timeline.svelte not yet implemented
		await page.goto('/');
		await page.keyboard.press('a');
		await page.keyboard.press('b');
		const zoomBtn = page.getByRole('button', { name: /zoom/i });
		await expect(zoomBtn).toBeVisible();
	});

	test('zoom button is not present when no A-B loop is set', async ({ page }) => {
		// On fresh load with no A/B points the zoom button must be absent
		// FAILS before T023: ProgressBar has no zoom button at all, but Timeline.svelte
		// must ensure the button is specifically absent (not just hidden via CSS)
		await page.goto('/');
		const zoomBtn = page.locator('[data-testid="zoom-toggle"]');
		await expect(zoomBtn).not.toBeAttached();
	});
});

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
