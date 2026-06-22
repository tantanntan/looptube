import { describe, it, expect } from 'vitest';
import { ABLoopStateMachine } from '../../src/lib/core/ABLoopStateMachine.js';

describe('ABLoopStateMachine', () => {
	describe('initial state', () => {
		it('starts in IDLE', () => {
			const m = new ABLoopStateMachine();
			expect(m.getState().status).toBe('IDLE');
		});
	});

	describe('setA / setB transitions', () => {
		it('IDLE → setA → HAS_A', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			const s = m.getState();
			expect(s.status).toBe('HAS_A');
			if (s.status === 'HAS_A') {
				expect(s.pointA).toBe(10);
				expect(s.lastSetPoint).toBe('A');
			}
		});

		it('IDLE → setB → HAS_B', () => {
			const m = new ABLoopStateMachine();
			m.setB(20);
			const s = m.getState();
			expect(s.status).toBe('HAS_B');
			if (s.status === 'HAS_B') {
				expect(s.pointB).toBe(20);
				expect(s.lastSetPoint).toBe('B');
			}
		});

		it('HAS_A → setA (re-set) → stays HAS_A with updated pointA', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			const result = m.setA(15);
			expect(result.ok).toBe(true);
			const s = m.getState();
			expect(s.status).toBe('HAS_A');
			if (s.status === 'HAS_A') {
				expect(s.pointA).toBe(15);
				expect(s.lastSetPoint).toBe('A');
			}
		});

		it('HAS_B → setB (re-set) → stays HAS_B with updated pointB', () => {
			const m = new ABLoopStateMachine();
			m.setB(20);
			const result = m.setB(25);
			expect(result.ok).toBe(true);
			const s = m.getState();
			expect(s.status).toBe('HAS_B');
			if (s.status === 'HAS_B') {
				expect(s.pointB).toBe(25);
				expect(s.lastSetPoint).toBe('B');
			}
		});

		it('HAS_A → setB (> pointA) → LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			const result = m.setB(20);
			expect(result.ok).toBe(true);
			const s = m.getState();
			expect(s.status).toBe('LOOPING');
			if (s.status === 'LOOPING') {
				expect(s.pointA).toBe(10);
				expect(s.pointB).toBe(20);
				expect(s.lastSetPoint).toBe('B');
			}
		});

		it('HAS_A → setB (≤ pointA) → stays HAS_A with B_BEFORE_A error', () => {
			const m = new ABLoopStateMachine();
			m.setA(20);
			const result = m.setB(10);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toBe('B_BEFORE_A');
			expect(m.getState().status).toBe('HAS_A');
		});

		it('HAS_B → setA (< pointB) → LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setB(30);
			const result = m.setA(15);
			expect(result.ok).toBe(true);
			expect(m.getState().status).toBe('LOOPING');
		});

		it('HAS_B → setA (≥ pointB) → stays HAS_B with A_AFTER_B error', () => {
			const m = new ABLoopStateMachine();
			m.setB(10);
			const result = m.setA(15);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toBe('A_AFTER_B');
			expect(m.getState().status).toBe('HAS_B');
		});

		it('LOOPING → setA replaces pointA if < pointB', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			const result = m.setA(15);
			expect(result.ok).toBe(true);
			const s = m.getState();
			if (s.status === 'LOOPING') {
				expect(s.pointA).toBe(15);
				expect(s.lastSetPoint).toBe('A');
			}
		});

		it('LOOPING → setB replaces pointB if > pointA', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			const result = m.setB(25);
			expect(result.ok).toBe(true);
			const s = m.getState();
			if (s.status === 'LOOPING') {
				expect(s.pointB).toBe(25);
				expect(s.lastSetPoint).toBe('B');
			}
		});

		it('LOOPING → setA (t >= pointB) → A_AFTER_B error, stays LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			const result = m.setA(30);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toBe('A_AFTER_B');
			const s = m.getState();
			expect(s.status).toBe('LOOPING');
			if (s.status === 'LOOPING') expect(s.pointA).toBe(10);
		});

		it('LOOPING → setB (t <= pointA) → B_BEFORE_A error, stays LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			const result = m.setB(10);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toBe('B_BEFORE_A');
			const s = m.getState();
			expect(s.status).toBe('LOOPING');
			if (s.status === 'LOOPING') expect(s.pointB).toBe(30);
		});
	});

	describe('clearA / clearB / clearAll', () => {
		it('LOOPING → clearA → HAS_B', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.clearA();
			expect(m.getState().status).toBe('HAS_B');
		});

		it('LOOPING → clearB → HAS_A', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.clearB();
			expect(m.getState().status).toBe('HAS_A');
		});

		it('LOOPING → clearAll → IDLE', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.clearAll();
			expect(m.getState().status).toBe('IDLE');
		});

		it('HAS_A → clearA → IDLE', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.clearA();
			expect(m.getState().status).toBe('IDLE');
		});

		it('HAS_B → clearB → IDLE', () => {
			const m = new ABLoopStateMachine();
			m.setB(20);
			m.clearB();
			expect(m.getState().status).toBe('IDLE');
		});

		it('IDLE → clearA → stays IDLE (no-op)', () => {
			const m = new ABLoopStateMachine();
			m.clearA();
			expect(m.getState().status).toBe('IDLE');
		});

		it('IDLE → clearB → stays IDLE (no-op)', () => {
			const m = new ABLoopStateMachine();
			m.clearB();
			expect(m.getState().status).toBe('IDLE');
		});
	});

	describe('tick()', () => {
		it('returns NONE when status is IDLE', () => {
			const m = new ABLoopStateMachine();
			expect(m.tick(5)).toEqual({ type: 'NONE' });
		});

		it('returns NONE when status is HAS_A', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			expect(m.tick(5)).toEqual({ type: 'NONE' });
		});

		it('returns NONE when currentTime < pointB in LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			expect(m.tick(20)).toEqual({ type: 'NONE' });
		});

		it('returns SEEK to pointA when currentTime >= pointB (infinite)', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			const action = m.tick(30);
			expect(action).toEqual({ type: 'SEEK', to: 10 });
		});

		it('increments loopsCompleted on each SEEK', () => {
			const m = new ABLoopStateMachine();
			m.setA(5);
			m.setB(20);
			m.tick(20);
			const s = m.getState();
			if (s.status === 'LOOPING') expect(s.loopsCompleted).toBe(1);
		});
	});

	describe('setLoopCount / finite loop', () => {
		it('setLoopCount when NOT LOOPING → state unchanged', () => {
			const m = new ABLoopStateMachine();
			m.setLoopCount(3);
			expect(m.getState().status).toBe('IDLE');

			m.setA(10);
			m.setLoopCount(3);
			expect(m.getState().status).toBe('HAS_A');
		});

		it('returns STOP_AND_SEEK to pointB (not pointA) on final repetition', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.setLoopCount(2);
			m.tick(30); // loop 1 → SEEK
			const action = m.tick(30); // loop 2 → STOP_AND_SEEK to pointB
			expect(action).toEqual({ type: 'STOP_AND_SEEK', to: 30 });
		});

		it('stays LOOPING with original loopCount after final repetition (not reset to infinite)', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.setLoopCount(1);
			m.tick(30);
			const s = m.getState();
			expect(s.status).toBe('LOOPING');
			if (s.status === 'LOOPING') {
				expect(s.loopCount).toBe(1);
				expect(s.pointA).toBe(10);
				expect(s.pointB).toBe(30);
				expect(s.loopsCompleted).toBe(1);
			}
		});

		it('preserves pointA and pointB after finite-loop completion', () => {
			const m = new ABLoopStateMachine();
			m.setA(5);
			m.setB(25);
			m.setLoopCount(3);
			m.tick(25); // loop 1
			m.tick(25); // loop 2
			m.tick(25); // loop 3 — final
			const s = m.getState();
			expect(s.status).toBe('LOOPING');
			if (s.status === 'LOOPING') {
				expect(s.pointA).toBe(5);
				expect(s.pointB).toBe(25);
			}
		});

		it('after finite-loop completion, subsequent tick returns NONE (loop finished, no rewind)', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.setLoopCount(1);
			m.tick(30); // final → STOP_AND_SEEK
			const nextAction = m.tick(30);
			expect(nextAction).toEqual({ type: 'NONE' });
		});

		it('after finite-loop completion, repeated ticks all return NONE', () => {
			const m = new ABLoopStateMachine();
			m.setA(5);
			m.setB(20);
			m.setLoopCount(2);
			m.tick(20); // loop 1
			m.tick(20); // loop 2 → STOP_AND_SEEK
			expect(m.tick(20)).toEqual({ type: 'NONE' });
			expect(m.tick(20)).toEqual({ type: 'NONE' });
			expect(m.tick(20)).toEqual({ type: 'NONE' });
		});

		it('never returns STOP_AND_SEEK when count is infinite', () => {
			const m = new ABLoopStateMachine();
			m.setA(0);
			m.setB(10);
			for (let i = 0; i < 5; i++) {
				const action = m.tick(10);
				expect(action.type).not.toBe('STOP_AND_SEEK');
			}
		});
	});

	describe('lastSetPoint for Shift-arrow nudge', () => {
		it('lastSetPoint is A after setA', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			const s = m.getState();
			if (s.status === 'HAS_A') expect(s.lastSetPoint).toBe('A');
		});

		it('lastSetPoint is B after setB in LOOPING', () => {
			const m = new ABLoopStateMachine();
			m.setA(10);
			m.setB(30);
			m.setA(12);
			m.setB(28);
			const s = m.getState();
			if (s.status === 'LOOPING') expect(s.lastSetPoint).toBe('B');
		});
	});
});
