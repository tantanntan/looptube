export type VideoLoadError =
	| { code: 'NOT_FOUND' }
	| { code: 'NOT_EMBEDDABLE' }
	| { code: 'UNKNOWN'; message: string };

export type PlayerState = 'UNSTARTED' | 'ENDED' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'CUED';

export interface VideoPlayerPort {
	loadVideo(videoId: string): Promise<{ ok: true } | { ok: false; error: VideoLoadError }>;
	play(): void;
	pause(): void;
	seekTo(seconds: number): void;
	getCurrentTime(): number;
	getDuration(): number;
	setPlaybackRate(rate: number): void;
	getPlaybackRate(): number;
	getVideoTitle(): string;
	onReady(callback: () => void): void;
	onStateChange(callback: (state: PlayerState) => void): void;
	onError(callback: (error: VideoLoadError) => void): void;
	destroy(): void;
}
