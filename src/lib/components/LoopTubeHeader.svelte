<script lang="ts">
	type Props = {
		urlInput?: string;
		onUrlInput?: (val: string) => void;
		onUrlSubmit?: () => void;
	};

	let { urlInput = '', onUrlInput, onUrlSubmit }: Props = $props();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onUrlSubmit?.();
	}
</script>

<header class="lt-header">
	<div class="lt-logotype-group">
		<div class="lt-logotype" role="heading" aria-level="1" aria-label="LoopTube">
			<span class="loop">LOOP</span><span class="tube">TUBE</span><span class="dot">.</span>
		</div>
		<div class="lt-tagline">In / Out Frame Editor</div>
	</div>
	<form class="lt-url-form" onsubmit={handleSubmit}>
		<input
			type="text"
			class="lt-url-input"
			value={urlInput}
			oninput={(e) => onUrlInput?.((e.target as HTMLInputElement).value)}
			placeholder="YouTube URL または 動画ID"
			aria-label="YouTube URL または 動画ID"
		/>
		<button type="submit" class="lt-url-submit">読み込む</button>
	</form>
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
		color: var(--color-accent);
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

	.lt-url-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
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

	.lt-url-submit {
		padding: 0 var(--space-4);
		background: var(--color-accent);
		color: var(--color-text);
		border: none;
		border-radius: 6px;
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

	.lt-url-submit:hover {
		background: var(--color-accent-soft);
	}
</style>
