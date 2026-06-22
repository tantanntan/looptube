import { describe, it, expect } from 'vitest';
import { UrlSerializer } from '../../src/lib/core/UrlSerializer.js';

describe('UrlSerializer', () => {
	describe('parse()', () => {
		it('parses a fully valid URL', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=dQw4w9WgXcQ&a=63.2&b=78.5&s=0.75'
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.videoId).toBe('dQw4w9WgXcQ');
				expect(result.pointA).toBeCloseTo(63.2);
				expect(result.pointB).toBeCloseTo(78.5);
				expect(result.speed).toBe(0.75);
				expect(result.warnings).toEqual([]);
			}
		});

		it('parses a plain query string (no protocol)', () => {
			const result = UrlSerializer.parse('v=dQw4w9WgXcQ&a=10&b=20&s=1.0');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.videoId).toBe('dQw4w9WgXcQ');
				expect(result.pointA).toBe(10);
				expect(result.pointB).toBe(20);
			}
		});

		it('returns ok:false for missing videoId', () => {
			const result = UrlSerializer.parse('https://looptube.io/?a=10&b=20');
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
		});

		it('returns ok:false when pointA >= pointB', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=50&b=30'
			);
			expect(result.ok).toBe(false);
		});

		it('defaults speed to 1.0 with warning when speed is unrecognized', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=10&b=20&s=3.0'
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.speed).toBe(1.0);
				expect(result.warnings.length).toBeGreaterThan(0);
			}
		});

		it('defaults speed to 1.0 when s param is absent', () => {
			const result = UrlSerializer.parse('https://looptube.io/?v=abc&a=5&b=15');
			expect(result.ok).toBe(true);
			if (result.ok) expect(result.speed).toBe(1.0);
		});

		it('returns ok:false when pointA param is missing', () => {
			const result = UrlSerializer.parse('https://looptube.io/?v=abc&b=20');
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.errors.some((e) => e.includes('pointA'))).toBe(true);
		});

		it('returns ok:false when pointB param is missing', () => {
			const result = UrlSerializer.parse('https://looptube.io/?v=abc&a=10');
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.errors.some((e) => e.includes('pointB'))).toBe(true);
		});

		it('returns ok:false for non-numeric pointA', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=xyz&b=20'
			);
			expect(result.ok).toBe(false);
		});

		it('returns ok:false for negative pointA', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=-5&b=20'
			);
			expect(result.ok).toBe(false);
		});

		it('returns ok:false for non-numeric pointB', () => {
			const result = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=10&b=xyz'
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe('encode()', () => {
		it('encodes parameters into URL search string', () => {
			const result = UrlSerializer.encode({
				videoId: 'dQw4w9WgXcQ',
				pointA: 63.2,
				pointB: 78.5,
				speed: 0.75
			});
			expect(result).toContain('v=dQw4w9WgXcQ');
			expect(result).toContain('a=63.2');
			expect(result).toContain('b=78.5');
			expect(result).toContain('s=0.75');
		});

		it('round-trips through encode → parse', () => {
			const input = { videoId: 'testID123', pointA: 10.5, pointB: 25.0, speed: 1.25 };
			const encoded = UrlSerializer.encode(input);
			const parsed = UrlSerializer.parse(`https://example.com/?${encoded}`);
			expect(parsed.ok).toBe(true);
			if (parsed.ok) {
				expect(parsed.videoId).toBe(input.videoId);
				expect(parsed.pointA).toBeCloseTo(input.pointA);
				expect(parsed.pointB).toBeCloseTo(input.pointB);
				expect(parsed.speed).toBe(input.speed);
			}
		});
	});

	describe('clampToDuration()', () => {
		it('clamps pointB when it exceeds duration', () => {
			const parsed = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=10&b=120'
			);
			expect(parsed.ok).toBe(true);
			if (parsed.ok) {
				const clamped = UrlSerializer.clampToDuration(parsed, 90);
				expect(clamped.pointB).toBe(90);
				expect(clamped.clamped).toBe(true);
				expect(clamped.message).toBeTruthy();
			}
		});

		it('does not clamp when values are within duration', () => {
			const parsed = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=10&b=30'
			);
			expect(parsed.ok).toBe(true);
			if (parsed.ok) {
				const clamped = UrlSerializer.clampToDuration(parsed, 90);
				expect(clamped.clamped).toBe(false);
				expect(clamped.pointA).toBe(10);
				expect(clamped.pointB).toBe(30);
			}
		});

		it('clamps pointA when pointB is clamped to duration leaving pointA >= pointB', () => {
			// pointB=30 clamped to duration=5, then pointA=10 >= clamped pointB=5
			const parsed = UrlSerializer.parse(
				'https://looptube.io/?v=abc&a=10&b=30'
			);
			expect(parsed.ok).toBe(true);
			if (parsed.ok) {
				const clamped = UrlSerializer.clampToDuration(parsed, 5);
				expect(clamped.clamped).toBe(true);
				expect(clamped.pointB).toBe(5);
				expect(clamped.pointA).toBe(4); // Math.max(0, 5 - 1) = 4
			}
		});
	});
});
