import type { TimerHandle, TimerPort } from '../ports/TimerPort.js';

const handleMap = new Map<TimerHandle, number>();

export class BrowserTimerAdapter implements TimerPort {
	setInterval(callback: () => void, ms: number): TimerHandle {
		const handle = Symbol('interval');
		const id = window.setInterval(callback, ms);
		handleMap.set(handle, id);
		return handle;
	}

	clearInterval(handle: TimerHandle): void {
		const id = handleMap.get(handle);
		if (id !== undefined) {
			window.clearInterval(id);
			handleMap.delete(handle);
		}
	}

	setTimeout(callback: () => void, ms: number): TimerHandle {
		const handle = Symbol('timeout');
		const id = window.setTimeout(callback, ms);
		handleMap.set(handle, id);
		return handle;
	}

	clearTimeout(handle: TimerHandle): void {
		const id = handleMap.get(handle);
		if (id !== undefined) {
			window.clearTimeout(id);
			handleMap.delete(handle);
		}
	}
}
