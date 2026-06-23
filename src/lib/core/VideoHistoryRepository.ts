import type { HistoryItem, HistoryPort } from '../ports/HistoryPort.js';
import { buildThumbnailUrl } from './YouTubeUrlParser.js';

const MAX_HISTORY = 50;

export class VideoHistoryRepository {
	constructor(private readonly port: HistoryPort) {}

	async add(item: HistoryItem): Promise<void> {
		const existing = await this.port.getAll();
		const filtered = existing.filter((i) => i.id !== item.id);
		const updated = [item, ...filtered];
		if (updated.length > MAX_HISTORY) {
			let oldestIdx = 0;
			for (let i = 1; i < updated.length; i++) {
				if (updated[i].addedAt < updated[oldestIdx].addedAt) oldestIdx = i;
			}
			updated.splice(oldestIdx, 1);
		}
		await this.port.replaceAll(updated);
	}

	async getAll(): Promise<HistoryItem[]> {
		const items = await this.port.getAll();
		return [...items].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
	}

	async remove(id: string): Promise<void> {
		await this.port.remove(id);
	}

	buildHistoryItem(videoId: string, url: string, title = ''): HistoryItem {
		return {
			id: videoId,
			url,
			title,
			thumbnailUrl: buildThumbnailUrl(videoId),
			addedAt: new Date(),
		};
	}
}
