import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '../../src/lib/adapters/LocalStorageAdapter.js';
import type { StorageLike } from '../../src/lib/ports/StoragePort.js';

class MapBackedStorage implements StorageLike {
	private map = new Map<string, string>();

	getItem(key: string): string | null {
		return this.map.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.map.set(key, value);
	}

	removeItem(key: string): void {
		this.map.delete(key);
	}
}

describe('LocalStorageAdapter (integration)', () => {
	let backing: MapBackedStorage;
	let adapter: LocalStorageAdapter;

	beforeEach(() => {
		backing = new MapBackedStorage();
		adapter = new LocalStorageAdapter(backing);
	});

	it('starts empty for any videoId', async () => {
		const result = await adapter.listByVideoId('vid1');
		expect(result).toEqual([]);
	});

	it('upserts and retrieves a segment', async () => {
		const seg = await adapter.upsert({ videoId: 'vid1', name: 'intro', pointA: 0, pointB: 10, speed: 1.0 });
		expect(seg.id).toBeTruthy();
		expect(seg.videoId).toBe('vid1');
		expect(seg.name).toBe('intro');

		const list = await adapter.listByVideoId('vid1');
		expect(list).toHaveLength(1);
		expect(list[0].id).toBe(seg.id);
	});

	it('upserts by (videoId, name) — second upsert updates', async () => {
		await adapter.upsert({ videoId: 'vid1', name: 'intro', pointA: 0, pointB: 10, speed: 1.0 });
		const updated = await adapter.upsert({ videoId: 'vid1', name: 'intro', pointA: 5, pointB: 15, speed: 0.75 });
		const list = await adapter.listByVideoId('vid1');
		expect(list).toHaveLength(1);
		expect(list[0].pointA).toBe(5);
		expect(list[0].speed).toBe(0.75);
		expect(list[0].id).toBe(updated.id);
	});

	it('deletes a segment by id', async () => {
		const seg = await adapter.upsert({ videoId: 'vid1', name: 'solo', pointA: 20, pointB: 40, speed: 1.0 });
		await adapter.delete(seg.id);
		const list = await adapter.listByVideoId('vid1');
		expect(list).toHaveLength(0);
	});

	it('mergeAll skips invalid (pointA >= pointB) entries', async () => {
		const result = await adapter.mergeAll([
			{ videoId: 'vid1', name: 'ok', pointA: 0, pointB: 5, speed: 1.0 },
			{ videoId: 'vid1', name: 'bad', pointA: 5, pointB: 5, speed: 1.0 }
		]);
		expect(result.merged).toBe(1);
		expect(result.skipped).toBe(1);
	});

	it('persists data to the backing store (round-trip via JSON)', async () => {
		await adapter.upsert({ videoId: 'vid1', name: 'chorus', pointA: 30, pointB: 60, speed: 1.25 });
		// Construct a fresh adapter from the same backing store
		const adapter2 = new LocalStorageAdapter(backing);
		const list = await adapter2.listByVideoId('vid1');
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('chorus');
	});
});
