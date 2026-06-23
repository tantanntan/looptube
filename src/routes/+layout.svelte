<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import '../app.css';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		const options: AddEventListenerOptions = { passive: false };
		const gestureEvents = ['gesturestart', 'gesturechange', 'gestureend'] as const;
		const preventMultiTouch: EventListener = (event) => {
			const touchEvent = event as TouchEvent;
			if (touchEvent.touches.length > 1) {
				event.preventDefault();
			}
		};
		const preventGesture: EventListener = (event) => {
			event.preventDefault();
		};

		document.addEventListener('touchstart', preventMultiTouch, options);
		document.addEventListener('touchmove', preventMultiTouch, options);
		for (const eventName of gestureEvents) {
			document.addEventListener(eventName, preventGesture, options);
		}

		return () => {
			document.removeEventListener('touchstart', preventMultiTouch);
			document.removeEventListener('touchmove', preventMultiTouch);
			for (const eventName of gestureEvents) {
				document.removeEventListener(eventName, preventGesture);
			}
		};
	});
</script>

{@render children()}
