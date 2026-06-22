import type { MergeResult, Segment, SegmentInput, StorageLike, StoragePort } from '../ports/StoragePort.js';

function generateId(): string {
	return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export class LocalStorageAdapter implements StoragePort {
	private readonly storageKey = 'looptube:segments';

	constructor(private readonly store: StorageLike = localStorage) {}

	private readAll(): Segment[] {
		const raw = this.store.getItem(this.storageKey);
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
			return parsed.map((r) => ({
				...(r as Omit<Segment, 'createdAt' | 'updatedAt'>),
				createdAt: new Date(r['createdAt'] as string),
				updatedAt: new Date(r['updatedAt'] as string)
			})) as Segment[];
		} catch {
			return [];
		}
	}

	private writeAll(segments: Segment[]): void {
		this.store.setItem(this.storageKey, JSON.stringify(segments));
	}

	async listByVideoId(videoId: string): Promise<Segment[]> {
		return this.readAll().filter((s) => s.videoId === videoId);
	}

	async upsert(input: SegmentInput): Promise<Segment> {
		const all = this.readAll();
		const idx = all.findIndex((s) => s.videoId === input.videoId && s.name === input.name);
		const now = new Date();
		if (idx >= 0) {
			const updated: Segment = { ...all[idx], ...input, updatedAt: now };
			all[idx] = updated;
			this.writeAll(all);
			return updated;
		}
		const segment: Segment = { id: generateId(), ...input, createdAt: now, updatedAt: now };
		all.push(segment);
		this.writeAll(all);
		return segment;
	}

	async delete(id: string): Promise<void> {
		const all = this.readAll().filter((s) => s.id !== id);
		this.writeAll(all);
	}

	async mergeAll(inputs: SegmentInput[]): Promise<MergeResult> {
		let merged = 0;
		let skipped = 0;
		for (const input of inputs) {
			if (input.pointA >= input.pointB) {
				skipped++;
				continue;
			}
			await this.upsert(input);
			merged++;
		}
		return { merged, skipped };
	}
}
