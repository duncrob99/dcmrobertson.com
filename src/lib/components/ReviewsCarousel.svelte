<script lang="ts">
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';

	export let ariaLabel = 'Student reviews';
	export let pauseMs = 6000;
	export let transitionMs = 1000;

	let container: HTMLDivElement;
	let firstSetWidth = 0;
	let items: HTMLElement[] = [];
	let currentIndex = 0;

	async function slowScroll(el: HTMLElement, scrollParams: ScrollToOptions, duration: number) {
		const start = {
			left: el.scrollLeft,
			top: el.scrollTop
		};
		const change = {
			left: scrollParams.left ? scrollParams.left - start.left : 0,
			top: scrollParams.top ? scrollParams.top - start.top : 0
		};
		const increment = {
			left: change.left / duration,
			top: change.top / duration
		};
		const startTime = DateTime.now();
		let elapsedTime = 0;

		function easeInOutQuad(t: number) {
			t /= 0.5;
			if (t < 1) return (t * t * t) / 2;
			t -= 2;
			return (t * t * t + 2) / 2;
		}

		const animate = () => {
			elapsedTime = DateTime.now().diff(startTime).as('milliseconds');
			if (elapsedTime >= duration) {
				el.scrollLeft = scrollParams.left ?? el.scrollLeft;
				el.scrollTop = scrollParams.top ?? el.scrollTop;
				return;
			}
			el.scrollLeft = start.left + change.left * easeInOutQuad(elapsedTime / duration);
			el.scrollTop = start.top + change.top * easeInOutQuad(elapsedTime / duration);
			requestAnimationFrame(animate);
		};

		requestAnimationFrame(animate);
	}

	onMount(() => {
		const firstSet = container.querySelector('.reviews-set') as HTMLElement | null;
		if (!firstSet) {
			return;
		}
		items = Array.from(firstSet.querySelectorAll('.review'));
		if (items.length === 0) {
			return;
		}
		firstSetWidth = firstSet.scrollWidth;

		const overscrollItem = container.querySelector(
			'.reviews-set:last-child .review'
		) as HTMLElement | null;
		if (!overscrollItem) {
			return;
		}

		const scrollToIndex = (index: number, smooth?: boolean) => {
			smooth = smooth ?? true;
			const item = index === 0 ? overscrollItem : items[index];
			const left = item.offsetLeft + item.offsetWidth / 2 - container.clientWidth / 2;
			// container.scrollTo({ left, behavior: 'smooth' });
			if (smooth) {
				slowScroll(container, { left }, transitionMs);
			} else {
				container.scrollTo({ left });
			}
			console.log('Scrolling to index:', index);
			console.log('left:', left);

			if (index === 0) {
				setTimeout(() => {
					console.log('resetting pos');
					container.scrollTo({
						left: items[0].offsetLeft + items[0].offsetWidth / 2 - container.clientWidth / 2
					});
				}, transitionMs + 50);
			}
		};

		scrollToIndex(currentIndex, false);
		currentIndex = (currentIndex + 1) % items.length;

		const intervalId = setInterval(() => {
			scrollToIndex(currentIndex);
			currentIndex = (currentIndex + 1) % items.length;
		}, pauseMs + transitionMs);

		return () => {
			clearInterval(intervalId);
		};
	});
</script>

<div bind:this={container} class="reviews-carousel" aria-label={ariaLabel}>
	<div class="reviews-track">
		<div class="reviews-set">
			<slot />
		</div>
		<div class="reviews-set" aria-hidden="true">
			<slot />
		</div>
	</div>
</div>

<style lang="scss">
	.reviews-carousel {
		position: relative;
		width: min(520px, 90vw);
		overflow: hidden;
		padding: 0.5rem calc(var(--transparent-width) + 1rem);
		//scroll-snap-type: x mandatory;
		scrollbar-width: none;
		--transparent-width: 10%;
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black var(--transparent-width),
			black calc(100% - var(--transparent-width)),
			transparent 100%
		);
	}

	.reviews-track {
		display: flex;
		gap: 1.5rem;
		width: max-content;
	}

	.reviews-set {
		display: flex;
		gap: 1.5rem;

		&:first-child {
			padding-left: 50rem;
		}

		&:last-child {
			padding-right: 50rem;
		}
	}

	.reviews-carousel::-webkit-scrollbar {
		display: none;
	}
</style>
