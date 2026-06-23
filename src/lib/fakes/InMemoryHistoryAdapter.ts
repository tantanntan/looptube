import type { HistoryItem, HistoryPort } from '../ports/HistoryPort.js';

export class InMemoryHistoryAdapter implements HistoryPort {
	private items: HistoryItem[] = [];

	async getAll(): Promise<HistoryItem[]> {
		return [...this.items];
	}

	async replaceAll(items: HistoryItem[]): Promise<void> {
		this.items = [...items];
	}

	async remove(id: string): Promise<void> {
		this.items = this.items.filter((item) => item.id !== id);
	}

	async clear(): Promise<void> {
		this.items = [];
	}
}
