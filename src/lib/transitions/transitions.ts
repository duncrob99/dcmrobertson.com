import { assign, is_function } from "svelte/internal";
import type { CrossfadeParams, TransitionConfig } from "svelte/transition";
import { linear, cubicOut, cubicIn, expoIn, expoOut } from "svelte/easing";

type ClientRectMap = Map<any, Element>;

export function stretchy_crossfade({ fallback, ...defaults }: CrossfadeParams & {
    fallback: (node: Element, params: CrossfadeParams, intro: boolean) => TransitionConfig;
}): [
        (
            node: Element,
            params: CrossfadeParams & {
                key: any;
            }
        ) => () => TransitionConfig,
        (
            node: Element,
            params: CrossfadeParams & {
                key: any;
            }
        ) => () => TransitionConfig
    ] {
    const to_receive: ClientRectMap = new Map();
    const to_send: ClientRectMap = new Map();

    function crossfade(to_node: Element, from_node: Element, params: CrossfadeParams): TransitionConfig {
        const {
            delay = 0,
            duration = (d: number) => Math.sqrt(d) * 30,
            easing = linear
        } = assign(assign({}, defaults), params);

        console.log("Crossfading");

        const to = to_node.getBoundingClientRect();
        const from = from_node.getBoundingClientRect();
        const dleft = to.left - from.left;
        const dright = dleft + to.width - from.width;
        const dy = to.top - from.top;
        const dw = to.width / from.width;
        const dh = to.height / from.height;
        const d = Math.sqrt(dleft * dleft + dy * dy);
        const direction = Math.sign(dleft) || 1;

        const style = getComputedStyle(from_node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const opacity = +style.opacity;

        console.log(direction, dleft, dright, from.width, to.width);

        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (t, u) => {
                let left = direction ? expoIn(u) * dleft : expoOut(u) * dleft;
                let right = direction ? expoOut(u) * dright : expoIn(u) * dright;
                let scale = ((from.left + left) - (from.width + right)) / from.width;
                return `
				opacity: 1;
				transform-origin: top left;
				transform: ${transform};
                translate: ${left}px ${u * dy}px;
                scale: ${scale} ${t + (1 - t) * dh};
			`
            }
        };
    }

    function transition(items: ClientRectMap, counterparts: ClientRectMap, intro: boolean) {
        return (node: Element, params: CrossfadeParams & { key: any }) => {
            items.set(params.key, node);

            return () => {
                if (counterparts.has(params.key)) {
                    const other_node = counterparts.get(params.key);
                    counterparts.delete(params.key);

                    return crossfade(other_node as Element, node, params);
                }

                // if the node is disappearing altogether
                // (i.e. wasn't claimed by the other list)
                // then we need to supply an outro
                items.delete(params.key);
                return fallback && fallback(node, params, intro);
            };
        };
    }


    return [
        (node, params) => {
            return () => {
                to_send.set(params.key, node);
                return {
                    delay: 0,
                    duration: 100,
                    easing: (t) => Math.min(1, 0.000001 * t),
                    css: (t, u) => `opacity: ${t};`
                }
            }
        },
        transition(to_receive, to_send, true),
    ];
}