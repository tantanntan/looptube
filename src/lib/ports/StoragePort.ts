export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export interface Segment {
	id: string;
	videoId: string;
	name: string;
	pointA: number;
	pointB: number;
	speed: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface SegmentInput {
	videoId: string;
	name: string;
	pointA: number;
	pointB: number;
	speed: number;
}

export interface MergeResult {
	merged: number;
	skipped: number;
}

export interface StoragePort {
	listByVideoId(videoId: string): Promise<Segment[]>;
	upsert(input: SegmentInput): Promise<Segment>;
	delete(id: string): Promise<void>;
	mergeAll(segments: SegmentInput[]): Promise<MergeResult>;
}
