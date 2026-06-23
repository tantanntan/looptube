<script lang="ts">
	import {
		pxToSeconds,
		secondsToPercent,
		clampPointA,
		clampPointB,
		computeZoomWindow
	} from '$lib/utils/timeline.js';
	import type { ZoomWindow } from '$lib/utils/timeline.js';

	const SPEED_CHIPS = [0.5, 0.75, 1, 1.5] as const;
	const BAR_COUNT = 90;
	const TWO_PI = Math.PI * 2;

	function hAt(x: number): number {
		const raw = Math.abs(
			Math.sin(x * TWO_PI * 23 + 1.0) * 0.5 +
				Math.sin(x * TWO_PI * 53 + 2.3) * 0.3 +
				Math.sin(x * TWO_PI * 97 + 0.7) * 0.2
		);
		return Math.max(0.16, Math.min(1.0, raw));
	}

	const BARS: number[] = Array.from({ length: BAR_COUNT }, (_, i) => hAt(i / (BAR_COUNT - 1)));

	let {
		currentTime,
		duration,
		pointA,
		pointB,
		zoom = 1,
		speed = 1,
		t,
		onDragA,
		onDragB,
		onZoomIn,
		onZoomOut,
		onSeek,
		onSpeedChange
	}: {
		currentTime: number;
		duration: number;
		pointA: number | null;
		pointB: number | null;
		zoom?: number;
		speed?: number;
		t: (key: string) => string;
		onDragA: (s: number) => void;
		onDragB: (s: number) => void;
		onZoomIn?: () => void;
		onZoomOut?: () => void;
		onSeek: (s: number) => void;
		onSpeedChange?: (s: number) => void;
	} = $props();

	let trackEl: HTMLDivElement | undefined = $state();
	let dragging: 'A' | 'B' | null = $state(null);

	const zoomActive = $derived(zoom > 1);
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
		onSeek(getTrackSeconds(e.clientX));
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
		if (dragging === 'A') onDragA(clampPointA(secs, pointB, duration));
		else onDragB(clampPointB(secs, pointA, duration));
	}

	function onPointerUp(_e: PointerEvent) {
		dragging = null;
	}

	function barColor(barIdx: number): string {
		const frac = barIdx / (BAR_COUNT - 1);
		const barTime = frac * duration;
		const inLoop =
			pointA !== null && pointB !== null && barTime >= pointA && barTime <= pointB;
		const played = barTime <= currentTime;
		if (inLoop && played) return 'var(--color-accent)';
		if (inLoop) return 'color-mix(in srgb, var(--color-accent) 45%, var(--color-surface-raised))';
		if (played) return 'var(--color-text-dim)';
		return 'var(--color-surface-raised)';
	}

	const barStyles = $derived(
		(() => {
			return BARS.map((h, i) => {
				const frac = i / (BAR_COUNT - 1);
				const barTime = frac * duration;
				const left = secondsToPercent(barTime, duration, zoomWindow).toFixed(2) + '%';
				const color = barColor(i);
				return { left, height: (h * 100).toFixed(1) + '%', color };
			});
		})()
	);
</script>

<div class="timeline">
	<div class="timeline-header">
		<div class="speed-chips">
			{#each SPEED_CHIPS as s}
				<button
					type="button"
					class="speed-chip"
					class:active={speed === s}
					onclick={() => onSpeedChange?.(s)}
					aria-pressed={speed === s}>{s}×</button
				>
			{/each}
		</div>
		{#if pointA !== null && pointB !== null}
			<div class="zoom-buttons">
				{#if zoomActive}
					<button type="button" class="zoom-btn" onclick={onZoomOut} aria-label="ズームアウト"
						>×1</button
					>
				{:else}
					<button type="button" class="zoom-btn" onclick={onZoomIn} aria-label="ズームイン"
						>×2</button
					>
				{/if}
			</div>
		{/if}
	</div>
	<div
		role="application"
		aria-label={t('timeline.track')}
		class="timeline-track"
		data-testid="timeline-track"
		bind:this={trackEl}
		onpointerdown={onTrackPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<div class="waveform" aria-hidden="true">
			{#each barStyles as bar}
				<div
					class="waveform-bar"
					style="left: {bar.left}; height: {bar.height}; background: {bar.color};"
				></div>
			{/each}
		</div>
		{#if pointA !== null && pointB !== null}
			{@const la = secondsToPercent(pointA, duration, zoomWindow)}
			{@const lb = secondsToPercent(pointB, duration, zoomWindow)}
			<div class="loop-region" style="left: {la.toFixed(2)}%; width: {(lb - la).toFixed(2)}%"></div>
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
			>
				<span class="marker-label">A</span>
			</div>
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
			>
				<span class="marker-label">B</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.timeline-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.speed-chips {
		display: flex;
		gap: 4px;
	}

	.speed-chip {
		padding: 2px 8px;
		background: var(--color-surface-raised);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: 99px;
		font-family: var(--font-brand);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		min-height: 28px;
		min-width: 0;
		cursor: pointer;
	}

	.speed-chip.active {
		background: var(--color-accent);
		color: var(--color-text);
		border-color: var(--color-accent);
	}

	.zoom-btn {
		padding: 2px 8px;
		background: var(--color-surface-raised);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-family: var(--font-brand);
		font-size: 0.75rem;
		min-height: 28px;
		min-width: 0;
		cursor: pointer;
	}

	.timeline-track {
		position: relative;
		height: 56px;
		background: var(--color-surface);
		border-radius: 6px;
		cursor: pointer;
		touch-action: none;
		overflow: hidden;
	}

	.waveform {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.waveform-bar {
		position: absolute;
		bottom: 0;
		width: calc(100% / 90 * 0.5);
		transform: translateX(-50%);
		border-radius: 1px 1px 0 0;
	}

	.loop-region {
		position: absolute;
		top: 0;
		height: 100%;
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		pointer-events: none;
	}

	.playhead {
		position: absolute;
		top: 0;
		height: 100%;
		width: 2px;
		background: var(--color-text);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 2;
	}

	.marker {
		position: absolute;
		top: 0;
		height: 100%;
		width: 18px;
		transform: translateX(-50%);
		cursor: grab;
		touch-action: none;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.marker::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		border-radius: 1px;
	}

	.marker-a::before {
		background: var(--color-point-a);
	}

	.marker-b::before {
		background: var(--color-point-b);
	}

	.marker:active {
		cursor: grabbing;
	}

	.marker-label {
		position: absolute;
		top: 2px;
		font-family: var(--font-brand);
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		pointer-events: none;
	}

	.marker-a .marker-label {
		color: var(--color-point-a);
	}

	.marker-b .marker-label {
		color: var(--color-point-b);
	}
</style>
