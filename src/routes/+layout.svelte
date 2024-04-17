<script>
	import Header from './Header.svelte';
	import './styles.css';

    export let data;
    let { user } = data;
</script>

<div class="app">
    <Header bind:user/>

	<main>
        <div class="container">
		<slot />
        </div>
	</main>

	<footer>
	</footer>
</div>

<style lang="scss">
	@import 'global';

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		display: grid;
		padding: 1rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
		grid-template-columns: 1fr min($content-width, 100%) 1fr;
		grid-template-areas: '. content .';
		flex-grow: 1;
		overflow: hidden;
	}

	main > :global(*) {
		grid-area: content;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0;
	}
</style>
