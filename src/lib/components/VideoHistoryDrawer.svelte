<script lang="ts">
  import type { HistoryItem } from '$lib/ports/HistoryPort.js';
  import { createTranslator, type Locale } from '$lib/i18n/index.js';
  import VideoHistoryItem from './VideoHistoryItem.svelte';

  interface Props {
    open: boolean;
    items: HistoryItem[];
    locale: Locale;
    onClose: () => void;
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
  }
  let { open, items, locale, onClose, onSelect, onDelete }: Props = $props();

  const t = $derived(createTranslator(locale));
</script>

{#if open}
  <div class="lt-history-overlay" role="presentation" onclick={onClose}>
    <div
      class="lt-history-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={t('history.drawer_title')}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <header class="lt-history-drawer__header">
        <h2 class="lt-history-drawer__title">{t('history.drawer_title')}</h2>
        <button class="lt-history-drawer__close" onclick={onClose} aria-label="Close">×</button>
      </header>
      {#if items.length === 0}
        <p class="lt-history-drawer__empty">{t('history.empty')}</p>
      {:else}
        <ul class="lt-history-drawer__list">
          {#each items as item (item.id)}
            <VideoHistoryItem {item} {locale} {onSelect} {onDelete} />
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{/if}

<style>
  .lt-history-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  .lt-history-drawer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(360px, 90vw);
    background: var(--color-bg, #1a1a1a);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .lt-history-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3, 12px) var(--space-4, 16px);
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.1));
    flex-shrink: 0;
  }
  .lt-history-drawer__title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text, #fff);
  }
  .lt-history-drawer__close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text, #fff);
    font-size: 1.5rem;
    line-height: 1;
    padding: var(--space-1, 4px);
  }
  .lt-history-drawer__list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }
  .lt-history-drawer__empty {
    padding: var(--space-4, 16px);
    color: var(--color-text-muted, rgba(255,255,255,0.5));
    text-align: center;
    font-size: 0.9rem;
  }
</style>
