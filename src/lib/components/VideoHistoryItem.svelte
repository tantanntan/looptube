<script lang="ts">
  import type { HistoryItem } from '$lib/ports/HistoryPort.js';
  import { createTranslator } from '$lib/i18n/index.js';
  import type { Locale } from '$lib/i18n/index.js';

  interface Props {
    item: HistoryItem;
    locale: Locale;
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
  }
  let { item, locale, onSelect, onDelete }: Props = $props();

  const t = $derived(createTranslator(locale));
</script>

<li class="lt-history-item">
  <button class="lt-history-item__body" onclick={() => onSelect(item)}>
    <img
      class="lt-history-item__thumb"
      src={item.thumbnailUrl}
      alt={item.title || item.url}
      onerror={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
    />
    <span class="lt-history-item__title">{item.title || item.url}</span>
  </button>
  <button
    class="lt-history-item__delete"
    aria-label={t('history.delete_label')}
    onclick={() => onDelete(item.id)}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  </button>
</li>

<style>
  .lt-history-item {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    padding: var(--space-2, 8px) var(--space-3, 12px);
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.1));
  }
  .lt-history-item__body {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    flex: 1;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: left;
    min-width: 0;
    padding: 0;
  }
  .lt-history-item__thumb {
    width: 64px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
    background: var(--color-surface, #333);
  }
  .lt-history-item__title {
    font-size: 0.85rem;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    color: var(--color-text, #fff);
  }
  .lt-history-item__delete {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted, rgba(255,255,255,0.5));
    padding: var(--space-1, 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.15s;
  }
  .lt-history-item__delete:hover {
    color: var(--color-text, #fff);
  }
  .lt-history-item__delete svg {
    width: 18px;
    height: 18px;
  }
</style>
