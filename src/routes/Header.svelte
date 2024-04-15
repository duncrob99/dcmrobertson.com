<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/images/int_dr.svg';
	import type { User } from '$lib/server/auth_utils';
	import { stretchy_crossfade } from '$lib/transitions/transitions';
	import { tick, onMount } from 'svelte';
	import { cubicIn, cubicInOut, cubicOut, quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let pages = [
		[
			{ name: 'Home', url: '/' },
			{ name: 'About', url: '/about' },
			{ name: 'Availability', url: '/availability' }
		],
        //[
		//	{ name: 'Login', url: '/login' },
		//	{ name: 'Register', url: '/register' }
		//]
	];

	export let user: User | undefined;

    let account_links = user ? [
        { name: `Hello, ${user.email.split('@')[0]}`, url: '/account' },
        { name: 'Logout', url: '/logout' }
    ] : [
        { name: 'Login', url: '/login' },
        { name: 'Register', url: '/register' }
    ];

    let links = [...pages, account_links];

    const [send, receive] = crossfade({
        duration: d => Math.sqrt(d * 1000),

        fallback(node, params) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;

            return {
                duration: 900,
                easing: cubicInOut,
                css: t => `
                    transform: ${transform} scale(${t});
                    opacity: ${t}
                `
            };
        }
    });

	let overflow = false;
	let collapsed = false;

	function checkOverflow() {
		overflow = false;
		tick().then(() => {
			const nav = document.querySelector('nav');
			if (!nav) return;
			overflow = nav.scrollWidth > nav.clientWidth;
			console.log(overflow);
		});
	}

	onMount(() => {
		checkOverflow();
		window.addEventListener('resize', checkOverflow);
	});
</script>

<header class:overflow class:collapsed>
	<nav>
		<a href="/"><img src={logo} alt="logo" /></a>
		{#each links as pageGroup}
			<ul>
				{#each pageGroup as page_link (page_link.url)}
					<li aria-current={$page.url.pathname === page_link.url ? 'page' : undefined}>
						<a href={page_link.url}>{page_link.name}</a>
						{#if $page.url.pathname === page_link.url}
							<div in:receive="{{key: 0}}" out:send="{{key: 0}}" class="underline"></div>
						{/if}
					</li>
				{/each}
			</ul>
		{/each}
	</nav>
</header>

<style lang="scss">
	@import 'global';

	header {
		$background: rgba(255, 255, 255, 0.7);
		$nav-height: 4rem;

		&:not(.overflow) {
			display: grid;
			grid-template-columns: 1fr $content-width 1fr;
			grid-template-areas: '. content .';
			background: $background;

			nav {
				width: min(100vw, $content-width);
				grid-area: content;
				display: flex;
				justify-content: space-between;
				gap: 4rem;
				position: relative;
			}

			ul {
				position: relative;
				padding: 0;
				margin: 0;
				height: $nav-height;
				display: flex;
				justify-content: start;
				align-items: center;
				list-style: none;

				li {
					position: relative;
					height: 100%;

					.underline {
						content: '';
						width: 100%;
						height: 5px;
						position: absolute;
						bottom: 0;
						left: 0;
						background: var(--color-theme-1);
						border-radius: 5px;
						border-top-right-radius: 5px;
					}
				}
			}

			nav a {
				display: flex;
				height: 100%;
				align-items: center;
				padding: 0 0.5rem;
				color: var(--color-text);
				font-weight: 700;
				font-size: 0.8rem;
				text-transform: uppercase;
				letter-spacing: 0.1em;
				text-decoration: none;
				transition: color 0.2s linear;
			}
		}

		a:hover {
			color: var(--color-theme-1);
		}

		img {
			height: $nav-height * 0.7;
			padding-right: 2rem;
		}
	}
</style>
