<script lang="ts">
    import { loremIpsum, LoremIpsum } from "lorem-ipsum";

    export let summary: string = loremIpsum();
    export let startOpen = false;

    let isClosing = false;
    let isOpening = false;
    let animation = null;
    let animationStartHeight = 0;

    let details: HTMLDetailsElement;
    let summary_el: HTMLElement;
    let content: HTMLDivElement;

    const animationDuration = 400;

    function toggle(ev: MouseEvent) {
        ev.preventDefault();
        console.log("Toggling");

        if (isClosing || !details.open) {
            open();
        } else if (isOpening || details.open) {
            shrink();
        }
    }

    function shrink() {
        isClosing = true;
        const startHeight = `${details.offsetHeight}px`;
        const endHeight = `${summary_el.offsetHeight}px`;

        animation?.cancel();
        animation = details.animate({
            height: [startHeight, endHeight]
        }, {
            duration: animationDuration,
            easing: 'ease-out',
        });

        animation.onfinish = () => onAnimationFinish(false);
        animation.oncancel = () => isClosing = false;
    }

    function open() {
        animationStartHeight = details.offsetHeight;
        details.style.height = `{animationStartHeight}px`;
        details.open = true;
        window.requestAnimationFrame(expand);
    }

    function expand() {
        isOpening = true;
        const startHeight = `${animationStartHeight}px`;
        const endHeight = `${summary_el.offsetHeight + content.offsetHeight}px`;
        console.log(`Expanding from ${startHeight} to ${endHeight}`);

        animation?.cancel();
        animation = details.animate({
            height: [startHeight, endHeight]
        }, {
            duration: animationDuration,
            easing: 'ease-out',
        });

        animation.onfinish = () => onAnimationFinish(true);
        animation.oncancel = () => isOpening = false;
    }

    function onAnimationFinish(open: boolean) {
        details.open = open;
        animation = null;
        isClosing = false;
        isOpening = false;
        details.style.height = details.style.overflow = '';
    }
</script>

<details open={startOpen} bind:this={details}>
    <summary bind:this={summary_el} on:click={toggle}>{summary}</summary>
    <div bind:this={content}>
        <slot />
    </div>
</details>

<style lang="scss">
    @import 'src/styles/global';

		details {
			width: 100%;
      overflow: hidden;

			summary {
				font-size: 1.5em;
				font-weight: bold;
        padding: 1em;
        padding-bottom: 0;
        border-bottom: 1px solid blue;
			}

      & > div {
          background: rgba(255, 255, 255, 0.9);
          padding: 1em;

          :global(:last-child) {
              margin-block-end: 0;
          }
      }
		}
</style>
