import type { TimerHandle, TimerPort } from '../ports/TimerPort.js';

interface ScheduledItem {
	handle: TimerHandle;
	callback: () => void;
	interval: number;
	elapsed: number;
	repeat: boolean;
	cancelled: boolean;
}

export class FakeTimerAdapter implements TimerPort {
	private items: ScheduledItem[] = [];

	setInterval(callback: () => void, ms: number): TimerHandle {
		const handle = Symbol('interval');
		this.items.push({ handle, callback, interval: ms, elapsed: 0, repeat: true, cancelled: false });
		return handle;
	}

	clearInterval(handle: TimerHandle): void {
		const item = this.items.find((i) => i.handle === handle);
		if (item) item.cancelled = true;
	}

	setTimeout(callback: () => void, ms: number): TimerHandle {
		const handle = Symbol('timeout');
		this.items.push({ handle, callback, interval: ms, elapsed: 0, repeat: false, cancelled: false });
		return handle;
	}

	clearTimeout(handle: TimerHandle): void {
		const item = this.items.find((i) => i.handle === handle);
		if (item) item.cancelled = true;
	}

	/** Advance clock by `ms` milliseconds, firing all due callbacks. */
	tick(ms: number): void {
		const toRemove: TimerHandle[] = [];
		for (const item of this.items) {
			if (item.cancelled) {
				toRemove.push(item.handle);
				continue;
			}
			item.elapsed += ms;
			while (item.elapsed >= item.interval) {
				item.callback();
				item.elapsed -= item.interval;
				if (!item.repeat) {
					item.cancelled = true;
					toRemove.push(item.handle);
					break;
				}
			}
		}
		this.items = this.items.filter((i) => !toRemove.includes(i.handle));
	}
}
