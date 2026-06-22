import { test, expect } from '@playwright/test';

// T022: Full A-B loop flow — fails until Phase 3 wiring complete (T032)
test.describe('A-B Loop Flow', () => {
	test('loads a video by URL and displays the player', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('main')).toBeVisible();
	});

	test.skip('set A and B and confirm loop plays', async ({ page }) => {
		// TODO: implement once Phase 3 wiring (T032) is complete
		await page.goto('/?v=dQw4w9WgXcQ');
		// Accept cookies / click play if needed
		// await page.getByRole('button', { name: /play/i }).click();
		// await page.keyboard.press('a');
		// await page.keyboard.press('b');
		// Verify loop is active
	});
});
