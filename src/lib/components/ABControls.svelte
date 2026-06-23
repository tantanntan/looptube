<script lang="ts">
	import { formatTimecode } from '$lib/utils/timeline.js';

	const LOUPE_W = 60;

	type Props = {
		pointA: number | null;
		pointB: number | null;
		videoReady?: boolean;
		activePoint?: 'a' | 'b' | null;
		fps?: number;
		t?: (key: string) => string;
		onSetA?: () => void;
		onSetB?: () => void;
		onNudgeA?: (delta: number) => void;
		onNudgeB?: (delta: number) => void;
		onClearA?: () => void;
		onClearB?: () => void;
		onClearAll?: () => void;
	};

	let {
		pointA,
		pointB,
		videoReady = false,
		activePoint = null,
		fps = 30,
		t = (k: string) => k,
		onSetA,
		onSetB,
		onNudgeA,
		onNudgeB,
		onClearA,
		onClearB,
		onClearAll
	}: Props = $props();

	let loupeAEl: HTMLDivElement | undefined = $state();
	let loupeBEl: HTMLDivElement | undefined = $state();
	let loupeDragging: 'a' | 'b' | null = $state(null);
	let loupeStartX = 0;

	function fmt(val: number | null): string {
		return formatTimecode(val ?? -1, fps);
	}

	function startLoupe(e: PointerEvent, point: 'a' | 'b') {
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		loupeDragging = point;
		loupeStartX = e.clientX;
	}

	function moveLoupe(e: PointerEvent) {
		if (!loupeDragging) return;
		const el = loupeDragging === 'a' ? loupeAEl : loupeBEl;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const pxPerFrame = rect.width / (2 * LOUPE_W * fps);
		const dx = e.clientX - loupeStartX;
		const frameDelta = Math.round(dx / pxPerFrame);
		if (frameDelta === 0) return;
		loupeStartX = e.clientX;
		if (loupeDragging === 'a') onNudgeA?.(frameDelta / fps);
		else onNudgeB?.(frameDelta / fps);
	}

	function endLoupe() {
		loupeDragging = null;
	}
</script>

