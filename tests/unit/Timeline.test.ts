import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import Timeline from '../../src/lib/components/Timeline.svelte';

afterEach(() => cleanup());

const props = {
	currentTime: 0,
	duration: 120,
	pointA: null,
	pointB: null,
	speed: 1,
	t: (key: string) => key,
	onDragA: vi.fn(),
	onDragB: vi.fn(),
	onSeek: vi.fn()
};

describe('Timeline.svelte', () => {
	it('renders the full playback speed chip set with 1.0 selected by default', () => {
		render(Timeline, props);

		for (const label of ['0.25×', '0.5×', '0.75×', '1.0×', '1.5×', '2.0×']) {
			expect(screen.getByRole('button', { name: label })).toBeTruthy();
		}

		expect(screen.getByRole('button', { name: '1.0×' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	it('emits 2.0 when the 2.0 speed chip is clicked', async () => {
		const onSpeedChange = vi.fn();
		render(Timeline, { ...props, onSpeedChange });

		await fireEvent.click(screen.getByRole('button', { name: '2.0×' }));

		expect(onSpeedChange).toHaveBeenCalledWith(2);
	});
});
