import { describe, it, expect } from 'vitest';
import { extractVideoId, buildThumbnailUrl } from '../../src/lib/core/YouTubeUrlParser.js';

describe('extractVideoId', () => {
	it('extracts from watch?v= URL', () => {
		expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('extracts from watch?v= URL with extra params', () => {
		expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=60')).toBe('dQw4w9WgXcQ');
	});

	it('extracts from youtu.be short URL', () => {
		expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('extracts from embed URL', () => {
		expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('extracts from shorts URL', () => {
		expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('returns raw video ID as-is', () => {
		expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('trims whitespace from raw ID', () => {
		expect(extractVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
	});
});

describe('buildThumbnailUrl', () => {
	it('builds correct thumbnail URL', () => {
		expect(buildThumbnailUrl('dQw4w9WgXcQ')).toBe(
			'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
		);
	});
});
