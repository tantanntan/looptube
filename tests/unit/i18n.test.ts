import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { parseLocale, createTranslator } from '../../src/lib/i18n/index.js';

describe('parseLocale', () => {
	it('returns "en" for plain English tag', () => {
		expect(parseLocale('en')).toBe('en');
	});

	it('returns "en" for en-US region tag', () => {
		expect(parseLocale('en-US')).toBe('en');
	});

	it('returns "en" for en-GB region tag', () => {
		expect(parseLocale('en-GB')).toBe('en');
	});

	it('returns "ja" for plain Japanese tag', () => {
		expect(parseLocale('ja')).toBe('ja');
	});

	it('returns "ja" for ja-JP region tag', () => {
		expect(parseLocale('ja-JP')).toBe('ja');
	});

	it('falls back to "en" for empty string', () => {
		expect(parseLocale('')).toBe('en');
	});

	it('falls back to "en" for unknown language', () => {
		expect(parseLocale('fr')).toBe('en');
		expect(parseLocale('zh-CN')).toBe('en');
		expect(parseLocale('de')).toBe('en');
	});

	it('parses RFC 5646 multi-tag header, highest quality wins', () => {
		expect(parseLocale('ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('ja');
		expect(parseLocale('en-US,en;q=0.9,ja;q=0.8')).toBe('en');
	});

	it('falls back to "en" for wildcard only', () => {
		expect(parseLocale('*')).toBe('en');
	});

	it('falls back to "en" for malformed header', () => {
		expect(parseLocale(';;;')).toBe('en');
	});
});

describe('createTranslator', () => {
	it('looks up English string for player.load', () => {
		const t = createTranslator('en');
		expect(t('player.load')).toBe('Load');
	});

	it('looks up English string for loop.set_a', () => {
		const t = createTranslator('en');
		expect(t('loop.set_a')).toBe('Set A');
	});

	it('looks up Japanese string for player.load', () => {
		const t = createTranslator('ja');
		expect(t('player.load')).toBe('読み込む');
	});

	it('looks up Japanese string for loop.set_a', () => {
		const t = createTranslator('ja');
		expect(t('loop.set_a')).toBe('A点をセット');
	});

	it('returns the key itself as fallback for missing key', () => {
		const t = createTranslator('en');
		expect(t('nonexistent.key')).toBe('nonexistent.key');
	});

	it('looks up new loops.section_heading key', () => {
		const t = createTranslator('en');
		const result = t('loops.section_heading');
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
		expect(result).not.toBe('loops.section_heading');
	});

	it('looks up new loops.save_button key', () => {
		const t = createTranslator('en');
		const result = t('loops.save_button');
		expect(result).not.toBe('loops.save_button');
	});

	it('looks up new loops.delete_confirm key', () => {
		const t = createTranslator('en');
		expect(t('loops.delete_confirm')).not.toBe('loops.delete_confirm');
	});

	it('looks up new loops.confirm_yes and confirm_no keys', () => {
		const t = createTranslator('en');
		expect(t('loops.confirm_yes')).not.toBe('loops.confirm_yes');
		expect(t('loops.confirm_no')).not.toBe('loops.confirm_no');
	});

	it('looks up new loops.empty key', () => {
		const t = createTranslator('en');
		expect(t('loops.empty')).not.toBe('loops.empty');
	});

	it('looks up new timeline.zoom_in key', () => {
		const t = createTranslator('en');
		expect(t('timeline.zoom_in')).not.toBe('timeline.zoom_in');
	});

	it('looks up new timeline.zoom_out key', () => {
		const t = createTranslator('en');
		expect(t('timeline.zoom_out')).not.toBe('timeline.zoom_out');
	});

	it('looks up new playback.counter key', () => {
		const t = createTranslator('en');
		expect(t('playback.counter')).not.toBe('playback.counter');
	});

	it('looks up loops.* keys in Japanese', () => {
		const t = createTranslator('ja');
		expect(t('loops.section_heading')).not.toBe('loops.section_heading');
		expect(t('loops.save_button')).not.toBe('loops.save_button');
	});

	it('different locales return different strings for same key', () => {
		const en = createTranslator('en');
		const ja = createTranslator('ja');
		expect(en('player.load')).not.toBe(ja('player.load'));
	});
});

// T037: SC-007 compliance — no hard-coded user-facing strings in Svelte templates
describe('SC-007: no hard-coded user-facing strings in Svelte templates', () => {
	const EXEMPT = new Set(['LOOPTUBE', 'A', 'B', '×', '∞', 'MM:SS.s', '—', '0', '+0.1', '−0.1', '-0.1', 'Set A', 'Set B', 'Clear Loop']);

	// English strings that must come from t() calls, not be hard-coded
	const EN_STRINGS = [
		'Saved Loops',
		'No saved loops',
		'Delete this loop',
		'Load',
		'Speed',
		'Loop Count',
	];

	function getSvelteFiles(dir: string): string[] {
		const results: string[] = [];
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
				results.push(...getSvelteFiles(full));
			} else if (entry.name.endsWith('.svelte')) {
				results.push(full);
			}
		}
		return results;
	}

	const srcDir = resolve('src');
	const svelteFiles = getSvelteFiles(srcDir);

	for (const str of EN_STRINGS) {
		if (EXEMPT.has(str)) continue;
		it(`"${str}" does not appear hard-coded in any Svelte template`, () => {
			const violations = svelteFiles.filter((f) => {
				const content = readFileSync(f, 'utf-8');
				// Only check the HTML template section (after </script>)
				const templatePart = content.split('</script>').slice(1).join('</script>');
				// Exempt {t('...')} calls and inside t() translations
				return templatePart.includes(`>${str}<`) || templatePart.includes(`"${str}"`) && !templatePart.includes(`t('`) ;
			});
			expect(violations, `Hard-coded "${str}" found in: ${violations.join(', ')}`).toHaveLength(0);
		});
	}
});
