<script lang="ts">
	import { onMount } from "svelte";

  export let scrollMarker: HTMLElement | undefined;
  export let text = "Scroll to view more!";
  export let threshold = 1;

  let scrolled_to_bottom = false;

  onMount(() => {
      setTimeout(() => {
          if (scrollMarker === undefined) {
              console.log("undefined marker");
              return;
          }

          const observer = new IntersectionObserver(entries => {
              console.log(entries[0]);
              scrolled_to_bottom = entries[0].intersectionRatio >= threshold;
          }, {
              rootMargin: `${threshold*100}% 0px 0px 0px`,
              threshold: threshold,
          });

          observer.observe(scrollMarker);
      }, 10);
  });
</script>

<div class="indicator" class:scrolled={scrolled_to_bottom}>
    { text }
</div>

<style lang="scss">
    .indicator {
        position: fixed;
        bottom: 0;
        left: 50%;
        translate: -50%;
        z-index: 5;

        border: 1px solid black;
        border-bottom: none;
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;

        background: white;
        padding: 0.5em;
        text-align: center;
        transition: 0.2s;

        &.scrolled {
            transform: translateY(100%);
        }
    }
</style>
