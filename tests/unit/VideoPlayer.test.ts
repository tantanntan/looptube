import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte';
import VideoPlayer from '../../src/lib/components/VideoPlayer.svelte';
import { FakeVideoPlayer } from '../../src/lib/fakes/FakeVideoPlayer.js';

afterEach(() => cleanup());

describe('VideoPlayer.svelte', () => {
	it('renders a player container element', () => {
		const player = new FakeVideoPlayer();
		render(VideoPlayer, { player, videoId: 'test123' });
		expect(document.querySelector('[data-testid="player-container"]')).toBeTruthy();
	});

	it('shows error alert when NOT_FOUND error occurs', async () => {
		const player = new FakeVideoPlayer();
		render(VideoPlayer, { player, videoId: 'bad-id' });
		player.simulateError({ code: 'NOT_FOUND' });
		await waitFor(() => {
			expect(screen.getByRole('alert')).toBeTruthy();
		});
	});

	it('shows error alert when NOT_EMBEDDABLE error occurs', async () => {
		const player = new FakeVideoPlayer();
		render(VideoPlayer, { player, videoId: 'bad-id' });
		player.simulateError({ code: 'NOT_EMBEDDABLE' });
		await waitFor(() => {
			expect(screen.getByRole('alert')).toBeTruthy();
		});
	});
});
