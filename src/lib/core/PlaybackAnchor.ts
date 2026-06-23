import type { ABLoopState } from './ABLoopStateMachine.js';
import type { VideoPlayerPort } from '../ports/VideoPlayerPort.js';

export function getPointA(state: ABLoopState): number | null {
	if (state.status === 'HAS_A' || state.status === 'LOOPING') return state.pointA;
	return null;
}

export function seekToPointA(state: ABLoopState, player: VideoPlayerPort): boolean {
	const pointA = getPointA(state);
	if (pointA === null) return false;
	player.seekTo(pointA);
	return true;
}

export function seekToPointAIfPlaying(
	state: ABLoopState,
	player: VideoPlayerPort,
	playing: boolean
): boolean {
	if (!playing) return false;
	return seekToPointA(state, player);
}
