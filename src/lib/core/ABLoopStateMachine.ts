export type ABLoopStatus = 'IDLE' | 'HAS_A' | 'HAS_B' | 'LOOPING';

export type ABLoopState =
	| { status: 'IDLE' }
	| { status: 'HAS_A'; pointA: number; lastSetPoint: 'A' }
	| { status: 'HAS_B'; pointB: number; lastSetPoint: 'B' }
	| {
			status: 'LOOPING';
			pointA: number;
			pointB: number;
			lastSetPoint: 'A' | 'B';
			loopCount: number | 'infinite';
			loopsCompleted: number;
	  };

export type TickAction =
	| { type: 'NONE' }
	| { type: 'SEEK'; to: number }
	| { type: 'STOP_AND_SEEK'; to: number };

type SetResult = { ok: true } | { ok: false; error: 'B_BEFORE_A' | 'A_AFTER_B' };

export class ABLoopStateMachine {
	private state: ABLoopState = { status: 'IDLE' };

	getState(): ABLoopState {
		return this.state;
	}

	setA(t: number): SetResult {
		const s = this.state;
		if (s.status === 'IDLE') {
			this.state = { status: 'HAS_A', pointA: t, lastSetPoint: 'A' };
			return { ok: true };
		}
		if (s.status === 'HAS_A') {
			this.state = { status: 'HAS_A', pointA: t, lastSetPoint: 'A' };
			return { ok: true };
		}
		if (s.status === 'HAS_B') {
			if (t >= s.pointB) return { ok: false, error: 'A_AFTER_B' };
			this.state = {
				status: 'LOOPING',
				pointA: t,
				pointB: s.pointB,
				lastSetPoint: 'A',
				loopCount: 'infinite',
				loopsCompleted: 0
			};
			return { ok: true };
		}
		// s is narrowed to LOOPING after all prior if+return guards
		if (t >= s.pointB) return { ok: false, error: 'A_AFTER_B' };
		this.state = { ...s, pointA: t, lastSetPoint: 'A' };
		return { ok: true };
	}

	setB(t: number): SetResult {
		const s = this.state;
		if (s.status === 'IDLE') {
			this.state = { status: 'HAS_B', pointB: t, lastSetPoint: 'B' };
			return { ok: true };
		}
		if (s.status === 'HAS_B') {
			this.state = { status: 'HAS_B', pointB: t, lastSetPoint: 'B' };
			return { ok: true };
		}
		if (s.status === 'HAS_A') {
			if (t <= s.pointA) return { ok: false, error: 'B_BEFORE_A' };
			this.state = {
				status: 'LOOPING',
				pointA: s.pointA,
				pointB: t,
				lastSetPoint: 'B',
				loopCount: 'infinite',
				loopsCompleted: 0
			};
			return { ok: true };
		}
		// s is narrowed to LOOPING after all prior if+return guards
		if (t <= s.pointA) return { ok: false, error: 'B_BEFORE_A' };
		this.state = { ...s, pointB: t, lastSetPoint: 'B' };
		return { ok: true };
	}

	clearA(): void {
		const s = this.state;
		if (s.status === 'HAS_A') {
			this.state = { status: 'IDLE' };
		} else if (s.status === 'LOOPING') {
			this.state = { status: 'HAS_B', pointB: s.pointB, lastSetPoint: 'B' };
		}
	}

	clearB(): void {
		const s = this.state;
		if (s.status === 'HAS_B') {
			this.state = { status: 'IDLE' };
		} else if (s.status === 'LOOPING') {
			this.state = { status: 'HAS_A', pointA: s.pointA, lastSetPoint: 'A' };
		}
	}

	clearAll(): void {
		this.state = { status: 'IDLE' };
	}

	setLoopCount(count: number | 'infinite'): void {
		const s = this.state;
		if (s.status === 'LOOPING') {
			this.state = { ...s, loopCount: count };
		}
	}

	tick(currentTime: number): TickAction {
		const s = this.state;
		if (s.status !== 'LOOPING') return { type: 'NONE' };
		if (currentTime < s.pointB) return { type: 'NONE' };

		const nextCompleted = s.loopsCompleted + 1;

		if (s.loopCount === 'infinite') {
			this.state = { ...s, loopsCompleted: nextCompleted };
			return { type: 'SEEK', to: s.pointA };
		}

		if (nextCompleted < s.loopCount) {
			this.state = { ...s, loopsCompleted: nextCompleted };
			return { type: 'SEEK', to: s.pointA };
		}

		// Final repetition: stay LOOPING (infinite) at pointB
		this.state = { ...s, loopsCompleted: nextCompleted, loopCount: 'infinite' };
		return { type: 'STOP_AND_SEEK', to: s.pointB };
	}
}
