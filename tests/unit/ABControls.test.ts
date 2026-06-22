import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import ABControls from '../../src/lib/components/ABControls.svelte';
import { createTranslator } from '../../src/lib/i18n/index.js';

const t = createTranslator('en');

afterEach(() => cleanup());

describe('ABControls.svelte', () => {
	it('renders Set A and Set B buttons', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		expect(screen.getByRole('button', { name: /^set a$/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: /^set b$/i })).toBeTruthy();
	});

	it('displays pointA in MM:SS.s format when set', () => {
		render(ABControls, { pointA: 63.2, pointB: null, t });
		// renders as 'A: 01:03.2'
		expect(screen.getByText(/01:03\.2/)).toBeTruthy();
	});

	it('displays pointB in MM:SS.s format when set', () => {
		render(ABControls, { pointB: 78.5, pointA: null, t });
		// renders as 'B: 01:18.5'
		expect(screen.getByText(/01:18\.5/)).toBeTruthy();
	});

	it('displays em-dash placeholder when pointA is not set', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		// 'A: —' and 'B: —' are shown when neither point is set
		const dashes = screen.getAllByText(/—/);
		expect(dashes.length).toBeGreaterThanOrEqual(2);
	});

	it('calls onSetA callback when A button clicked', async () => {
		const onSetA = vi.fn();
		render(ABControls, { pointA: null, pointB: null, t, onSetA });
		await fireEvent.click(screen.getByRole('button', { name: /^set a$/i }));
		expect(onSetA).toHaveBeenCalledOnce();
	});

	it('calls onSetB callback when B button clicked', async () => {
		const onSetB = vi.fn();
		render(ABControls, { pointA: null, pointB: null, t, onSetB });
		await fireEvent.click(screen.getByRole('button', { name: /^set b$/i }));
		expect(onSetB).toHaveBeenCalledOnce();
	});

	it('calls onNudgeA with +0.1 when +0.1 A button clicked', async () => {
		const onNudgeA = vi.fn();
		render(ABControls, { pointA: 10, pointB: null, t, onNudgeA });
		await fireEvent.click(screen.getByRole('button', { name: /\+0\.1 A/i }));
		expect(onNudgeA).toHaveBeenCalledWith(0.1);
	});

	it('hides nudge and clear A buttons when pointA is null', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		expect(screen.queryByRole('button', { name: /\+0\.1 A/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /clear a/i })).toBeNull();
	});

	it('hides Clear Loop button when both points are null', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		// 'Clear Loop' = t('loop.clear_all') in en locale
		expect(screen.queryByRole('button', { name: /clear loop/i })).toBeNull();
	});
});
