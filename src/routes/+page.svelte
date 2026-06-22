<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ABLoopStateMachine } from '$lib/core/ABLoopStateMachine.js';
	import { UrlSerializer } from '$lib/core/UrlSerializer.js';
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
	import { computeZoomWindow } from '$lib/utils/timeline.js';
	import type { ZoomWindow } from '$lib/utils/timeline.js';
	import type { Segment } from '$lib/ports/StoragePort.js';
	import type { PageData } from './$types';

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
	let currentTime = $state(0);
	let duration = $state(0);
	let machineState = $state(machine.getState());
	let playing = $state(false);
	let speed = $state(1.0);
	let loopCount = $state<number | 'infinite'>('infinite');
	let segments = $state<Segment[]>([]);
	let segmentName = $state('');
	let zoomActive = $state(false);
	let zoomWindow = $state<ZoomWindow | null>(null);

	let progressInterval: ReturnType<typeof setInterval> | null = null;

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
		ytPlayer.onStateChange((state) => {
			playing = state === 'PLAYING';
		});

		// Restore loop from share URL if present
		const shareResult = UrlSerializer.parse($page.url.toString());

		const realTimer = new BrowserTimerAdapter();
		player = ytPlayer;
		controller = new LoopController(machine, ytPlayer, realTimer);

		ytPlayer.onReady(() => {
			if (shareResult.ok) {
				const d = ytPlayer.getDuration();
				const clamped = UrlSerializer.clampToDuration(shareResult, d);
				machine.setA(clamped.pointA);
				machine.setB(clamped.pointB);
				speed = shareResult.speed;
				ytPlayer.setPlaybackRate(shareResult.speed);
				machineState = machine.getState();
			}
			controller.start();
			progressInterval = setInterval(() => {
				currentTime = player.getCurrentTime();
				duration = player.getDuration();
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
		videoId = id;
		const url = new URL($page.url.toString());
		url.searchParams.set('v', id);
		goto(url.toString(), { replaceState: true, keepFocus: true });
		await loadSegments();
	}

	function handleSetA() {
		machine.setA(player.getCurrentTime());
		machineState = machine.getState();
	}

	function handleSetB() {
		machine.setB(player.getCurrentTime());
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
	}

	function handleZoomToggle() {
		const s = machine.getState();
		if (s.status !== 'LOOPING') return;
		if (!zoomActive) {
			zoomWindow = computeZoomWindow(s.pointA, s.pointB, duration);
			zoomActive = true;
		} else {
			zoomActive = false;
			zoomWindow = null;
		}
	}

	function handleDragA(seconds: number) {
		machine.setA(seconds);
		machineState = machine.getState();
		if (zoomActive) {
			const s = machine.getState();
			if (s.status === 'LOOPING') {
				zoomWindow = computeZoomWindow(s.pointA, s.pointB, duration);
			}
		}
	}

	function handleDragB(seconds: number) {
		machine.setB(seconds);
		machineState = machine.getState();
		if (zoomActive) {
			const s = machine.getState();
			if (s.status === 'LOOPING') {
				zoomWindow = computeZoomWindow(s.pointA, s.pointB, duration);
			}
		}
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

<main class="page-container">
	<LoopTubeHeader />

	<form onsubmit={(e) => { e.preventDefault(); handleLoad(); }} class="url-form">
		<label for="url-input">YouTube URL or Video ID</label>
		<input
			id="url-input"
			type="text"
			bind:value={urlInput}
			placeholder="Paste a YouTube URL or video ID"
		/>
		<button type="submit">{t('player.load')}</button>
	</form>

	<!-- Always rendered so div#yt-player exists before YouTube IFrame API init -->
	<VideoPlayer {player} {videoId} />

	{#if videoId}
		<Timeline
			{currentTime}
			{duration}
			pointA={machineState.status === 'HAS_A' || machineState.status === 'LOOPING'
				? machineState.pointA
				: null}
			pointB={machineState.status === 'HAS_B' || machineState.status === 'LOOPING'
				? machineState.pointB
				: null}
			{zoomActive}
			{t}
			onDragA={handleDragA}
			onDragB={handleDragB}
			onZoomToggle={handleZoomToggle}
			onSeek={handleSeek}
		/>

		<ABControls
			pointA={machineState.status === 'HAS_A' || machineState.status === 'LOOPING'
				? machineState.pointA
				: null}
			pointB={machineState.status === 'HAS_B' || machineState.status === 'LOOPING'
				? machineState.pointB
				: null}
			{t}
			onSetA={handleSetA}
			onSetB={handleSetB}
			onNudgeA={handleNudgeA}
			onNudgeB={handleNudgeB}
			onClearA={handleClearA}
			onClearB={handleClearB}
			onClearAll={handleClearAll}
		/>

		<PlaybackControls
			{speed}
			{loopCount}
			loopsCompleted={machineState.status === 'LOOPING' ? machineState.loopsCompleted : 0}
			{t}
			onSpeedChange={handleSpeedChange}
			onLoopCountChange={handleLoopCountChange}
		/>

		{#if machineState.status === 'LOOPING'}
			<form onsubmit={(e) => { e.preventDefault(); handleSaveSegment(); }} class="save-form">
				<label for="segment-name">Segment Name</label>
				<input
					id="segment-name"
					type="text"
					bind:value={segmentName}
					placeholder="e.g. verse 1"
				/>
				<button type="submit">Save Loop</button>
			</form>
		{/if}

		{#if machineState.status === 'LOOPING'}
			<button type="button" onclick={handleShare}>Share</button>
		{/if}
		{#if shareToast}
			<p role="status">{shareToast}</p>
		{/if}

		<LoopList
			loops={segments}
			{t}
			onLoad={handleLoadSegment}
			onDelete={handleDeleteSegment}
		/>
	{/if}
</main>

<style>
	.page-container {
		width: 100%;
		max-width: 640px;
		margin: 0 auto;
		padding: var(--space-4, 16px);
		overflow-x: hidden;
	}

	.url-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	input {
		flex: 1;
		padding: 0.5rem;
		font-size: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
	}
</style>
