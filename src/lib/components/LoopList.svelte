<script lang="ts">
	import type { Segment } from '$lib/ports/StoragePort.js';
	import { formatTime } from '$lib/utils/timeline.js';

	type Props = {
		loops: Segment[];
		t: (key: string) => string;
		onLoad: (segment: Segment) => void;
		onDelete: (id: string) => void;
	};

	let { loops, t, onLoad, onDelete }: Props = $props();

	let deleteConfirmId = $state<string | null>(null);

	$effect(() => {
		// Reset confirm mode when loops prop changes
		loops;
		deleteConfirmId = null;
	});

	function confirmDelete(id: string) {
		deleteConfirmId = id;
	}

	function handleYes(id: string) {
		onDelete(id);
		deleteConfirmId = null;
	}

	function handleNo() {
		deleteConfirmId = null;
	}
</script>

<section class="loop-list">
	<h2>{t('loops.section_heading')}</h2>
	{#if loops.length === 0}
		<p class="empty">{t('loops.empty')}</p>
	{:else}
		<ul>
			{#each loops as loop (loop.id)}
				<li>
					{#if deleteConfirmId === loop.id}
						<span>{t('loops.delete_confirm')}</span>
						<button onclick={() => handleYes(loop.id)}>{t('loops.confirm_yes')}</button>
						<button onclick={handleNo}>{t('loops.confirm_no')}</button>
					{:else}
						<button onclick={() => onLoad(loop)}>
						{loop.name}
						<span class="loop-meta">{formatTime(loop.pointA)}–{formatTime(loop.pointB)} ×{loop.speed}</span>
					</button>
						<button
							aria-label={t('loops.delete')}
							aria-describedby="loop-name-{loop.id}"
							onclick={() => confirmDelete(loop.id)}
						>{t('loops.delete')}</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
