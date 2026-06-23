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

	it('highlights Set A before A is set and Set B after only A is set', () => {
		const { unmount } = render(ABControls, { pointA: null, pointB: null, videoReady: true, t });
		expect(screen.getByRole('button', { name: /^set a$/i })).toHaveClass('ab-btn-glow-active');
		expect(screen.getByRole('button', { name: /^set b$/i })).not.toHaveClass(
			'ab-btn-glow-active'
		);

		unmount();
		render(ABControls, { pointA: 10, pointB: null, videoReady: true, t });
		expect(screen.getByRole('button', { name: /^set a$/i })).not.toHaveClass(
			'ab-btn-glow-active'
		);
		expect(screen.getByRole('button', { name: /^set b$/i })).toHaveClass('ab-btn-glow-active');
	});

	it('does not highlight Set A or Set B before the video is ready', () => {
		const { unmount } = render(ABControls, { pointA: null, pointB: null, videoReady: false, t });
		expect(screen.getByRole('button', { name: /^set a$/i })).not.toHaveClass(
			'ab-btn-glow-active'
		);
		expect(screen.getByRole('button', { name: /^set b$/i })).not.toHaveClass(
			'ab-btn-glow-active'
		);

		unmount();
		render(ABControls, { pointA: 10, pointB: null, videoReady: false, t });
		expect(screen.getByRole('button', { name: /^set b$/i })).not.toHaveClass(
			'ab-btn-glow-active'
		);
	});

	it('displays pointA in MM:SS:FF format when set', () => {
		render(ABControls, { pointA: 63.2, pointB: null, t });
		// formatTimecode(63.2, 30) = '01:03:06'
		expect(screen.getByText(/01:03:06/)).toBeTruthy();
	});

	it('displays pointB in MM:SS:FF format when set', () => {
		render(ABControls, { pointB: 78.5, pointA: null, t });
		// formatTimecode(78.5, 30) = '01:18:15'
		expect(screen.getByText(/01:18:15/)).toBeTruthy();
	});

	it('hides unset point placeholders in compact state', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		expect(screen.queryByText('--:--:--')).toBeNull();
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

	it('shows loupe slider for A when pointA is set', () => {
		render(ABControls, { pointA: 10, pointB: null, t });
		expect(screen.getByRole('slider', { name: /point a/i })).toBeTruthy();
	});

	it('hides Clear A button when pointA is null', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		expect(screen.queryByRole('button', { name: /clear a/i })).toBeNull();
	});

	it('hides Clear Loop button when both points are null', () => {
		render(ABControls, { pointA: null, pointB: null, t });
		// 'Clear Loop' = t('loop.clear_all') in en locale
		expect(screen.queryByRole('button', { name: /clear loop/i })).toBeNull();
	});
});
