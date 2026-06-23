<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { ABLoopStateMachine } from '$lib/core/ABLoopStateMachine.js';
	import { UrlSerializer } from '$lib/core/UrlSerializer.js';
import { applyShareParams } from '$lib/core/ShareParamsApplier.js';
	import { KeyboardHandler } from '$lib/core/KeyboardHandler.js';
	import { SegmentRepository } from '$lib/core/SegmentRepository.js';
	import { FakeVideoPlayer } from '$lib/fakes/FakeVideoPlayer.js';
	import { FakeTimerAdapter } from '$lib/fakes/FakeTimerAdapter.js';
	import { YouTubePlayerAdapter } from '$lib/adapters/YouTubePlayerAdapter.js';
	import { BrowserTimerAdapter } from '$lib/adapters/BrowserTimerAdapter.js';
	import { LocalStorageAdapter } from '$lib/adapters/LocalStorageAdapter.js';
	import { LoopController } from '$lib/services/LoopController.js';
	import type { VideoPlayerPort } from '$lib/ports/VideoPlayerPort.js';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import ABControls from '$lib/components/ABControls.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import PlaybackControls from '$lib/components/PlaybackControls.svelte';
	import LoopList from '$lib/components/LoopList.svelte';
	import LoopTubeHeader from '$lib/components/LoopTubeHeader.svelte';
	import { createTranslator } from '$lib/i18n/index.js';
	import { formatTimecode } from '$lib/utils/timeline.js';
	import type { Segment } from '$lib/ports/StoragePort.js';
	import type { PageData } from './$types';

	const FPS = 30;

	let { data }: { data: PageData } = $props();
	const t = $derived(createTranslator(data.locale));

	// Core domain objects — fake adapters for SSR safety; real adapters set on mount
	const machine = new ABLoopStateMachine();
	let player: VideoPlayerPort = $state(new FakeVideoPlayer());
	let controller = new LoopController(machine, new FakeVideoPlayer(), new FakeTimerAdapter());
	let repo: SegmentRepository | null = null;

	// Reactive state
	let videoId = $state('');
	let urlInput = $state('');
	let lastSubmittedInput = $state('');
	let currentTime = $state(0);
	let duration = $state(0);
	let machineState = $state(machine.getState());
	let playing = $state(false);
	let speed = $state(1.0);
	let loopCount = $state<number | 'infinite'>('infinite');
	let segments = $state<Segment[]>([]);
	let segmentName = $state('');
	let zoom = $state(1);
	let videoReady = $state(false);
	let spVideoOpen = $state(false);
	let videoTitle = $state('');

	let progressInterval: ReturnType<typeof setInterval> | null = null;

	const activePoint = $derived(
		(() => {
			if (machineState.status === 'LOOPING')
				return machineState.lastSetPoint === 'A' ? 'a' : 'b';
			if (machineState.status === 'HAS_A') return 'a';
			if (machineState.status === 'HAS_B') return 'b';
			return null;
		})() as 'a' | 'b' | null
	);

	function handleKeydown(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement).tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
		const cmd = KeyboardHandler.getCommand({ key: e.key, shiftKey: e.shiftKey });
		if (cmd === 'none') return;
		e.preventDefault();
		switch (cmd) {
			case 'playPause':
				handlePlayPause();
				break;
			case 'setA':
				handleSetA();
				break;
			case 'setB':
				handleSetB();
				break;
			case 'clearLoop':
				handleClearAll();
				break;
			case 'seekBack':
				player.seekTo(Math.max(0, player.getCurrentTime() - 5));
				break;
			case 'seekForward':
				player.seekTo(Math.min(player.getDuration(), player.getCurrentTime() + 5));
				break;
			case 'nudgeLastSetBack':
				handleNudgeLastSet(-0.1);
				break;
			case 'nudgeLastSetForward':
				handleNudgeLastSet(0.1);
				break;
		}
	}

	async function loadSegments() {
		if (!repo || !videoId) return;
		segments = await repo.list(videoId);
	}

	async function handleSaveSegment() {
		if (!repo || !videoId || !segmentName.trim()) return;
		const s = machine.getState();
		if (s.status !== 'LOOPING') return;
		await repo.save({
			videoId,
			name: segmentName.trim(),
			pointA: s.pointA,
			pointB: s.pointB,
			speed
		});
		segmentName = '';
		await loadSegments();
	}

	async function handleLoadSegment(seg: Segment) {
		machine.setA(seg.pointA);
		machine.setB(seg.pointB);
		machineState = machine.getState();
		speed = seg.speed;
		player.setPlaybackRate(seg.speed);
		player.seekTo(seg.pointA);
	}

	async function handleDeleteSegment(id: string) {
		if (!repo) return;
		await repo.remove(id);
		await loadSegments();
	}

	onMount(async () => {
		document.addEventListener('keydown', handleKeydown);
		repo = new SegmentRepository(new LocalStorageAdapter());

		// Read URL params
		const vParam = $page.url.searchParams.get('v');
		if (vParam) {
			videoId = vParam;
			urlInput = vParam;
			await loadSegments();
		}

		// Load YouTube IFrame API (skip if already loaded)
		if (!((window as Window & { YT?: { Player?: unknown } }).YT?.Player)) {
			await new Promise<void>((resolve) => {
				(window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady =
					resolve;
				const tag = document.createElement('script');
				tag.src = 'https://www.youtube.com/iframe_api';
				document.head.appendChild(tag);
			});
		}

		// Ensure div#yt-player is in DOM before initializing
		await tick();

		// Replace fake adapters with real ones
		controller.stop();
		const ytPlayer = new YouTubePlayerAdapter('yt-player', YT);
		ytPlayer.initialize();
		let shareParamsApplied = false;
		ytPlayer.onStateChange((state) => {
			playing = state === 'PLAYING';
			if (state !== 'UNSTARTED') {
				const title = ytPlayer.getVideoTitle();
				if (title) videoTitle = title;
			}
			if (state === 'BUFFERING' || state === 'PLAYING') {
				videoReady = true;
			}
			if (!shareParamsApplied && (state === 'BUFFERING' || state === 'PLAYING')) {
				if (shareResult.ok && ytPlayer.getDuration() > 0) {
					shareParamsApplied = true;
					const toastKey = applyShareParams(machine, ytPlayer, shareResult);
					if (toastKey) {
						shareToast = t(toastKey);
						setTimeout(() => { shareToast = ''; }, 3000);
					}
					speed = shareResult.speed;
					ytPlayer.setPlaybackRate(shareResult.speed);
					machineState = machine.getState();
					if (machineState.status === 'LOOPING') {
						ytPlayer.seekTo(machineState.pointA);
					}
				}
			}
		});

		// Restore loop from share URL if present
		const shareResult = UrlSerializer.parse($page.url.toString());

		const realTimer = new BrowserTimerAdapter();
		player = ytPlayer;
		controller = new LoopController(machine, ytPlayer, realTimer);

		ytPlayer.onReady(() => {
			// Load video if videoId was set before the player became ready
			if (videoId) {
				ytPlayer.loadVideo(videoId);
			}
			controller.start();
			progressInterval = setInterval(() => {
				currentTime = player.getCurrentTime();
				duration = player.getDuration();
				machineState = machine.getState();
			}, 100);
		});
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('keydown', handleKeydown);
		controller.stop();
		if (progressInterval !== null) clearInterval(progressInterval);
		player.destroy();
	});

	function normalizeVideoId(input: string): string {
		try {
			const url = new URL(input);
			return url.searchParams.get('v') ?? url.pathname.replace(/^\//, '');
		} catch {
			return input.trim();
		}
	}

	async function handleLoad() {
		const id = normalizeVideoId(urlInput);
		if (!id) return;
		lastSubmittedInput = urlInput;
		videoId = id;
		videoReady = false;
		machine.clearAll();
		machineState = machine.getState();
		// Explicitly load the video; don't rely solely on the $effect in VideoPlayer
		await player.loadVideo(id);
		const url = new URL($page.url.toString());
		url.searchParams.set('v', id);
		history.replaceState(history.state, '', url.toString());
		await loadSegments();
	}

	function handleSetA() {
		machine.setA(player.getCurrentTime());
		machineState = machine.getState();
	}

	function handleSetB() {
		const s = machine.getState();
		let t = player.getCurrentTime();
		if ((s.status === 'HAS_A' || s.status === 'LOOPING') && t <= s.pointA) {
			t = Math.min(s.pointA + 0.1, duration);
			if (t <= s.pointA) return;
		}
		machine.setB(t);
		machineState = machine.getState();
	}

	function handlePlayPause() {
		if (playing) {
			player.pause();
		} else {
			player.play();
		}
	}

	function handleNudgeA(delta: number) {
		const s = machine.getState();
		if (s.status === 'HAS_A' || s.status === 'LOOPING') {
			machine.setA(Math.max(0, s.pointA + delta));
			machineState = machine.getState();
		}
	}

	function handleNudgeB(delta: number) {
		const s = machine.getState();
		if (s.status === 'HAS_B' || s.status === 'LOOPING') {
			machine.setB(Math.max(0, s.pointB + delta));
			machineState = machine.getState();
		}
	}

	function handleClearA() {
		machine.clearA();
		machineState = machine.getState();
	}

	function handleClearB() {
		machine.clearB();
		machineState = machine.getState();
	}

	function handleClearAll() {
		machine.clearAll();
		machineState = machine.getState();
		zoom = 1;
	}

	function handleZoomIn() {
		if (machineState.status !== 'LOOPING') return;
		zoom = 2;
	}

	function handleZoomOut() {
		zoom = 1;
	}

	function handleDragA(seconds: number) {
		machine.setA(seconds);
		machineState = machine.getState();
	}

	function handleDragB(seconds: number) {
		machine.setB(seconds);
		machineState = machine.getState();
	}

	function handleSeek(seconds: number) {
		player.seekTo(seconds);
	}

	function handleNudgeLastSet(delta: number) {
		const s = machine.getState();
		if (s.status === 'LOOPING') {
			if (s.lastSetPoint === 'A') {
				machine.setA(Math.max(0, s.pointA + delta));
			} else {
				machine.setB(Math.max(0, s.pointB + delta));
			}
		} else if (s.status === 'HAS_A') {
			machine.setA(Math.max(0, s.pointA + delta));
		} else if (s.status === 'HAS_B') {
			machine.setB(Math.max(0, s.pointB + delta));
		}
		machineState = machine.getState();
	}

	function handleSpeedChange(newSpeed: number) {
		speed = newSpeed;
		player.setPlaybackRate(newSpeed);
	}

	function handleLoopCountChange(count: number | 'infinite') {
		loopCount = count;
		machine.setLoopCount(count);
	}

	let shareToast = $state('');

	async function handleShare() {
		const s = machine.getState();
		if (s.status !== 'LOOPING' || !videoId) return;
		const params = UrlSerializer.encode({ videoId, pointA: s.pointA, pointB: s.pointB, speed });
		const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;
		await navigator.clipboard.writeText(shareUrl);
		shareToast = 'Link copied to clipboard!';
		setTimeout(() => {
			shareToast = '';
		}, 3000);
	}
</script>

<svelte:head>
	<title>LoopTube — A-B Repeat Player</title>
</svelte:head>

<main class="lt-page">
	<LoopTubeHeader
		{urlInput}
		isPlaying={playing}
		submitDisabled={!!lastSubmittedInput && urlInput === lastSubmittedInput}
		onUrlInput={(v) => (urlInput = v)}
		onUrlSubmit={handleLoad}
	/>

	<!-- Always rendered so div#yt-player exists before YouTube IFrame API init -->
	<div id="lt-work" class:lt-work-hidden={!videoReady}>
		<div id="lt-video" class:sp-open={spVideoOpen}>
			<button
				type="button"
				class="lt-video-toggle"
				onclick={() => (spVideoOpen = !spVideoOpen)}
				aria-expanded={spVideoOpen}
				aria-controls="lt-video-body"
			>
				<span class="lt-video-toggle-title">{videoTitle}</span>
				<span class="lt-video-toggle-icon" aria-hidden="true">{spVideoOpen ? '▲' : '▼'}</span>
			</button>
			<div class="lt-video-body" id="lt-video-body">
				<VideoPlayer {player} {videoId} />
			</div>
			<Timeline
				{currentTime}
				{duration}
				pointA={machineState.status === 'HAS_A' || machineState.status === 'LOOPING'
					? machineState.pointA
					: null}
				pointB={machineState.status === 'HAS_B' || machineState.status === 'LOOPING'
					? machineState.pointB
					: null}
				{zoom}
				{speed}
				{t}
				onDragA={handleDragA}
				onDragB={handleDragB}
				onZoomIn={handleZoomIn}
				onZoomOut={handleZoomOut}
				onSeek={handleSeek}
				onSpeedChange={handleSpeedChange}
			/>

			<PlaybackControls
				{loopCount}
				loopsCompleted={machineState.status === 'LOOPING' ? machineState.loopsCompleted : 0}
				{t}
				onLoopCountChange={handleLoopCountChange}
			/>
		</div>

		<div id="lt-controls">
			{#if videoId}
				<div class="lt-playhead-panel">
					<div class="lt-playhead-timecode">{formatTimecode(currentTime, FPS)}</div>
					<div class="lt-playhead-btns">
						<button
							onclick={() => player.seekTo(Math.max(0, currentTime - 1))}
							aria-label="-1s">−1s</button
						>
						<button
							onclick={() => player.seekTo(Math.max(0, currentTime - 1 / FPS))}
							aria-label="-1f">−1f</button
						>
						<button
							onclick={handlePlayPause}
							aria-label={playing ? '一時停止' : '再生'}
						>{playing ? '⏸' : '▶'}</button>
						<button
							onclick={() => player.seekTo(Math.min(duration, currentTime + 1 / FPS))}
							aria-label="+1f">+1f</button
						>
						<button
							onclick={() => player.seekTo(Math.min(duration, currentTime + 1))}
							aria-label="+1s">+1s</button
						>
					</div>
				</div>

				<ABControls
					pointA={machineState.status === 'HAS_A' || machineState.status === 'LOOPING'
						? machineState.pointA
						: null}
					pointB={machineState.status === 'HAS_B' || machineState.status === 'LOOPING'
						? machineState.pointB
						: null}
					{activePoint}
					fps={FPS}
					{t}
					onSetA={handleSetA}
					onSetB={handleSetB}
					onNudgeA={handleNudgeA}
					onNudgeB={handleNudgeB}
					onClearA={handleClearA}
					onClearB={handleClearB}
					onClearAll={handleClearAll}
				/>

				{#if machineState.status === 'LOOPING'}
					<button type="button" class="lt-share-btn" onclick={handleShare}>共有リンクをコピー</button>
					{#if shareToast}<p role="status" class="lt-share-toast">{shareToast}</p>{/if}
				{/if}
			{/if}

			<LoopList
				loops={segments}
				{t}
				onLoad={handleLoadSegment}
				onDelete={handleDeleteSegment}
				canSave={machineState.status === 'LOOPING'}
				{segmentName}
				onSegmentNameChange={(n) => (segmentName = n)}
				onSave={handleSaveSegment}
			/>
		</div>
	</div>
</main>

<style>
	.lt-page {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-4);
		overflow-x: hidden;
	}

	#lt-work.lt-work-hidden {
		display: none;
	}

	#lt-work {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}

	#lt-video {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.lt-video-toggle {
		display: none;
	}

	.lt-video-body {
		display: contents;
	}

	#lt-controls {
		width: 320px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.lt-playhead-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.lt-playhead-timecode {
		font-family: var(--font-mono);
		font-size: 2rem;
		color: var(--color-text);
		letter-spacing: 0.05em;
		text-align: center;
	}

	.lt-playhead-btns {
		display: flex;
		gap: var(--space-1);
		justify-content: center;
	}

	.lt-playhead-btns button {
		flex: 1;
		height: 36px;
		min-height: 36px;
		min-width: 0;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text-secondary);
		font-family: var(--font-brand);
		font-size: 0.75rem;
		cursor: pointer;
	}

	.lt-playhead-btns button:hover {
		background: var(--color-border);
		color: var(--color-text);
	}

	.lt-share-btn {
		width: 100%;
		height: 36px;
		min-height: 36px;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.lt-share-btn:hover {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.lt-share-toast {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	@media (max-width: 700px) {
		#lt-work {
			flex-direction: column;
			align-items: stretch;
		}

		#lt-controls {
			width: 100%;
		}

		.lt-video-toggle {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: var(--space-3) var(--space-4);
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 6px;
			color: var(--color-text-secondary);
			font-size: 0.875rem;
			cursor: pointer;
		}

		.lt-video-toggle-icon {
			font-size: 0.75rem;
			color: var(--color-text-dim);
			flex-shrink: 0;
		}

		.lt-video-toggle-title {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.lt-video-body {
			display: none;
			flex-direction: column;
			gap: var(--space-3);
		}

		#lt-video.sp-open .lt-video-body {
			display: flex;
		}
	}
</style>
