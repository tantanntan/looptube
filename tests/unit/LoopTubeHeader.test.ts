import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import LoopTubeHeader from '../../src/lib/components/LoopTubeHeader.svelte';

afterEach(() => cleanup());

describe('LoopTubeHeader.svelte', () => {
	it('renders logotype as heading level 1 for accessibility', () => {
		render(LoopTubeHeader);
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeTruthy();
		expect(heading.textContent).toContain('LOOPTUBE');
	});

	it('animates the logo dot while playback is active', () => {
		render(LoopTubeHeader, { isPlaying: true });
		const heading = screen.getByRole('heading', { level: 1 });
		const dot = heading.querySelector('.dot');
		expect(dot?.classList.contains('dot-playing')).toBe(true);
	});

	it('highlights the load button only when it is enabled', () => {
		const { unmount } = render(LoopTubeHeader);
		const activeButton = screen.getByRole('button', { name: '読み込む' });
		expect(activeButton.classList.contains('lt-url-submit-active')).toBe(true);

		unmount();
		render(LoopTubeHeader, { submitDisabled: true });
		const disabledButton = screen.getByRole('button', { name: '読み込む' });
		expect(disabledButton).toBeDisabled();
		expect(disabledButton.classList.contains('lt-url-submit-active')).toBe(false);
	});
});
