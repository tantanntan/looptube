import type { MergeResult, Segment, SegmentInput, StoragePort } from '../ports/StoragePort.js';

function generateId(): string {
	return Math.random().toString(36).slice(2, 11);
}

function toSegment(record: Segment): Segment {
	return { ...record };
}

export class InMemoryStorageAdapter implements StoragePort {
	private segments = new Map<string, Segment>();

	private segmentKey(videoId: string, name: string): string {
		return `${videoId}::${name}`;
	}

	async listByVideoId(videoId: string): Promise<Segment[]> {
		return [...this.segments.values()]
			.filter((s) => s.videoId === videoId)
			.map(toSegment);
	}

	async upsert(input: SegmentInput): Promise<Segment> {
		const key = this.segmentKey(input.videoId, input.name);
		const existing = this.segments.get(key);
		const now = new Date();
		const segment: Segment = {
			id: existing?.id ?? generateId(),
			...input,
			createdAt: existing?.createdAt ?? now,
			updatedAt: now
		};
		this.segments.set(key, segment);
		return toSegment(segment);
	}

	async delete(id: string): Promise<void> {
		for (const [key, seg] of this.segments) {
			if (seg.id === id) {
				this.segments.delete(key);
				return;
			}
		}
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
