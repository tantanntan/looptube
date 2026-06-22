import type { VideoLoadError, VideoPlayerPort, PlayerState } from '../ports/VideoPlayerPort.js';

const YT_STATE_MAP: Record<number, PlayerState> = {
	[-1]: 'UNSTARTED',
	0: 'ENDED',
	1: 'PLAYING',
	2: 'PAUSED',
	3: 'BUFFERING',
	5: 'CUED'
};

export class YouTubePlayerAdapter implements VideoPlayerPort {
	private player: YT.Player | null = null;
	private readyCallbacks: Array<() => void> = [];
	private errorCallbacks: Array<(e: VideoLoadError) => void> = [];
	private stateCallbacks: Array<(s: PlayerState) => void> = [];

	constructor(
		private elementId: string,
		private YTConstructor: typeof YT
	) {}

	initialize(): void {
		this.player = new this.YTConstructor.Player(this.elementId, {
			events: {
				onReady: () => this.readyCallbacks.forEach((cb) => cb()),
				onStateChange: (event: YT.OnStateChangeEvent) => {
					const state = YT_STATE_MAP[event.data] ?? 'UNSTARTED';
					this.stateCallbacks.forEach((cb) => cb(state));
				},
				onError: (event: YT.OnErrorEvent) => {
					const error = this.mapError(event.data);
					this.errorCallbacks.forEach((cb) => cb(error));
				}
			}
		});
	}

	private mapError(code: number): VideoLoadError {
		if (code === 100) return { code: 'NOT_FOUND' };
		if (code === 101 || code === 150) return { code: 'NOT_EMBEDDABLE' };
		return { code: 'UNKNOWN', message: `YouTube error code: ${code}` };
	}

	async loadVideo(videoId: string): Promise<{ ok: true } | { ok: false; error: VideoLoadError }> {
		if (!this.player) return { ok: false, error: { code: 'UNKNOWN', message: 'Player not initialized' } };
		this.player.loadVideoById(videoId);
		return { ok: true };
	}

	play(): void {
		this.player?.playVideo();
	}

	pause(): void {
		this.player?.pauseVideo();
	}

	seekTo(seconds: number): void {
		this.player?.seekTo(seconds, true);
	}

	getCurrentTime(): number {
		return this.player?.getCurrentTime() ?? 0;
	}

	getDuration(): number {
		return this.player?.getDuration() ?? 0;
	}

	setPlaybackRate(rate: number): void {
		this.player?.setPlaybackRate(rate);
	}

	getPlaybackRate(): number {
		return this.player?.getPlaybackRate() ?? 1;
	}

	onReady(callback: () => void): void {
		this.readyCallbacks.push(callback);
	}

	onStateChange(callback: (state: PlayerState) => void): void {
		this.stateCallbacks.push(callback);
	}

	onError(callback: (error: VideoLoadError) => void): void {
		this.errorCallbacks.push(callback);
	}

	destroy(): void {
		this.player?.destroy();
		this.player = null;
		this.readyCallbacks = [];
		this.errorCallbacks = [];
		this.stateCallbacks = [];
	}
}
