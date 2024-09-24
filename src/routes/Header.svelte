<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/images/int_dr.svg';
	import type { User } from '$lib/server/auth_utils';
	import { stretchy_crossfade } from '$lib/transitions/transitions';
	import { tick, onMount } from 'svelte';
	import { cubicIn, cubicInOut, cubicOut, quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
    import '/src/styles/hamburgers/hamburgers.scss';

	export let pages = [
		[
			{ name: 'Home', url: '/' },
			{ name: 'About', url: '/about' },
			{ name: 'Availability', url: '/availability' },
            { name: 'Contact', url: '/contact' },
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

    //let links = [...pages, account_links];
    let links = [...pages, []];

    $: currentPage = links.flat().find(page_link => {
        const withoutTrailingSlash = page_link.url.replace(/\/$/, '');
        const pageWithoutTrailingSlash = $page.url.pathname.replace(/\/$/, '');
        return withoutTrailingSlash === pageWithoutTrailingSlash;
    })?.url;

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
	let collapsed = true;

	function checkOverflow() {
		overflow = false;
		tick().then(() => {
			const nav = document.querySelector('nav');
			if (!nav) return;
			overflow = nav.scrollWidth > nav.clientWidth;
		});
	}

	onMount(() => {
		checkOverflow();
		window.addEventListener('resize', checkOverflow);

        window.addEventListener('click', (e) => {
            if (collapsed) return;
            if (e.target !== document.querySelector('nav .hamburger')) {
                collapsed = true;
            }
        });
	});
</script>

<header class:overflow class:collapsed>
	<nav>
        <a class="logo" href="/"><img src={logo} alt="logo"/></a>
        {#if overflow}
            <button class="hamburger hamburger--collapse" class:is-active={!collapsed} type="button" on:click={() => collapsed = !collapsed}>
                <span class="hamburger-box">
                    <span class="hamburger-inner"></span>
                </span>
            </button>
        {/if}
		{#each links as pageGroup}
			<ul>
				{#each pageGroup as page_link (page_link.url)}
                    <li aria-current={currentPage === page_link.url ? 'page' : undefined}>
						<a href={page_link.url}>{page_link.name}</a>
                        {#if currentPage === page_link.url}
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
		$background: rgba(255, 255, 255, 1);
        $corner-radius: 20px;
        --max-width: 90%;

        background: $background;
        display: grid;
        grid-template-columns: 1fr min($content-width, 100%) 1fr;
        grid-template-areas: '. content .';
        padding: 0 1rem;
        height: $navbar-height;
        z-index: 10;
        position: fixed;
        top: 0;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
        width: calc(var(--max-width) - 2rem);

        nav {
            grid-area: content;
            display: grid;
            grid-template-columns: 1fr min-content;

            ul {
                grid-column: 1 / 3;
                transition: transform 0.3s ease-in-out;
                margin: 0;
                margin-left: -1em;
                list-style: none;
                padding-left: 1em;

                &:first-of-type {
                    padding-top: 100%;
                    margin-top: -100%;
                }

                li {
                    margin-block: 1rem;

                    &[aria-current='page'] {
                        a {
                            color: var(--color-theme-1);
                        }
                    }
                }
            }

            > * {
                background: $background;
            }
        }

        .hamburger {
            height: $navbar-height;
            aspect-ratio: 1;
            z-index: 1;
            border-bottom-right-radius: $corner-radius;
            padding: 0;
            opacity: 1 !important;

            * {
                pointer-events: none;
            }
        }

        nav a {
            display: flex;
            align-items: center;
            padding: 0 0.5rem;
            color: var(--color-text);
            font-weight: 700;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-decoration: none;
            transition: color 0.2s linear;

            &.logo {
                height: $navbar-height;
                z-index: 1;
            }
        }

        &.collapsed.overflow ul {
            transform: translateY(-100%);
            pointer-events: none;
        }

        &.overflow {
            padding-right: 0;
            border-bottom-right-radius: $corner-radius;

            ul {
                border-bottom-right-radius: $corner-radius;
            }
        }

		&:not(.overflow) {
            --max-width: 100%;

			nav {
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
				height: $navbar-height;
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
                height: 100%;
            }
		}

		a:hover {
			color: var(--color-theme-1);
		}

		img {
			height: $navbar-height * 0.7;
			padding-right: 2rem;
		}
	}
</style>
