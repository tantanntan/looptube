import { test, expect } from '@playwright/test';

// T055: Accessibility E2E — requires @axe-core/playwright (not yet installed)
// These tests verify WCAG 2.1 AA compliance for the main player page.

test.describe('Accessibility', () => {
	test('page has accessible landmark structure', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('main')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('URL input has a label', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByLabel(/youtube url or video id/i)).toBeVisible();
	});

	test.skip('axe-core: zero WCAG violations on main page', async ({ page: _page }) => {
		// Requires: pnpm add -D @axe-core/playwright
		// const { checkA11y } = await import('@axe-core/playwright');
		// await page.goto('/');
		// await checkA11y(page, undefined, { runOnly: ['wcag2a', 'wcag2aa'] });
	});
});
