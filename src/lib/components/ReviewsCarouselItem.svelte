<script lang="ts">
	export let quote: string;
	export let author: string;
</script>

<figure class="review">
	<blockquote>{quote}</blockquote>
	<figcaption>— {author}</figcaption>
</figure>

<style lang="scss">
	.review {
		flex: 0 0 auto;
		width: min(50ch, 70vw);
		scroll-snap-align: center;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1rem;
		color: var(--text);
		backdrop-filter: blur(6px);
	}

	.review blockquote {
		margin: 0 0 0.75rem 0;
		font-size: 1.3rem;
		line-height: 1.5;
	}

	.review figcaption {
		font-size: 0.9rem;
		font-weight: 600;
		opacity: 0.85;
		text-align: right;
	}
</style>
