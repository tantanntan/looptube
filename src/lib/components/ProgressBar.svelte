<script lang="ts">
	let {
		currentTime,
		duration,
		pointA,
		pointB
	}: {
		currentTime: number;
		duration: number;
		pointA: number | null;
		pointB: number | null;
	} = $props();

	function pct(t: number): string {
		if (duration <= 0) return '0%';
		return ((t / duration) * 100).toFixed(2) + '%';
	}
</script>

<div class="progress-bar" role="progressbar" aria-valuenow={currentTime} aria-valuemax={duration}>
	<div class="track">
		<div class="playhead" style="left: {pct(currentTime)}"></div>
		{#if pointA !== null}
			<div class="marker marker-a" style="left: {pct(pointA)}" aria-label="Point A"></div>
		{/if}
		{#if pointB !== null}
			<div class="marker marker-b" style="left: {pct(pointB)}" aria-label="Point B"></div>
		{/if}
		{#if pointA !== null && pointB !== null}
			<div
				class="loop-region"
				style="left: {pct(pointA)}; width: {pct(pointB - pointA)}"
			></div>
		{/if}
	</div>
</div>
