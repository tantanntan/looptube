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
});
