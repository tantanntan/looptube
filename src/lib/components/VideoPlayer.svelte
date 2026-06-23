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
		if (e.code === 'NOT_FOUND') return 'Video not found or unavailable.';
		if (e.code === 'NOT_EMBEDDABLE') return 'This video cannot be embedded.';
		return e.message ?? 'Failed to load video.';
	}
</script>

<div data-testid="player-container">
	<div id="yt-player"></div>
	{#if error}
		<div role="alert" aria-live="assertive">
			{errorMessage(error)}
		</div>
	{/if}
</div>

<style>
</style>

