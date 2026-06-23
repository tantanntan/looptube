import type { HistoryItem, HistoryPort } from '../ports/HistoryPort.js';

const STORAGE_KEY = 'looptube:history';

interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

interface HistoryItemStorage {
	id: string;
	url: string;
	title: string;
	thumbnailUrl: string;
	addedAt: string;
}

export class LocalHistoryAdapter implements HistoryPort {
	constructor(private readonly store: StorageLike = localStorage) {}

	async getAll(): Promise<HistoryItem[]> {
		try {
			const raw = this.store.getItem(STORAGE_KEY);
			if (!raw) return [];
			const parsed: HistoryItemStorage[] = JSON.parse(raw);
			return parsed.map((item) => ({ ...item, addedAt: new Date(item.addedAt) }));
		} catch {
			return [];
		}
	}

	async replaceAll(items: HistoryItem[]): Promise<void> {
		try {
			const serialized: HistoryItemStorage[] = items.map((item) => ({
				...item,
				addedAt: item.addedAt.toISOString(),
			}));
			this.store.setItem(STORAGE_KEY, JSON.stringify(serialized));
		} catch {
			// サイレントに継続（localStorage 書き込み失敗はプレイヤーに影響しない）
		}
	}

	async remove(id: string): Promise<void> {
		const items = await this.getAll();
		await this.replaceAll(items.filter((item) => item.id !== id));
	}

	async clear(): Promise<void> {
		this.store.removeItem(STORAGE_KEY);
	}
}
