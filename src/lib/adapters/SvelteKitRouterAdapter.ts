import type { RouterPort } from '../ports/RouterPort.js';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';

export class SvelteKitRouterAdapter implements RouterPort {
	getParam(key: string): string | null {
		return get(page).url.searchParams.get(key);
	}

	setParam(key: string, value: string): void {
		const url = new URL(get(page).url.toString());
		url.searchParams.set(key, value);
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

	removeParam(key: string): void {
		const url = new URL(get(page).url.toString());
		url.searchParams.delete(key);
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

	getUrl(): string {
		return get(page).url.toString();
	}
}
