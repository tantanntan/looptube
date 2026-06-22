import { describe, it, expect } from 'vitest';
import { computeZoomWindow } from '../../src/lib/utils/timeline.js';

describe('computeZoomWindow', () => {
	it('returns a window with padding around A-B region', () => {
		const w = computeZoomWindow(10, 20, 60);
		expect(w.start).toBeLessThan(10);
		expect(w.end).toBeGreaterThan(20);
	});

	it('clamps start to 0 when loop is near beginning', () => {
		const w = computeZoomWindow(0, 5, 60);
		expect(w.start).toBe(0);
		expect(w.end).toBeGreaterThanOrEqual(5);
	});

	it('clamps end to duration when loop is near end', () => {
		const w = computeZoomWindow(55, 60, 60);
		expect(w.end).toBe(60);
		expect(w.start).toBeLessThanOrEqual(55);
	});

	it('handles very short loop (< 1 s) without crashing', () => {
		const w = computeZoomWindow(10, 10.5, 60);
		expect(w.start).toBeLessThanOrEqual(10);
		expect(w.end).toBeGreaterThanOrEqual(10.5);
		expect(w.end - w.start).toBeGreaterThan(0);
	});

	it('start is always < end', () => {
		const w = computeZoomWindow(0, 60, 60);
		expect(w.start).toBeLessThan(w.end);
	});

	it('window spans at least the A-B range', () => {
		const w = computeZoomWindow(30, 40, 60);
		expect(w.start).toBeLessThanOrEqual(30);
		expect(w.end).toBeGreaterThanOrEqual(40);
	});

	it('for sub-second loop (0.5s span), A-B occupies at least 50% of window width', () => {
		// span = 0.5s, so window must be ≤ 1.0s for loop to be ≥ 50%
		const w = computeZoomWindow(10, 10.5, 60);
		const windowWidth = w.end - w.start;
		const span = 0.5;
		const ratio = span / windowWidth;
		expect(ratio).toBeGreaterThanOrEqual(0.5);
	});

	it('for any loop span, A-B always occupies at least 50% of window width', () => {
		const cases: [number, number][] = [
			[10, 10.2],  // 0.2s
			[10, 11],    // 1s
			[10, 20],    // 10s
		];
		for (const [a, b] of cases) {
			const w = computeZoomWindow(a, b, 120);
			const windowWidth = w.end - w.start;
			const span = b - a;
			expect(span / windowWidth).toBeGreaterThanOrEqual(0.5);
		}
	});
});
