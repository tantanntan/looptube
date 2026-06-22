<script lang="ts">
	import { formatTime } from '$lib/utils/timeline.js';

	type Props = {
		pointA: number | null;
		pointB: number | null;
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
		t = (k: string) => k,
		onSetA,
		onSetB,
		onNudgeA,
		onNudgeB,
		onClearA,
		onClearB,
		onClearAll
	}: Props = $props();

	function fmt(val: number | null): string {
		return val !== null ? formatTime(val) : '—';
	}
</script>

<div class="ab-controls">
	<div class="point point-a">
		<span>A: {fmt(pointA)}</span>
		<button onclick={onSetA}>{t('loop.set_a')}</button>
		{#if pointA !== null}
			<button onclick={() => onNudgeA?.(-0.1)} aria-label="-0.1 A">−0.1</button>
			<button onclick={() => onNudgeA?.(0.1)} aria-label="+0.1 A">+0.1</button>
			<button onclick={onClearA}>{t('loop.clear_a')}</button>
		{/if}
	</div>

	<div class="point point-b">
		<span>B: {fmt(pointB)}</span>
		<button onclick={onSetB}>{t('loop.set_b')}</button>
		{#if pointB !== null}
			<button onclick={() => onNudgeB?.(-0.1)} aria-label="-0.1 B">−0.1</button>
			<button onclick={() => onNudgeB?.(0.1)} aria-label="+0.1 B">+0.1</button>
			<button onclick={onClearB}>{t('loop.clear_b')}</button>
		{/if}
	</div>

	{#if pointA !== null || pointB !== null}
		<button onclick={onClearAll}>{t('loop.clear_all')}</button>
	{/if}
</div>