<div class="ab-controls">
	<!-- Point A card -->
	<div
		class="ab-card ab-card-a"
		class:ab-card-active={activePoint === 'a'}
		class:ab-card-set={pointA !== null}
		class:ab-card-compact={pointA === null}
	>
		{#if pointA !== null}
			<div class="ab-card-label point-label-a">IN</div>
			<div class="ab-timecode">{fmt(pointA)}</div>
			<div
				class="ab-loupe"
				class:ab-loupe-active={loupeDragging === 'a'}
				bind:this={loupeAEl}
				role="slider"
				aria-label="Point A loupe scrubber"
				aria-valuenow={pointA}
				aria-valuemin={0}
				aria-valuemax={9999}
				tabindex={0}
				onpointerdown={(e) => startLoupe(e, 'a')}
				onpointermove={moveLoupe}
				onpointerup={endLoupe}
				onpointercancel={endLoupe}
			>
				<div class="ab-loupe-track"><div class="ab-loupe-cursor"></div></div>
				<span class="ab-loupe-hint">← ドラッグ →</span>
			</div>
		{/if}
		<div class="ab-card-actions">
			<button
				type="button"
				class="ab-btn-set ab-btn-set-a"
				class:ab-btn-glow-active={videoReady && pointA === null}
				onclick={onSetA}
			>
				<span class="ab-btn-set-label">Set A</span>
			</button>
			{#if pointA !== null}
				<button type="button" class="ab-btn-clear" onclick={onClearA} aria-label="Clear A"
					>✕</button
				>
			{/if}
		</div>
	</div>

	<!-- Point B card -->
	<div
		class="ab-card ab-card-b"
		class:ab-card-active={activePoint === 'b'}
		class:ab-card-set={pointB !== null}
		class:ab-card-compact={pointB === null}
	>
		{#if pointB !== null}
			<div class="ab-card-label point-label-b">OUT</div>
			<div class="ab-timecode">{fmt(pointB)}</div>
			<div
				class="ab-loupe"
				class:ab-loupe-active={loupeDragging === 'b'}
				bind:this={loupeBEl}
				role="slider"
				aria-label="Point B loupe scrubber"
				aria-valuenow={pointB}
				aria-valuemin={0}
				aria-valuemax={9999}
				tabindex={0}
				onpointerdown={(e) => startLoupe(e, 'b')}
				onpointermove={moveLoupe}
				onpointerup={endLoupe}
				onpointercancel={endLoupe}
			>
				<div class="ab-loupe-track"><div class="ab-loupe-cursor"></div></div>
				<span class="ab-loupe-hint">← ドラッグ →</span>
			</div>
		{/if}
		<div class="ab-card-actions">
			<button
				type="button"
				class="ab-btn-set ab-btn-set-b"
				class:ab-btn-glow-active={videoReady && pointA !== null && pointB === null}
				onclick={onSetB}
			>
				<span class="ab-btn-set-label">Set B</span>
			</button>
			{#if pointB !== null}
				<button type="button" class="ab-btn-clear" onclick={onClearB} aria-label="Clear B"
					>✕</button
				>
			{/if}
		</div>
	</div>
</div>

{#if pointA !== null || pointB !== null}
	<div class="ab-clear-all-row">
		<button type="button" class="ab-btn-clear-all" onclick={onClearAll}
			>{t('loop.clear_all')}</button
		>
	</div>
{/if}

<style>
	.ab-controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.ab-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.ab-card-compact {
		padding: 0;
		background: transparent;
		border-color: transparent;
	}

	.ab-card-active.ab-card-a {
		border-color: var(--color-point-a);
	}

	.ab-card-active.ab-card-b {
		border-color: var(--color-point-b);
	}

	.ab-card-label {
		font-family: var(--font-brand);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.point-label-a {
		color: var(--color-point-a);
	}

	.point-label-b {
		color: var(--color-point-b);
	}

	.ab-timecode {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		color: var(--color-text);
		letter-spacing: 0.05em;
		line-height: 1;
	}

	.ab-card:not(.ab-card-set) .ab-timecode {
		color: var(--color-text-faint);
	}

	.ab-loupe {
		display: flex;
		flex-direction: column;
		gap: 4px;
		cursor: ew-resize;
		touch-action: none;
		padding: var(--space-1) 0;
	}

	.ab-loupe-track {
		position: relative;
		height: 4px;
		background: var(--color-surface-raised);
		border-radius: 2px;
	}

	.ab-loupe-cursor {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--color-text-dim);
		border-radius: 50%;
	}

	.ab-loupe-active .ab-loupe-cursor {
		background: var(--color-text);
	}

	.ab-loupe-hint {
		font-size: 0.625rem;
		color: var(--color-text-faint);
		text-align: center;
		letter-spacing: 0.05em;
	}

	.ab-card-actions {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.ab-btn-set {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		flex: 1;
		padding: 0 var(--space-2);
		height: 28px;
		min-height: 28px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface-raised);
		color: var(--color-text-secondary);
		font-family: var(--font-brand);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.ab-btn-set::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 0;
		width: 180%;
		aspect-ratio: 1;
		border-radius: 999px;
		background: radial-gradient(circle, var(--color-accent) 0%, transparent 62%);
		opacity: 0;
		filter: brightness(70%);
		transform: translate(-50%, -50%) scale(0.22);
		transform-origin: center;
		pointer-events: none;
	}

	.ab-btn-glow-active::before {
		animation: ab-btn-glow 2500ms ease-in-out infinite;
	}

	.ab-btn-set-label {
		position: relative;
		z-index: 1;
	}

	@keyframes ab-btn-glow {
		0%,
		100% {
			opacity: 0.16;
			filter: brightness(70%);
			transform: translate(-50%, -50%) scale(0.22);
		}

		50% {
			opacity: 0.72;
			filter: brightness(100%);
			transform: translate(-50%, -50%) scale(1);
		}
	}

	.ab-btn-set-a:hover {
		border-color: var(--color-point-a);
		color: var(--color-point-a);
	}

	.ab-btn-set-b:hover {
		border-color: var(--color-point-b);
		color: var(--color-point-b);
	}

	.ab-btn-clear {
		width: 28px;
		height: 28px;
		min-height: 28px;
		min-width: 28px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: transparent;
		color: var(--color-text-dim);
		font-size: 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ab-btn-clear:hover {
		color: var(--color-text);
		border-color: var(--color-text-muted);
	}

	.ab-clear-all-row {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-1);
	}

	.ab-btn-clear-all {
		padding: 0 var(--space-3);
		height: 28px;
		min-height: 28px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		cursor: pointer;
	}

	.ab-btn-clear-all:hover {
		color: var(--color-text);
		border-color: var(--color-text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.ab-btn-glow-active::before {
			animation: none;
		}
	}
</style>
