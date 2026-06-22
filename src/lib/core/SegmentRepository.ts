import type { MergeResult, Segment, SegmentInput, StoragePort } from '../ports/StoragePort.js';

export class SegmentRepository {
	constructor(private readonly storage: StoragePort) {}

	list(videoId: string): Promise<Segment[]> {
		return this.storage.listByVideoId(videoId);
	}

	save(input: SegmentInput): Promise<Segment> {
		return this.storage.upsert(input);
	}

	remove(id: string): Promise<void> {
		return this.storage.delete(id);
	}

	mergeFromLocalStorage(segments: SegmentInput[]): Promise<MergeResult> {
		return this.storage.mergeAll(segments);
	}
}
