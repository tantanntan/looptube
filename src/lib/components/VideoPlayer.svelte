<script lang="ts">
	import type { VideoPlayerPort, VideoLoadError } from '../ports/VideoPlayerPort.js';

	let {
		player,
		videoId
	}: {
		player: VideoPlayerPort;
		videoId: string;
	} = $props();

	let error: VideoLoadError | null = $state(null);

	$effect(() => {
		const p = player;
		p.onError((e) => {
			error = e;
		});
		if (videoId) {
			p.loadVideo(videoId).then((result) => {
				if (!result.ok) error = result.error;
			});
		}
	});

	function errorMessage(e: VideoLoadError): string {
		if (e.code === 'NOT_FOUND') return '動画が見つかりません。';
		if (e.code === 'NOT_EMBEDDABLE') return 'この動画は埋め込みできません。';
		return e.message ?? '動画の読み込みに失敗しました。';
	}
</script>

<div class="player-wrap" data-testid="player-container">
	<div class="player-aspect">
		{#if !videoId}
			<div class="player-placeholder" aria-hidden="true">
				<svg viewBox="0 0 80 56" width="80" height="56" fill="none">
					<circle cx="40" cy="28" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
					<polygon points="35,21 35,35 51,28" fill="currentColor" opacity="0.3" />
				</svg>
				<span>YouTube URL を入力して動画を読み込んでください</span>
			</div>
		{/if}
		<div id="yt-player"></div>
	</div>
	{#if error}
		<div class="player-error" role="alert" aria-live="assertive">{errorMessage(error)}</div>
	{/if}
</div>

<style>
	.player-wrap {
		width: 100%;
	}

	.player-aspect {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: var(--color-surface);
		border-radius: 8px;
		overflow: hidden;
	}

	#yt-player {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.player-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		color: var(--color-text-faint);
		font-size: 0.8125rem;
		text-align: center;
		padding: var(--space-4);
	}

	.player-error {
		margin-top: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, var(--color-accent) 15%, var(--color-surface));
		border: 1px solid var(--color-accent);
		border-radius: 6px;
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
	}
</style>
