<script lang="ts">
	import type { Segment } from '$lib/ports/StoragePort.js';
	import { formatTimecode } from '$lib/utils/timeline.js';

	type Props = {
		loops: Segment[];
		t: (key: string) => string;
		onLoad: (segment: Segment) => void;
		onDelete: (id: string) => void;
		canSave?: boolean;
		segmentName?: string;
		onSegmentNameChange?: (name: string) => void;
		onSave?: () => void;
	};

	let {
		loops,
		t,
		onLoad,
		onDelete,
		canSave = false,
		segmentName = '',
		onSegmentNameChange,
		onSave
	}: Props = $props();

	let deleteConfirmId = $state<string | null>(null);

	$effect(() => {
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

	function handleSaveSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSave?.();
	}
</script>

<section class="loop-list">
	<div class="loop-list-header">
		<h2 class="loop-list-title">{t('loops.section_heading')}</h2>
		{#if canSave}
			<form class="loop-save-form" onsubmit={handleSaveSubmit}>
				<input
					type="text"
					class="loop-save-input"
					value={segmentName}
					oninput={(e) => onSegmentNameChange?.((e.target as HTMLInputElement).value)}
					placeholder="ループ名"
					aria-label="ループ名"
				/>
				<button type="submit" class="loop-save-btn" disabled={!segmentName.trim()}>保存</button>
			</form>
		{/if}
	</div>
	{#if loops.length === 0}
		<p class="loop-list-empty">{t('loops.empty')}</p>
	{:else}
		<ul class="loop-list-items">
			{#each loops as loop (loop.id)}
				<li class="loop-item">
					{#if deleteConfirmId === loop.id}
						<div class="loop-item-confirm">
							<span class="loop-item-confirm-msg">{t('loops.delete_confirm')}</span>
							<button type="button" class="loop-btn-yes" onclick={() => handleYes(loop.id)}
								>{t('loops.confirm_yes')}</button
							>
							<button type="button" class="loop-btn-no" onclick={handleNo}
								>{t('loops.confirm_no')}</button
							>
						</div>
					{:else}
						<button
							type="button"
							class="loop-item-load"
							id="loop-name-{loop.id}"
							onclick={() => onLoad(loop)}
						>
							<span class="loop-item-name">{loop.name}</span>
							<span class="loop-item-meta">
								<span class="loop-item-range"
									>{formatTimecode(loop.pointA)} – {formatTimecode(loop.pointB)}</span
								>
								<span class="loop-item-speed">{loop.speed}×</span>
							</span>
						</button>
						<button
							type="button"
							class="loop-item-delete"
							aria-label="{t('loops.delete')} {loop.name}"
							onclick={() => confirmDelete(loop.id)}>✕</button
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.loop-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.loop-list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.loop-list-title {
		font-family: var(--font-brand);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.loop-save-form {
		display: flex;
		gap: var(--space-2);
		flex: 1;
		max-width: 320px;
	}

	.loop-save-input {
		flex: 1;
		padding: 0 var(--space-2);
		height: 32px;
		min-height: 32px;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 0.8125rem;
		min-width: 0;
	}

	.loop-save-input::placeholder {
		color: var(--color-text-dim);
	}

	.loop-save-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.loop-save-btn {
		padding: 0 var(--space-3);
		height: 32px;
		min-height: 32px;
		min-width: 0;
		background: var(--color-accent);
		color: var(--color-text);
		border: none;
		border-radius: 4px;
		font-family: var(--font-brand);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.loop-save-btn:hover:not(:disabled) {
		background: var(--color-accent-soft);
	}

	.loop-list-empty {
		color: var(--color-text-faint);
		font-size: 0.8125rem;
		padding: var(--space-3) 0;
	}

	.loop-list-items {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.loop-item {
		display: flex;
		align-items: stretch;
		gap: var(--space-2);
	}

	.loop-item-load {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		text-align: left;
		cursor: pointer;
		min-height: 44px;
	}

	.loop-item-load:hover {
		background: var(--color-surface-raised);
		border-color: var(--color-text-dim);
	}

	.loop-item-name {
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.loop-item-meta {
		display: flex;
		gap: var(--space-3);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-text-muted);
	}

	.loop-item-delete {
		width: 36px;
		min-width: 36px;
		min-height: 44px;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-dim);
		font-size: 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loop-item-delete:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.loop-item-confirm {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
		border: 1px solid var(--color-accent);
		border-radius: 6px;
	}

	.loop-item-confirm-msg {
		flex: 1;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.loop-btn-yes {
		padding: 0 var(--space-2);
		height: 28px;
		min-height: 28px;
		min-width: 0;
		background: var(--color-accent);
		color: var(--color-text);
		border: none;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.loop-btn-no {
		padding: 0 var(--space-2);
		height: 28px;
		min-height: 28px;
		min-width: 0;
		background: transparent;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
	}
</style>
