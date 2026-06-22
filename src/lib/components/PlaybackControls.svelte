<script lang="ts">
	const SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

	type Props = {
		speed: number;
		loopCount: number | 'infinite';
		loopsCompleted?: number;
		t?: (key: string) => string;
		onSpeedChange?: (speed: number) => void;
		onLoopCountChange?: (count: number | 'infinite') => void;
	};

	let { speed, loopCount, loopsCompleted = 0, t = (k: string) => k, onSpeedChange, onLoopCountChange }: Props = $props();

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
	<label for="speed-select">{t('playback.speed')}</label>
	<select id="speed-select" value={speed} onchange={handleSpeedChange}>
		{#each SPEEDS as s}
			<option value={s}>{s}×</option>
		{/each}
	</select>

	<label for="loop-count">{t('playback.loop_count')}</label>
	<input
		id="loop-count"
		type="number"
		min="0"
		max="99"
		value={loopCount === 'infinite' ? 0 : loopCount}
		onchange={handleLoopCountChange}
		aria-label={t('playback.loop_count')}
	/>
	<span>{loopCount === 'infinite' ? '∞' : `${loopsCompleted} / ${loopCount}`}</span>
</div>
