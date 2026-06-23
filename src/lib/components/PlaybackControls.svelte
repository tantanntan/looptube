<script lang="ts">
	type Props = {
		loopCount: number | 'infinite';
		loopsCompleted?: number;
		t?: (key: string) => string;
		onLoopCountChange?: (count: number | 'infinite') => void;
	};

	let { loopCount, loopsCompleted = 0, t = (k: string) => k, onLoopCountChange }: Props = $props();

	function decrement() {
		if (loopCount === 'infinite') {
			onLoopCountChange?.(99);
		} else if (loopCount > 1) {
			onLoopCountChange?.(loopCount - 1);
		}
	}

	function increment() {
		if (loopCount === 'infinite') return;
		if (loopCount >= 99) {
			onLoopCountChange?.('infinite');
		} else {
			onLoopCountChange?.(loopCount + 1);
		}
	}

	const display = $derived(loopCount === 'infinite' ? '∞' : String(loopCount));
	const progress = $derived(loopCount === 'infinite' ? '' : `${loopsCompleted} / ${loopCount}`);
</script>

<div class="playback-controls">
	<span class="pc-label">{t('playback.loop_count')}</span>
	<div class="pc-counter">
		<button type="button" class="pc-stepper" onclick={decrement} aria-label="ループ回数を減らす">
			−
		</button>
		<span class="pc-value">{display}</span>
		<button type="button" class="pc-stepper" onclick={increment} aria-label="ループ回数を増やす">
			+
		</button>
	</div>
	{#if progress}<span class="pc-progress">{progress}</span>{/if}
</div>

<style>
	.playback-controls {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.pc-label {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.pc-counter {
		display: flex;
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow: hidden;
	}

	.pc-stepper {
		width: 28px;
		height: 28px;
		min-height: 28px;
		min-width: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		font-size: 1rem;
		cursor: pointer;
	}

	.pc-stepper:hover {
		background: var(--color-border);
		color: var(--color-text);
	}

	.pc-value {
		min-width: 32px;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--color-text);
		padding: 0 var(--space-1);
	}

	.pc-progress {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
