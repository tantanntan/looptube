import { describe, it, expect } from 'vitest';
import {
	clampPointA,
	clampPointB,
	pxToSeconds,
	secondsToPercent,
	formatTime
} from '../../src/lib/utils/timeline.js';

describe('clampPointA', () => {
	it('clamps to 0 at lower bound', () => {
		expect(clampPointA(-1, 10, 60)).toBe(0);
	});

	it('clamps to pointB - 0.1 as upper bound (min gap)', () => {
		expect(clampPointA(10, 10, 60)).toBeCloseTo(9.9);
	});

	it('allows value well below pointB', () => {
		expect(clampPointA(5, 10, 60)).toBe(5);
	});

	it('clamps to 0 when duration is shorter', () => {
		expect(clampPointA(0, 5, 60)).toBe(0);
	});

	it('clamps past duration boundary', () => {
		expect(clampPointA(100, null, 60)).toBe(60);
	});
});

describe('clampPointB', () => {
	it('clamps to duration at upper bound', () => {
		expect(clampPointB(100, 10, 60)).toBe(60);
	});

	it('clamps to pointA + 0.1 as lower bound (min gap)', () => {
		expect(clampPointB(10, 10, 60)).toBeCloseTo(10.1);
	});

	it('allows value well above pointA', () => {
		expect(clampPointB(20, 10, 60)).toBe(20);
	});

	it('clamps to 0.1 when pointA is null', () => {
		expect(clampPointB(0, null, 60)).toBeCloseTo(0.1);
	});
});

describe('pxToSeconds', () => {
	it('converts full-width pixel to seconds (full-video mode)', () => {
		// 300px wide track, duration 60s, pointer at 150px → 30s
		expect(pxToSeconds(150, 300, 60, null)).toBeCloseTo(30);
	});

	it('converts pixel to seconds in zoom mode', () => {
		// Zoom window [10, 20], 300px wide, pointer at 0px → 10s
		const zoomWindow = { start: 10, end: 20 };
		expect(pxToSeconds(0, 300, 60, zoomWindow)).toBeCloseTo(10);
	});

	it('converts pixel to seconds in zoom mode at 100%', () => {
		// Zoom window [10, 20], 300px wide, pointer at 300px → 20s
		const zoomWindow = { start: 10, end: 20 };
		expect(pxToSeconds(300, 300, 60, zoomWindow)).toBeCloseTo(20);
	});

	it('clamps negative px to start of range', () => {
		expect(pxToSeconds(-10, 300, 60, null)).toBe(0);
	});

	it('clamps px beyond width to end of range', () => {
		expect(pxToSeconds(400, 300, 60, null)).toBe(60);
	});
});

describe('secondsToPercent', () => {
	it('converts seconds to percent in full-video mode', () => {
		// 30s of 60s = 50%
		expect(secondsToPercent(30, 60, null)).toBeCloseTo(50);
	});

	it('converts seconds to percent in zoom mode', () => {
		// zoom window [10, 20], 15s → 50%
		const zoomWindow = { start: 10, end: 20 };
		expect(secondsToPercent(15, 60, zoomWindow)).toBeCloseTo(50);
	});

	it('returns 0 for start of range', () => {
		expect(secondsToPercent(0, 60, null)).toBe(0);
	});

	it('returns 100 for end of range', () => {
		expect(secondsToPercent(60, 60, null)).toBe(100);
	});
});

describe('formatTime', () => {
	it('formats 0 seconds', () => {
		expect(formatTime(0)).toBe('00:00.0');
	});

	it('formats seconds with tenths', () => {
		expect(formatTime(1.5)).toBe('00:01.5');
	});

	it('formats a full minute', () => {
		expect(formatTime(60)).toBe('01:00.0');
	});

	it('formats minutes and seconds', () => {
		expect(formatTime(90.3)).toBe('01:30.3');
	});

	it('formats large values', () => {
		expect(formatTime(3723.9)).toBe('62:03.9');
	});
});
