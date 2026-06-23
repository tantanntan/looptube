export function extractVideoId(input: string): string {
	try {
		const url = new URL(input);
		const v = url.searchParams.get('v');
		if (v) return v;
		const segments = url.pathname.split('/').filter(Boolean);
		const embedIdx = segments.indexOf('embed');
		if (embedIdx >= 0 && segments[embedIdx + 1]) return segments[embedIdx + 1];
		const shortsIdx = segments.indexOf('shorts');
		if (shortsIdx >= 0 && segments[shortsIdx + 1]) return segments[shortsIdx + 1];
		return segments[0] ?? input.trim();
	} catch {
		return input.trim();
	}
}

export function buildThumbnailUrl(videoId: string): string {
	return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
