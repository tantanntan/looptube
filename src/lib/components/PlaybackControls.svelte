<script lang="ts">
	const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

	type Props = {
		speed: number;
		loopCount: number | 'infinite';
		onSpeedChange?: (speed: number) => void;
		onLoopCountChange?: (count: number | 'infinite') => void;
	};

	let { speed, loopCount, onSpeedChange, onLoopCountChange }: Props = $props();

	function handleSpeedChange(e: Event) {
		const val = parseFloat((e.target as HTMLSelectElement).value);
		onSpeedChange?.(val);
	}

	function handleLoopCountChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		if (isNaN(val) || val <= 0) {
			onLoopCountChange?.('infinite');
		} else {
			onLoopCountChange?.(Math.min(99, val));
		}
	}
</script>

<div class="playback-controls">
	<label for="speed-select">Speed</label>
	<select id="speed-select" value={speed} onchange={handleSpeedChange}>
		{#each SPEEDS as s}
			<option value={s}>{s}×</option>
		{/each}
	</select>

	<label for="loop-count">Loop Count</label>
	<input
		id="loop-count"
		type="number"
		min="0"
		max="99"
		value={loopCount === 'infinite' ? 0 : loopCount}
		onchange={handleLoopCountChange}
		aria-label="Loop Count"
	/>
	<span>{loopCount === 'infinite' ? 'Infinite' : `${loopCount} times`}</span>
</div>
