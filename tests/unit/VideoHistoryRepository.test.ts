import { describe, it, expect, beforeEach } from 'vitest';
import { VideoHistoryRepository } from '../../src/lib/core/VideoHistoryRepository.js';
import { InMemoryHistoryAdapter } from '../../src/lib/fakes/InMemoryHistoryAdapter.js';
import type { HistoryItem } from '../../src/lib/ports/HistoryPort.js';

function makeItem(id: string, addedAt = new Date()): HistoryItem {
	return {
		id,
		url: `https://youtu.be/${id}`,
		title: `Video ${id}`,
		thumbnailUrl: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
		addedAt,
	};
}

describe('VideoHistoryRepository', () => {
	let repo: VideoHistoryRepository;

	beforeEach(() => {
		repo = new VideoHistoryRepository(new InMemoryHistoryAdapter());
	});

	it('adds an item to empty history', async () => {
		await repo.add(makeItem('abc'));
		const all = await repo.getAll();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe('abc');
	});

	it('deduplicates same id (moves to front)', async () => {
		await repo.add(makeItem('abc', new Date(1000)));
		await repo.add(makeItem('xyz', new Date(2000)));
		await repo.add(makeItem('abc', new Date(3000)));
		const all = await repo.getAll();
		expect(all).toHaveLength(2);
		expect(all[0].id).toBe('abc');
		expect(all[1].id).toBe('xyz');
	});

	it('caps at 50 items and removes the oldest', async () => {
		for (let i = 0; i < 50; i++) {
			await repo.add(makeItem(`v${i}`, new Date(i * 1000)));
		}
		expect(await repo.getAll()).toHaveLength(50);
		await repo.add(makeItem('v50', new Date(50 * 1000)));
		const all = await repo.getAll();
		expect(all).toHaveLength(50);
		expect(all.find((i) => i.id === 'v0')).toBeUndefined();
		expect(all.find((i) => i.id === 'v50')).toBeDefined();
	});

	it('returns items sorted addedAt descending', async () => {
		await repo.add(makeItem('a', new Date(1000)));
		await repo.add(makeItem('b', new Date(2000)));
		await repo.add(makeItem('c', new Date(3000)));
		const all = await repo.getAll();
		expect(all.map((i) => i.id)).toEqual(['c', 'b', 'a']);
	});

	it('removes an item by id', async () => {
		await repo.add(makeItem('a'));
		await repo.add(makeItem('b'));
		await repo.remove('a');
		const all = await repo.getAll();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe('b');
	});

	describe('buildHistoryItem', () => {
		it('builds item with correct thumbnailUrl', () => {
			const item = repo.buildHistoryItem('dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'Title');
			expect(item.id).toBe('dQw4w9WgXcQ');
			expect(item.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
			expect(item.title).toBe('Title');
			expect(item.url).toBe('https://youtu.be/dQw4w9WgXcQ');
		});

		it('defaults title to empty string', () => {
			const item = repo.buildHistoryItem('abc', 'https://youtu.be/abc');
			expect(item.title).toBe('');
		});
	});
});
