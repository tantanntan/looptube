import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import PlaybackControls from '../../src/lib/components/PlaybackControls.svelte';
import { createTranslator } from '../../src/lib/i18n/index.js';

afterEach(() => cleanup());

const t = createTranslator('en');

describe('PlaybackControls.svelte', () => {
	it('displays ∞ symbol when loopCount is infinite', () => {
		render(PlaybackControls, { loopCount: 'infinite', loopsCompleted: 0, t });
		expect(screen.getByText('∞')).toBeTruthy();
	});

	it('displays numeric loop count', () => {
		render(PlaybackControls, { loopCount: 3, loopsCompleted: 0, t });
		expect(screen.getByText('3')).toBeTruthy();
	});

	it('displays N/M counter when loopCount is finite', () => {
		render(PlaybackControls, { loopCount: 5, loopsCompleted: 2, t: (k: string) => k });
		expect(screen.getByText('2 / 5')).toBeTruthy();
	});

	it('does not display N/M counter when loopCount is infinite', () => {
		render(PlaybackControls, { loopCount: 'infinite', loopsCompleted: 0, t: (k: string) => k });
		expect(screen.queryByText(/\/$/)).toBeNull();
	});

	it('calls onLoopCountChange with decremented value when − is clicked', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { loopCount: 3, onLoopCountChange, t });
		await fireEvent.click(screen.getByRole('button', { name: 'ループ回数を減らす' }));
		expect(onLoopCountChange).toHaveBeenCalledWith(2);
	});

	it('calls onLoopCountChange with incremented value when + is clicked', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { loopCount: 3, onLoopCountChange, t });
		await fireEvent.click(screen.getByRole('button', { name: 'ループ回数を増やす' }));
		expect(onLoopCountChange).toHaveBeenCalledWith(4);
	});

	it('calls onLoopCountChange with infinite when + is clicked at 99', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { loopCount: 99, onLoopCountChange, t });
		await fireEvent.click(screen.getByRole('button', { name: 'ループ回数を増やす' }));
		expect(onLoopCountChange).toHaveBeenCalledWith('infinite');
	});

	it('calls onLoopCountChange with 99 when − is clicked at infinite', async () => {
		const onLoopCountChange = vi.fn();
		render(PlaybackControls, { loopCount: 'infinite', onLoopCountChange, t });
		await fireEvent.click(screen.getByRole('button', { name: 'ループ回数を減らす' }));
		expect(onLoopCountChange).toHaveBeenCalledWith(99);
	});
});
