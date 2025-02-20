<script>
	import Header from './Header.svelte';
	import './styles.scss';

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
		flex-direction: column;
		min-height: calc(100dvh);
	}

	main {
		display: grid;
		width: 100%;
		margin: 0 0;
		box-sizing: border-box;
		grid-template-columns: 1fr min($content-width, 100%) 1fr;
		grid-template-areas: '. content .';
        min-height: 100dvh;
        $padding: 2rem;
        padding: $padding;
        padding-top: $navbar-height + $padding;
        top: 0;
        position: relative;
        overflow: hidden;
	}

	main > :global(*) {
		grid-area: content;
		display: flex;
		flex-direction: column;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0;
	}
</style>
