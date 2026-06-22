import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import ABControls from '../../src/lib/components/ABControls.svelte';

afterEach(() => cleanup());

describe('ABControls.svelte', () => {
	it('renders Set A and Set B buttons', () => {
		render(ABControls, { pointA: null, pointB: null });
		expect(screen.getByRole('button', { name: /^set a$/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: /^set b$/i })).toBeTruthy();
	});

	it('displays pointA value when set', () => {
		render(ABControls, { pointA: 63.2, pointB: null });
		expect(screen.getByText(/63\.2/)).toBeTruthy();
	});

	it('displays pointB value when set', () => {
		render(ABControls, { pointB: 78.5, pointA: null });
		expect(screen.getByText(/78\.5/)).toBeTruthy();
	});

	it('calls onSetA callback when A button clicked', async () => {
		const onSetA = vi.fn();
		render(ABControls, { pointA: null, pointB: null, onSetA });
		await fireEvent.click(screen.getByRole('button', { name: /^set a$/i }));
		expect(onSetA).toHaveBeenCalledOnce();
	});

	it('calls onSetB callback when B button clicked', async () => {
		const onSetB = vi.fn();
		render(ABControls, { pointA: null, pointB: null, onSetB });
		await fireEvent.click(screen.getByRole('button', { name: /^set b$/i }));
		expect(onSetB).toHaveBeenCalledOnce();
	});

	it('calls onNudgeA with +0.1 when +0.1 A button clicked', async () => {
		const onNudgeA = vi.fn();
		render(ABControls, { pointA: 10, pointB: null, onNudgeA });
		await fireEvent.click(screen.getByRole('button', { name: /\+0\.1 A/i }));
		expect(onNudgeA).toHaveBeenCalledWith(0.1);
	});

	// T026a: failing tests — require formatTime display and conditional Clear All (T026)
	it('displays pointA in MM:SS.s format when set', () => {
		const t = (key: string) => key;
		render(ABControls, { pointA: 63.2, pointB: null, t });
		// formatTime(63.2) = '01:03.2' — FAILS until T026 (currently shows '63.2 s')
		expect(screen.getByText('01:03.2')).toBeTruthy();
	});

	it('displays em-dash placeholder when pointA is not set', () => {
		const t = (key: string) => key;
		render(ABControls, { pointA: null, pointB: null, t });
		// contracts: show '—' when point not set — FAILS until T026 (currently 'not set')
		const dashes = screen.getAllByText('—');
		expect(dashes.length).toBeGreaterThanOrEqual(2);
	});

	it('hides Clear All button when both points are null', () => {
		const t = (key: string) => key;
		render(ABControls, { pointA: null, pointB: null, t });
		// contracts: Clear All hidden when both points null — FAILS until T026 (currently always shown)
		expect(screen.queryByRole('button', { name: /clear all/i })).toBeNull();
	});
});
