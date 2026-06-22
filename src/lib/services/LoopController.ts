import type { ABLoopStateMachine } from '../core/ABLoopStateMachine.js';
import type { VideoPlayerPort } from '../ports/VideoPlayerPort.js';
import type { TimerHandle, TimerPort } from '../ports/TimerPort.js';

const POLL_INTERVAL_MS = 50;

export class LoopController {
	private handle: TimerHandle | null = null;

	constructor(
		private machine: ABLoopStateMachine,
		private player: VideoPlayerPort,
		private timer: TimerPort
	) {}

	start(): void {
		if (this.handle !== null) return;
		this.handle = this.timer.setInterval(() => {
			const action = this.machine.tick(this.player.getCurrentTime());
			if (action.type === 'SEEK') {
				this.player.seekTo(action.to);
			} else if (action.type === 'STOP_AND_SEEK') {
				this.player.seekTo(action.to);
				this.player.pause();
			}
		}, POLL_INTERVAL_MS);
	}

	stop(): void {
		if (this.handle !== null) {
			this.timer.clearInterval(this.handle);
			this.handle = null;
		}
	}
}
