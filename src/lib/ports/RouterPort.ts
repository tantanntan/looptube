export interface RouterPort {
	getParam(key: string): string | null;
	setParam(key: string, value: string): void;
	removeParam(key: string): void;
	getUrl(): string;
}
