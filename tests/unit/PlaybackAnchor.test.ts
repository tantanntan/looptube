import { describe, expect, it, vi } from 'vitest';
import { ABLoopStateMachine } from '../../src/lib/core/ABLoopStateMachine.js';
import {
	getPointA,
	seekToPointA,
	seekToPointAIfPlaying
} from '../../src/lib/core/PlaybackAnchor.js';
import { FakeVideoPlayer } from '../../src/lib/fakes/FakeVideoPlayer.js';

describe('PlaybackAnchor', () => {
	it('returns pointA only when A is set', () => {
		const machine = new ABLoopStateMachine();

		expect(getPointA(machine.getState())).toBeNull();

		machine.setB(20);
		expect(getPointA(machine.getState())).toBeNull();

		machine.setA(10);
		expect(getPointA(machine.getState())).toBe(10);
	});

	it('seeks to pointA when A is set', () => {
		const machine = new ABLoopStateMachine();
		const player = new FakeVideoPlayer();
		const seekTo = vi.spyOn(player, 'seekTo');

		machine.setA(12);

		expect(seekToPointA(machine.getState(), player)).toBe(true);
		expect(seekTo).toHaveBeenCalledWith(12);
	});

	it('does not seek when A is not set', () => {
		const machine = new ABLoopStateMachine();
		const player = new FakeVideoPlayer();
		const seekTo = vi.spyOn(player, 'seekTo');

		expect(seekToPointA(machine.getState(), player)).toBe(false);
		expect(seekTo).not.toHaveBeenCalled();
	});

	it('seeks to pointA only while playing for A moves', () => {
		const machine = new ABLoopStateMachine();
		const player = new FakeVideoPlayer();
		const seekTo = vi.spyOn(player, 'seekTo');

		machine.setA(8);

		expect(seekToPointAIfPlaying(machine.getState(), player, false)).toBe(false);
		expect(seekTo).not.toHaveBeenCalled();

		expect(seekToPointAIfPlaying(machine.getState(), player, true)).toBe(true);
		expect(seekTo).toHaveBeenCalledWith(8);
	});
});
