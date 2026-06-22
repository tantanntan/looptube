import type { RouterPort } from '../ports/RouterPort.js';

export class FakeRouterAdapter implements RouterPort {
	private params = new Map<string, string>();

	getParam(key: string): string | null {
		return this.params.get(key) ?? null;
	}

	setParam(key: string, value: string): void {
		this.params.set(key, value);
	}

	removeParam(key: string): void {
		this.params.delete(key);
	}

	getUrl(): string {
		const q = [...this.params.entries()].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
		return `http://localhost:5173/${q ? `?${q}` : ''}`;
	}
}
