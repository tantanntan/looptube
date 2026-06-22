import { describe, it, expect, beforeEach } from 'vitest';
import { SegmentRepository } from '../../src/lib/core/SegmentRepository.js';
import { InMemoryStorageAdapter } from '../../src/lib/fakes/InMemoryStorageAdapter.js';

describe('SegmentRepository', () => {
	let storage: InMemoryStorageAdapter;
	let repo: SegmentRepository;

	beforeEach(() => {
		storage = new InMemoryStorageAdapter();
		repo = new SegmentRepository(storage);
	});

	it('saves a segment and retrieves it by videoId', async () => {
		await repo.save({ videoId: 'abc', name: 'verse', pointA: 10, pointB: 30, speed: 1.0 });
		const list = await repo.list('abc');
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('verse');
		expect(list[0].pointA).toBe(10);
		expect(list[0].pointB).toBe(30);
	});

	it('returns empty list for unknown videoId', async () => {
		const list = await repo.list('unknown');
		expect(list).toHaveLength(0);
	});

	it('upserts by (videoId, name) — updates existing segment', async () => {
		await repo.save({ videoId: 'abc', name: 'chorus', pointA: 0, pointB: 10, speed: 1.0 });
		await repo.save({ videoId: 'abc', name: 'chorus', pointA: 5, pointB: 20, speed: 1.5 });
		const list = await repo.list('abc');
		expect(list).toHaveLength(1);
		expect(list[0].pointA).toBe(5);
		expect(list[0].pointB).toBe(20);
		expect(list[0].speed).toBe(1.5);
	});

	it('deletes a segment by id', async () => {
		const seg = await repo.save({ videoId: 'abc', name: 'bridge', pointA: 0, pointB: 5, speed: 1.0 });
		await repo.remove(seg.id);
		const list = await repo.list('abc');
		expect(list).toHaveLength(0);
	});

	it('merge adds new segments and skips invalid ones', async () => {
		const result = await repo.mergeFromLocalStorage([
			{ videoId: 'abc', name: 'valid', pointA: 0, pointB: 10, speed: 1.0 },
			{ videoId: 'abc', name: 'invalid', pointA: 10, pointB: 5, speed: 1.0 }
		]);
		expect(result.merged).toBe(1);
		expect(result.skipped).toBe(1);
	});

	it('keeps segments for different videoIds isolated', async () => {
		await repo.save({ videoId: 'vid1', name: 'part1', pointA: 0, pointB: 5, speed: 1.0 });
		await repo.save({ videoId: 'vid2', name: 'part1', pointA: 0, pointB: 5, speed: 1.0 });
		expect(await repo.list('vid1')).toHaveLength(1);
		expect(await repo.list('vid2')).toHaveLength(1);
	});
});
