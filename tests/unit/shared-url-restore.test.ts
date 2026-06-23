import { describe, it, expect } from 'vitest';
import { FakeVideoPlayer } from '../../src/lib/fakes/FakeVideoPlayer.js';
import { ABLoopStateMachine } from '../../src/lib/core/ABLoopStateMachine.js';
import { UrlSerializer } from '../../src/lib/core/UrlSerializer.js';
// このインポートは T003 が ShareParamsApplier.ts を作成するまで FAIL する → RED
import { applyShareParams } from '../../src/lib/core/ShareParamsApplier.js';

describe('共有URL A/B 復元（applyShareParams）', () => {
	const VALID_URL_PARAMS = 'v=dQw4w9WgXcQ&a=10.5&b=50.0&s=1.5';

	describe('getDuration()=0 時（onReady 直後の状態）', () => {
		it('A/B が設定されず、トースト通知なし', () => {
			const player = new FakeVideoPlayer();
			const machine = new ABLoopStateMachine();
			player.setDuration(0);
			const shareResult = UrlSerializer.parse(VALID_URL_PARAMS);
			if (!shareResult.ok) throw new Error('unexpected parse failure');

			const toastKey = applyShareParams(machine, player, shareResult);

			expect(machine.getState().status).not.toBe('LOOPING');
			expect(toastKey).toBeNull();
		});
	});

	describe('getDuration()=300 時（BUFFERING 後の状態）', () => {
		it('A=10.5, B=50.0 が設定され、トースト通知なし', () => {
			const player = new FakeVideoPlayer();
			const machine = new ABLoopStateMachine();
			player.setDuration(300);
			const shareResult = UrlSerializer.parse(VALID_URL_PARAMS);
			if (!shareResult.ok) throw new Error('unexpected parse failure');

			const toastKey = applyShareParams(machine, player, shareResult);

			const state = machine.getState();
			expect(state.status).toBe('LOOPING');
			if (state.status === 'LOOPING') {
				expect(state.pointA).toBeCloseTo(10.5);
				expect(state.pointB).toBeCloseTo(50.0);
			}
			expect(toastKey).toBeNull();
		});
	});

	describe('B点が動画長を超える場合（クランプ）', () => {
		it('B が動画終端にクランプされ、share.loop_clamped トーストキーを返す', () => {
			const player = new FakeVideoPlayer();
			const machine = new ABLoopStateMachine();
			player.setDuration(30);
			const shareResult = UrlSerializer.parse('v=dQw4w9WgXcQ&a=10.5&b=99999&s=1.5');
			if (!shareResult.ok) throw new Error('unexpected parse failure');

			const toastKey = applyShareParams(machine, player, shareResult);

			const state = machine.getState();
			expect(state.status).toBe('LOOPING');
			if (state.status === 'LOOPING') {
				expect(state.pointB).toBeCloseTo(30);
			}
			expect(toastKey).toBe('share.loop_clamped');
		});
	});
});
