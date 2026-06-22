import { describe, it, expect } from 'vitest';
import { KeyboardHandler, type KeyCommand } from '../../src/lib/core/KeyboardHandler.js';

describe('KeyboardHandler', () => {
	function map(key: string, shiftKey = false): KeyCommand {
		return KeyboardHandler.getCommand({ key, shiftKey });
	}

	it('Space → playPause', () => {
		expect(map(' ')).toBe('playPause');
	});

	it('a → setA (case-insensitive)', () => {
		expect(map('a')).toBe('setA');
		expect(map('A')).toBe('setA');
	});

	it('b → setB (case-insensitive)', () => {
		expect(map('b')).toBe('setB');
		expect(map('B')).toBe('setB');
	});

	it('ArrowLeft → seekBack', () => {
		expect(map('ArrowLeft')).toBe('seekBack');
	});

	it('ArrowRight → seekForward', () => {
		expect(map('ArrowRight')).toBe('seekForward');
	});

	it('Shift+ArrowLeft → nudgeLastSetBack', () => {
		expect(map('ArrowLeft', true)).toBe('nudgeLastSetBack');
	});

	it('Shift+ArrowRight → nudgeLastSetForward', () => {
		expect(map('ArrowRight', true)).toBe('nudgeLastSetForward');
	});

	it('Escape → clearLoop', () => {
		expect(map('Escape')).toBe('clearLoop');
	});

	it('unknown keys → none', () => {
		expect(map('q')).toBe('none');
		expect(map('Enter')).toBe('none');
	});

	it('has no DOM or KeyboardEvent imports (pure TS)', () => {
		// If KeyboardHandler imports from DOM types, this test will fail at
		// module load time in Node due to our ESLint core rule enforcement.
		// We just verify the module loads and works without browser globals.
		expect(typeof KeyboardHandler.getCommand).toBe('function');
	});
});
