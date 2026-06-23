<script lang="ts">
	import { createTranslator, type Locale } from '$lib/i18n/index.js';

	type Props = {
		urlInput?: string;
		isPlaying?: boolean;
		submitDisabled?: boolean;
		onUrlInput?: (val: string) => void;
		onUrlSubmit?: () => void;
		locale?: Locale;
		onHistoryClick?: () => void;
	};

	let {
		urlInput = '',
		isPlaying = false,
		submitDisabled = false,
		onUrlInput,
		onUrlSubmit,
		locale = 'en',
		onHistoryClick = () => {}
	}: Props = $props();

	const t = $derived(createTranslator(locale));

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onUrlSubmit?.();
	}

	function handleFocus(e: FocusEvent) {
		(e.target as HTMLInputElement).select();
	}

	function handleClear() {
		onUrlInput?.('');
	}
</script>

<header class="lt-header">
	<div class="lt-logotype-group">
		<div class="lt-logotype" role="heading" aria-level="1" aria-label="LoopTube">
			<span class="loop">LOOP</span><span class="tube">TUBE</span><span class="dot" class:dot-playing={isPlaying}>.</span>
		</div>
		<div class="lt-tagline">In / Out Frame Editor</div>
	</div>
	<form class="lt-url-form" onsubmit={handleSubmit}>
		<div class="lt-url-input-wrapper">
			<input
				type="text"
				class="lt-url-input"
				value={urlInput}
				oninput={(e) => onUrlInput?.((e.target as HTMLInputElement).value)}
				onfocus={handleFocus}
				placeholder="YouTube URL または 動画ID"
				aria-label="YouTube URL or Video ID"
			/>
			{#if urlInput}
				<button
					type="button"
					class="lt-url-clear"
					onclick={handleClear}
					aria-label="入力をクリア"
				>×</button>
			{/if}
		</div>
		<button
			type="submit"
			class="lt-url-submit"
			class:lt-url-submit-active={!submitDisabled}
			disabled={submitDisabled}
		><span class="lt-url-submit-label">読み込む</span></button>
	</form>
	<button
		type="button"
		class="lt-history-btn"
		onclick={onHistoryClick}
		aria-label={t('history.button_label')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	</button>
</header>

<style>
	.lt-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) 0 var(--space-4);
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-4);
	}

	.lt-logotype-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex-shrink: 0;
	}

	.lt-logotype {
		font-family: var(--font-brand);
		font-weight: 700;
		font-size: 1.25rem;
		letter-spacing: 0.12em;
		line-height: 1;
	}

	.loop {
		color: var(--color-text);
	}

	.tube {
		color: var(--color-text-secondary);
	}

	.dot {
		display: inline-block;
		position: relative;
		width: 0.34em;
		height: 1em;
		color: transparent;
		vertical-align: baseline;
	}

	.dot::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 72%;
		width: 0.18em;
		height: 0.18em;
		border-radius: 999px;
		background: var(--color-accent);
		transform: translate(-50%, -50%) scale(1);
		transform-origin: center;
	}

	.dot-playing::before {
		animation: logo-dot-heartbeat 900ms ease-in-out infinite;
	}

	@keyframes logo-dot-heartbeat {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}

		45% {
			transform: translate(-50%, -50%) scale(1.5);
		}

		65% {
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-playing::before {
			animation: none;
		}
	}

	.lt-tagline {
		font-size: 0.6875rem;
		color: var(--color-text-dim);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.lt-url-form {
		display: flex;
		flex: 1;
		gap: var(--space-2);
		max-width: 560px;
	}

	.lt-url-input-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
	}

	.lt-url-input {
		width: 100%;
		padding: var(--space-2) 1.75rem var(--space-2) var(--space-3);
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.875rem;
		height: 36px;
		min-width: 0;
		min-height: 0;
	}

	.lt-url-input::placeholder {
		color: var(--color-text-dim);
	}

	.lt-url-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.lt-url-clear {
		position: absolute;
		right: var(--space-2);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		min-width: 0;
		min-height: 0;
		border: none;
		background: transparent;
		color: var(--color-text-dim);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
	}

	.lt-url-clear:hover {
		color: var(--color-text);
	}

	.lt-url-submit {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		padding: 0 var(--space-4);
		background: var(--color-accent);
		color: var(--color-text);
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		font-family: var(--font-brand);
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		white-space: nowrap;
		height: 36px;
		min-height: 36px;
		min-width: 0;
		cursor: pointer;
	}

	.lt-url-submit::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 0;
		width: 180%;
		aspect-ratio: 1;
		border-radius: 999px;
		background: radial-gradient(circle, var(--color-accent) 0%, transparent 62%);
		opacity: 0;
		filter: brightness(70%);
		transform: translate(-50%, -50%) scale(0.22);
		transform-origin: center;
		pointer-events: none;
	}

	.lt-url-submit-active::before {
		animation: url-submit-glow 2500ms ease-in-out infinite;
	}

	.lt-url-submit-label {
		position: relative;
		z-index: 1;
	}

	@keyframes url-submit-glow {
		0%,
		100% {
			opacity: 0.16;
			filter: brightness(70%);
			transform: translate(-50%, -50%) scale(0.22);
		}

		50% {
			opacity: 0.72;
			filter: brightness(100%);
			transform: translate(-50%, -50%) scale(1);
		}
	}

	.lt-url-submit:hover:not(:disabled) {
		background: var(--color-accent);
		color: var(--color-text);
	}

	.lt-url-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.lt-url-submit-active::before {
			animation: none;
		}
	}

	.lt-history-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-text-muted, currentColor);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.lt-history-btn:hover {
		color: var(--color-text, currentColor);
		border-color: var(--color-text-muted, currentColor);
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.06));
	}

	.lt-history-btn:focus-visible {
		outline: 2px solid var(--color-accent, currentColor);
		outline-offset: 2px;
	}


	@media (max-width: 700px) {
		.lt-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-3);
		}

		.lt-url-form {
			max-width: 100%;
		}
	}
</style>
