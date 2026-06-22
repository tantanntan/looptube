export type KeyCommand =
	| 'setA'
	| 'setB'
	| 'playPause'
	| 'seekBack'
	| 'seekForward'
	| 'nudgeLastSetBack'
	| 'nudgeLastSetForward'
	| 'clearLoop'
	| 'none';

export interface KeyInput {
	key: string;
	shiftKey: boolean;
}

export const KeyboardHandler = {
	getCommand({ key, shiftKey }: KeyInput): KeyCommand {
		if (key === ' ') return 'playPause';
		if (key.toLowerCase() === 'a') return 'setA';
		if (key.toLowerCase() === 'b') return 'setB';
		if (key === 'Escape') return 'clearLoop';
		if (key === 'ArrowLeft') return shiftKey ? 'nudgeLastSetBack' : 'seekBack';
		if (key === 'ArrowRight') return shiftKey ? 'nudgeLastSetForward' : 'seekForward';
		return 'none';
	}
};
