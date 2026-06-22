<script lang="ts">
	import {
		pxToSeconds,
		secondsToPercent,
		clampPointA,
		clampPointB,
		computeZoomWindow
	} from '$lib/utils/timeline.js';
	import type { ZoomWindow } from '$lib/utils/timeline.js';

	let {
		currentTime,
		duration,
		pointA,
		pointB,
		zoomActive,
		t,
		onDragA,
		onDragB,
		onZoomToggle,
		onSeek
	}: {
		currentTime: number;
		duration: number;
		pointA: number | null;
		pointB: number | null;
		zoomActive: boolean;
		t: (key: string) => string;
		onDragA: (seconds: number) => void;
		onDragB: (seconds: number) => void;
		onZoomToggle: () => void;
		onSeek: (seconds: number) => void;
	} = $props();

	let trackEl: HTMLDivElement | undefined = $state();
	let dragging: 'A' | 'B' | null = $state(null);

	const zoomWindow = $derived<ZoomWindow | null>(
		zoomActive && pointA !== null && pointB !== null
			? computeZoomWindow(pointA, pointB, duration)
			: null
	);

	function pct(seconds: number): string {
		return secondsToPercent(seconds, duration, zoomWindow).toFixed(2) + '%';
	}

	function getTrackSeconds(clientX: number): number {
		if (!trackEl) return 0;
		const rect = trackEl.getBoundingClientRect();
		return pxToSeconds(clientX - rect.left, rect.width, duration, zoomWindow);
	}

	function onTrackPointerDown(e: PointerEvent) {
		if ((e.target as HTMLElement).classList.contains('marker')) return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const secs = getTrackSeconds(e.clientX);
		onSeek(secs);
	}

	function onMarkerPointerDown(e: PointerEvent, target: 'A' | 'B') {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragging = target;
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const secs = getTrackSeconds(e.clientX);
		if (dragging === 'A') {
			onDragA(clampPointA(secs, pointB, duration));
		} else {
			onDragB(clampPointB(secs, pointA, duration));
		}
	}

	function onPointerUp(_e: PointerEvent) {
		dragging = null;
	}
</script>

<div class="timeline">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="timeline-track"
		data-testid="timeline-track"
		bind:this={trackEl}
		onpointerdown={onTrackPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		{#if pointA !== null && pointB !== null}
			{@const la = secondsToPercent(pointA, duration, zoomWindow)}
			{@const lb = secondsToPercent(pointB, duration, zoomWindow)}
			<div
				class="loop-region"
				style="left: {la.toFixed(2)}%; width: {(lb - la).toFixed(2)}%"
			></div>
		{/if}

		<div class="playhead" style="left: {pct(currentTime)}"></div>

		{#if pointA !== null}
			<div
				class="marker marker-a"
				role="slider"
				aria-label={t('loop.point_a')}
				aria-valuenow={pointA}
				aria-valuemin={0}
				aria-valuemax={duration}
				tabindex="0"
				style="left: {pct(pointA)}"
				onpointerdown={(e) => onMarkerPointerDown(e, 'A')}
			></div>
		{/if}

		{#if pointB !== null}
			<div
				class="marker marker-b"
				role="slider"
				aria-label={t('loop.point_b')}
				aria-valuenow={pointB}
				aria-valuemin={0}
				aria-valuemax={duration}
				tabindex="0"
				style="left: {pct(pointB)}"
				onpointerdown={(e) => onMarkerPointerDown(e, 'B')}
			></div>
		{/if}
	</div>

	{#if pointA !== null && pointB !== null}
		<button
			type="button"
			class="zoom-toggle"
			data-testid="zoom-toggle"
			aria-pressed={zoomActive}
			onclick={onZoomToggle}
		>
			{zoomActive ? t('timeline.zoom_out') : t('timeline.zoom_in')}
		</button>
	{/if}
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 8px);
		padding: var(--space-2, 8px) 0;
	}

	.timeline-track {
		position: relative;
		height: 32px;
		background: var(--color-surface, #1a1a1a);
		border-radius: 4px;
		cursor: pointer;
		touch-action: none;
	}

	.playhead {
		position: absolute;
		top: 0;
		height: 100%;
		width: 2px;
		background: var(--color-text, #f0f0f0);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.loop-region {
		position: absolute;
		top: 0;
		height: 100%;
		background: color-mix(in srgb, var(--color-accent, #ff4444) 30%, transparent);
		pointer-events: none;
	}

	.marker {
		position: absolute;
		top: 50%;
		width: 16px;
		height: 28px;
		transform: translate(-50%, -50%);
		border-radius: 3px;
		cursor: grab;
		touch-action: none;
	}

	.marker:active {
		cursor: grabbing;
	}

	.marker-a {
		background: var(--color-point-a, #44aaff);
	}

	.marker-b {
		background: var(--color-point-b, #ffaa44);
	}

	.zoom-toggle {
		align-self: flex-end;
		font-size: 0.75rem;
		padding: var(--space-1, 4px) var(--space-2, 8px);
		background: var(--color-surface-raised, #242424);
		color: var(--color-text-secondary, #a0a0a0);
		border: 1px solid var(--color-border, #2e2e2e);
		border-radius: 4px;
	}

	.zoom-toggle[aria-pressed='true'] {
		background: color-mix(
			in srgb,
			var(--color-accent, #ff4444) 20%,
			var(--color-surface-raised, #242424)
		);
		color: var(--color-text, #f0f0f0);
		border-color: var(--color-accent, #ff4444);
	}
</style>
