export interface ZoomWindow {
	start: number;
	end: number;
}

export function formatTime(seconds: number): string {
	const totalTenths = Math.floor(seconds * 10);
	const tenths = totalTenths % 10;
	const totalSecs = Math.floor(totalTenths / 10);
	const secs = totalSecs % 60;
	const mins = Math.floor(totalSecs / 60);
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function clampPointA(value: number, pointB: number | null, duration: number): number {
	const max = pointB !== null ? pointB - 0.1 : duration;
	return Math.max(0, Math.min(value, max));
}

export function clampPointB(value: number, pointA: number | null, duration: number): number {
	const min = pointA !== null ? pointA + 0.1 : 0.1;
	return Math.min(duration, Math.max(value, min));
}

export function pxToSeconds(
	px: number,
	width: number,
	duration: number,
	zoomWindow: ZoomWindow | null
): number {
	const ratio = Math.max(0, Math.min(1, px / width));
	if (zoomWindow) {
		return zoomWindow.start + ratio * (zoomWindow.end - zoomWindow.start);
	}
	return ratio * duration;
}

export function secondsToPercent(
	seconds: number,
	duration: number,
	zoomWindow: ZoomWindow | null
): number {
	if (zoomWindow) {
		const span = zoomWindow.end - zoomWindow.start;
		if (span === 0) return 0;
		return ((seconds - zoomWindow.start) / span) * 100;
	}
	if (duration === 0) return 0;
	return (seconds / duration) * 100;
}

export function computeZoomWindow(pointA: number, pointB: number, duration: number): ZoomWindow {
	const span = pointB - pointA;
	const padding = Math.max(span * 0.2, 1);
	return {
		start: Math.max(0, pointA - padding),
		end: Math.min(duration, pointB + padding)
	};
}
