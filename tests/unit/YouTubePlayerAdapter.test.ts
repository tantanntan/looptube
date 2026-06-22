import { describe, it, expect, vi, type Mock } from 'vitest';
import { YouTubePlayerAdapter } from '../../src/lib/adapters/YouTubePlayerAdapter.js';

function createMockYT() {
	const playerInstance = {
		loadVideoById: vi.fn(),
		playVideo: vi.fn(),
		pauseVideo: vi.fn(),
		seekTo: vi.fn(),
		getCurrentTime: vi.fn().mockReturnValue(0),
		getDuration: vi.fn().mockReturnValue(100),
		setPlaybackRate: vi.fn(),
		getPlaybackRate: vi.fn().mockReturnValue(1),
		destroy: vi.fn()
	};

	const YT = {
		Player: vi.fn().mockImplementation(
			(
				_el: string,
				options: { events?: Record<string, (e?: { data: number }) => void> }
			) => {
				// Store events for triggering later
				(playerInstance as unknown as { _events: typeof options.events })._events =
					options.events;
				return playerInstance;
			}
		),
		PlayerState: {
			UNSTARTED: -1,
			ENDED: 0,
			PLAYING: 1,
			PAUSED: 2,
			BUFFERING: 3,
			CUED: 5
		}
	};

	return { YT, playerInstance };
}

describe('YouTubePlayerAdapter', () => {
	it('does not instantiate YT.Player until onYouTubeIframeAPIReady fires', () => {
		const { YT } = createMockYT();
		const adapter = new YouTubePlayerAdapter('player-el', YT as unknown as typeof globalThis.YT);
		expect(YT.Player).not.toHaveBeenCalled();
		adapter.initialize();
		expect(YT.Player).toHaveBeenCalled();
	});

	it('maps YT error code 100 to NOT_FOUND', async () => {
		const { YT, playerInstance } = createMockYT();
		const adapter = new YouTubePlayerAdapter('el', YT as unknown as typeof globalThis.YT);
		adapter.initialize();

		const errorCb = vi.fn();
		adapter.onError(errorCb);

		// Simulate YT error event with code 100
		const yt = playerInstance as unknown as { _events: Record<string, (e: { data: number }) => void> };
		yt._events?.onError?.({ data: 100 });

		expect(errorCb).toHaveBeenCalledWith({ code: 'NOT_FOUND' });
	});

	it('maps YT error codes 101 and 150 to NOT_EMBEDDABLE', async () => {
		const { YT, playerInstance } = createMockYT();
		const adapter = new YouTubePlayerAdapter('el', YT as unknown as typeof globalThis.YT);
		adapter.initialize();

		const errorCb = vi.fn();
		adapter.onError(errorCb);

		const yt = playerInstance as unknown as { _events: Record<string, (e: { data: number }) => void> };
		yt._events?.onError?.({ data: 101 });
		expect(errorCb).toHaveBeenLastCalledWith({ code: 'NOT_EMBEDDABLE' });

		yt._events?.onError?.({ data: 150 });
		expect(errorCb).toHaveBeenLastCalledWith({ code: 'NOT_EMBEDDABLE' });
	});

	it('maps unknown YT error codes to UNKNOWN', () => {
		const { YT, playerInstance } = createMockYT();
		const adapter = new YouTubePlayerAdapter('el', YT as unknown as typeof globalThis.YT);
		adapter.initialize();

		const errorCb = vi.fn();
		adapter.onError(errorCb);

		const yt = playerInstance as unknown as { _events: Record<string, (e: { data: number }) => void> };
		yt._events?.onError?.({ data: 999 });
		const call = (errorCb as Mock).mock.calls[0][0];
		expect(call.code).toBe('UNKNOWN');
	});

	it('calls the ready callback when onReady fires', () => {
		const { YT, playerInstance } = createMockYT();
		const adapter = new YouTubePlayerAdapter('el', YT as unknown as typeof globalThis.YT);
		adapter.initialize();

		const readyCb = vi.fn();
		adapter.onReady(readyCb);

		const yt = playerInstance as unknown as { _events: Record<string, () => void> };
		yt._events?.onReady?.();

		expect(readyCb).toHaveBeenCalled();
	});
});
