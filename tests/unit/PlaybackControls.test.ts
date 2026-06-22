import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import PlaybackControls from '../../src/lib/components/PlaybackControls.svelte';

afterEach(() => cleanup());

describe('PlaybackControls.svelte', () => {
	it('renders speed selector with 6 options', () => {
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite' });
		const select = screen.getByRole('combobox', { name: /speed/i });
		expect(select).toBeTruthy();
		const options = select.querySelectorAll('option');
		expect(options.length).toBe(6);
	});

	it('calls onSpeedChange when speed is selected', async () => {
		const onSpeedChange = vi.fn();
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite', onSpeedChange });
		const select = screen.getByRole('combobox', { name: /speed/i });
		await fireEvent.change(select, { target: { value: '0.5' } });
		expect(onSpeedChange).toHaveBeenCalledWith(0.5);
	});

	it('renders loop count input', () => {
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite' });
		expect(screen.getByRole('spinbutton', { name: /loop count/i })).toBeTruthy();
	});

	it('calls onLoopCountChange with number when count is set', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite', onLoopCountChange });
		const input = screen.getByRole('spinbutton', { name: /loop count/i });
		await fireEvent.change(input, { target: { value: '3' } });
		expect(onLoopCountChange).toHaveBeenCalledWith(3);
	});

	it('calls onLoopCountChange with infinite when 0 is entered', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { speed: 1.0, loopCount: 3, onLoopCountChange });
		const input = screen.getByRole('spinbutton', { name: /loop count/i });
		await fireEvent.change(input, { target: { value: '0' } });
		expect(onLoopCountChange).toHaveBeenCalledWith('infinite');
	});

	// T027a: Failing tests — pass after T028-T029
	it('speed selector includes 0.25x option', () => {
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite', loopsCompleted: 0, t: (k: string) => k });
		const select = screen.getByRole('combobox', { name: /speed/i });
		const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
		expect(options).toContain('0.25');
	});

	it('displays N/M counter when loopCount is a finite number', () => {
		render(PlaybackControls, { speed: 1.0, loopCount: 5, loopsCompleted: 2, t: (k: string) => k });
		expect(screen.getByText('2 / 5')).toBeTruthy();
	});

	it('displays ∞ symbol when loopCount is infinite', () => {
		render(PlaybackControls, { speed: 1.0, loopCount: 'infinite', loopsCompleted: 0, t: (k: string) => k });
		expect(screen.getByText('∞')).toBeTruthy();
	});
});
