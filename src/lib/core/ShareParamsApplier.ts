import { ABLoopStateMachine } from './ABLoopStateMachine.js';
import type { VideoPlayerPort } from '../ports/VideoPlayerPort.js';
import { UrlSerializer } from './UrlSerializer.js';
import type { ParseResult } from './UrlSerializer.js';

export function applyShareParams(
	machine: ABLoopStateMachine,
	player: VideoPlayerPort,
	shareResult: ParseResult & { ok: true }
): string | null {
	const d = player.getDuration();
	if (d === 0) return null;
	const clamped = UrlSerializer.clampToDuration(shareResult, d);
	machine.setA(clamped.pointA);
	machine.setB(clamped.pointB);
	if (clamped.pointB < shareResult.pointB) {
		return 'share.loop_clamped';
	}
	return null;
}
