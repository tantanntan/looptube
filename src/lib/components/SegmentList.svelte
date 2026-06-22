<script lang="ts">
	import type { Segment } from '$lib/ports/StoragePort.js';

	type Props = {
		segments: Segment[];
		onLoad?: (segment: Segment) => void;
		onDelete?: (id: string) => void;
	};

	let { segments, onLoad, onDelete }: Props = $props();

	function fmt(t: number): string {
		const m = Math.floor(t / 60);
		const s = (t % 60).toFixed(1).padStart(4, '0');
		return `${m}:${s}`;
	}
</script>

{#if segments.length === 0}
	<p class="empty">No saved segments yet.</p>
{:else}
	<ul class="segment-list">
		{#each segments as seg (seg.id)}
			<li class="segment-item">
				<span class="segment-name">{seg.name}</span>
				<span class="segment-times">{fmt(seg.pointA)} – {fmt(seg.pointB)}</span>
				<span class="segment-speed">{seg.speed}×</span>
				<button type="button" onclick={() => onLoad?.(seg)}>Load</button>
				<button type="button" onclick={() => onDelete?.(seg.id)}>Delete</button>
			</li>
		{/each}
	</ul>
{/if}
