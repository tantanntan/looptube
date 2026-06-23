import type { VideoLoadError, VideoPlayerPort, PlayerState } from '../ports/VideoPlayerPort.js';

export class FakeVideoPlayer implements VideoPlayerPort {
	private _currentTime = 0;
	private _duration = 100;
	private _playbackRate = 1;
	private _state: PlayerState = 'UNSTARTED';
	private _readyCallbacks: Array<() => void> = [];
	private _stateCallbacks: Array<(s: PlayerState) => void> = [];
	private _errorCallbacks: Array<(e: VideoLoadError) => void> = [];
	loadVideoResult: { ok: true } | { ok: false; error: VideoLoadError } = { ok: true };
	private _videoTitle = '';

	async loadVideo(_videoId: string) {
		return this.loadVideoResult;
	}

	play(): void {
		this._state = 'PLAYING';
		this._stateCallbacks.forEach((cb) => cb('PLAYING'));
	}

	pause(): void {
		this._state = 'PAUSED';
		this._stateCallbacks.forEach((cb) => cb('PAUSED'));
	}

	seekTo(seconds: number): void {
		this._currentTime = seconds;
	}

	getCurrentTime(): number {
		return this._currentTime;
	}

	getDuration(): number {
		return this._duration;
	}

	setPlaybackRate(rate: number): void {
		this._playbackRate = rate;
	}

	getPlaybackRate(): number {
		return this._playbackRate;
	}

	getVideoTitle(): string {
		return this._videoTitle;
	}

	onReady(callback: () => void): void {
		this._readyCallbacks.push(callback);
	}

	onStateChange(callback: (state: PlayerState) => void): void {
		this._stateCallbacks.push(callback);
	}

	onError(callback: (error: VideoLoadError) => void): void {
		this._errorCallbacks.push(callback);
	}

	destroy(): void {
		this._readyCallbacks = [];
		this._stateCallbacks = [];
		this._errorCallbacks = [];
	}

	// Test helpers
	simulateReady(): void {
		this._readyCallbacks.forEach((cb) => cb());
	}

	simulateError(error: VideoLoadError): void {
		this._errorCallbacks.forEach((cb) => cb(error));
	}

	setCurrentTime(t: number): void {
		this._currentTime = t;
	}

	setDuration(d: number): void {
		this._duration = d;
	}

	setVideoTitle(title: string): void {
		this._videoTitle = title;
	}

	getState(): PlayerState {
		return this._state;
	}
}
