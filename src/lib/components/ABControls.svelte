<script lang="ts">
	type Props = {
		pointA: number | null;
		pointB: number | null;
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
		onSetA,
		onSetB,
		onNudgeA,
		onNudgeB,
		onClearA,
		onClearB,
		onClearAll
	}: Props = $props();

	function fmt(t: number | null): string {
		return t !== null ? t.toFixed(1) + ' s' : 'not set';
	}
</script>

<div class="ab-controls">
	<div class="point point-a">
		<span>Point A: {fmt(pointA)}</span>
		<button onclick={onSetA}>Set A</button>
		{#if pointA !== null}
			<button onclick={() => onNudgeA?.(-0.1)} aria-label="-0.1 A">−0.1</button>
			<button onclick={() => onNudgeA?.(0.1)} aria-label="+0.1 A">+0.1</button>
			<button onclick={onClearA}>Clear A</button>
		{/if}
	</div>

	<div class="point point-b">
		<span>Point B: {fmt(pointB)}</span>
		<button onclick={onSetB}>Set B</button>
		{#if pointB !== null}
			<button onclick={() => onNudgeB?.(-0.1)} aria-label="-0.1 B">−0.1</button>
			<button onclick={() => onNudgeB?.(0.1)} aria-label="+0.1 B">+0.1</button>
			<button onclick={onClearB}>Clear B</button>
		{/if}
	</div>

	<button onclick={onClearAll}>Clear Loop</button>
</div>
