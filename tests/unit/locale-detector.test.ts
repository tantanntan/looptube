import { describe, it, expect } from 'vitest';
import { parseLocale } from '../../src/lib/i18n/index.js';

describe('parseLocale — RFC 5646 Accept-Language edge cases', () => {
	it('parses ja-JP to ja', () => {
		expect(parseLocale('ja-JP')).toBe('ja');
	});

	it('parses ja-Hira-JP script/region variant to ja', () => {
		expect(parseLocale('ja-Hira-JP')).toBe('ja');
	});

	it('parses en-US to en', () => {
		expect(parseLocale('en-US')).toBe('en');
	});

	it('handles multi-tag header with quality values — ja first wins', () => {
		expect(parseLocale('ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('ja');
	});

	it('handles multi-tag header — en first wins over ja', () => {
		expect(parseLocale('en-US,en;q=0.9,ja;q=0.8')).toBe('en');
	});

	it('falls back to en when only unknown language present', () => {
		expect(parseLocale('fr-FR,fr;q=0.9')).toBe('en');
		expect(parseLocale('de-DE,de;q=0.9')).toBe('en');
	});

	it('falls back to en when wildcard * is the only entry', () => {
		expect(parseLocale('*')).toBe('en');
	});

	it('falls back to en for empty Accept-Language', () => {
		expect(parseLocale('')).toBe('en');
	});

	it('falls back to en for malformed quality value', () => {
		expect(parseLocale('ja;q=abc')).toBe('ja');
	});

	it('falls back to en for completely malformed header', () => {
		expect(parseLocale(';;;')).toBe('en');
	});

	it('handles header with spaces around commas', () => {
		expect(parseLocale('ja, en;q=0.9')).toBe('ja');
	});

	it('handles uppercase language tags case-insensitively', () => {
		expect(parseLocale('JA-JP')).toBe('ja');
		expect(parseLocale('EN-US')).toBe('en');
	});
});
