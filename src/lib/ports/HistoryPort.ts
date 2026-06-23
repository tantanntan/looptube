export interface HistoryItem {
	id: string;
	url: string;
	title: string;
	thumbnailUrl: string;
	addedAt: Date;
}

export interface HistoryPort {
	getAll(): Promise<HistoryItem[]>;
	replaceAll(items: HistoryItem[]): Promise<void>;
	remove(id: string): Promise<void>;
	clear(): Promise<void>;
}
