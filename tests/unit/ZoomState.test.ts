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
});
