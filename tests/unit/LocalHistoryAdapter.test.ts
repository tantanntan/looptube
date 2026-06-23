import { describe, it, expect, beforeEach } from 'vitest';
import { LocalHistoryAdapter } from '../../src/lib/adapters/LocalHistoryAdapter.js';
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

class MockStorage {
	private data: Record<string, string> = {};
	getItem(key: string): string | null {
		return this.data[key] ?? null;
	}
	setItem(key: string, value: string): void {
		this.data[key] = value;
	}
	removeItem(key: string): void {
		delete this.data[key];
	}
}

class FailingStorage extends MockStorage {
	setItem(): void {
		throw new DOMException('QuotaExceededError');
	}
}

describe('LocalHistoryAdapter', () => {
	let store: MockStorage;
	let adapter: LocalHistoryAdapter;

	beforeEach(() => {
		store = new MockStorage();
		adapter = new LocalHistoryAdapter(store);
	});

	it('returns empty array when storage is empty', async () => {
		expect(await adapter.getAll()).toEqual([]);
	});

	it('saves and retrieves items', async () => {
		const item = makeItem('abc', new Date('2026-01-01T00:00:00Z'));
		await adapter.replaceAll([item]);
		const result = await adapter.getAll();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('abc');
		expect(result[0].addedAt).toEqual(new Date('2026-01-01T00:00:00Z'));
	});

	it('restores addedAt as Date from ISO string', async () => {
		const item = makeItem('abc', new Date('2026-06-24T12:00:00Z'));
		await adapter.replaceAll([item]);
		const result = await adapter.getAll();
		expect(result[0].addedAt).toBeInstanceOf(Date);
		expect(result[0].addedAt.toISOString()).toBe('2026-06-24T12:00:00.000Z');
	});

	it('returns empty array when JSON is corrupt', async () => {
		store.setItem('looptube:history', 'not-valid-json');
		expect(await adapter.getAll()).toEqual([]);
	});

	it('removes an item by id', async () => {
		await adapter.replaceAll([makeItem('a'), makeItem('b')]);
		await adapter.remove('a');
		const result = await adapter.getAll();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('b');
	});

	it('remove is no-op for non-existent id', async () => {
		await adapter.replaceAll([makeItem('a')]);
		await expect(adapter.remove('nonexistent')).resolves.toBeUndefined();
		expect(await adapter.getAll()).toHaveLength(1);
	});

	it('clears all items', async () => {
		await adapter.replaceAll([makeItem('a'), makeItem('b')]);
		await adapter.clear();
		expect(await adapter.getAll()).toEqual([]);
	});

	it('does not throw when replaceAll fails (silent failure)', async () => {
		const failingAdapter = new LocalHistoryAdapter(new FailingStorage());
		await expect(failingAdapter.replaceAll([makeItem('a')])).resolves.toBeUndefined();
	});
});
