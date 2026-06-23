import { test, expect } from '@playwright/test';

// T056: i18n E2E — locale switching between en and ja
// These tests verify that locale switching shows translated strings.

test.describe('i18n', () => {
	test('English locale shows English UI', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText(/LoopTube/i)).toBeVisible();
	});

	test.skip('all visible strings change when locale switches', async ({ page: _page }) => {
		// Visit / then /ja/ and compare text content of key UI elements
	});
});

// T035: Accept-Language locale detection — fails until T036 confirmed correct SSR wiring
test.describe('Accept-Language locale detection (T035 - RED)', () => {
	test('Accept-Language: ja shows Japanese strings', async ({ browser }) => {
		const context = await browser.newContext({
			locale: 'ja',
			extraHTTPHeaders: { 'Accept-Language': 'ja,ja-JP;q=0.9' }
		});
		const page = await context.newPage();
		await page.goto('/');
		// '保存済みループ' = t('loops.section_heading') in ja locale
		await expect(page.getByText('保存済みループ')).toBeVisible();
		await context.close();
	});

	test('Accept-Language: en shows English strings', async ({ browser }) => {
		const context = await browser.newContext({
			extraHTTPHeaders: { 'Accept-Language': 'en,en-US;q=0.9' }
		});
		const page = await context.newPage();
		await page.goto('/');
		await expect(page.getByText('Saved Loops')).toBeVisible();
		await context.close();
	});

	test('no locale header falls back to English', async ({ browser }) => {
		const context = await browser.newContext({
			extraHTTPHeaders: {}
		});
		const page = await context.newPage();
		await page.goto('/');
		await expect(page.getByText('Saved Loops')).toBeVisible();
		await context.close();
	});
});
