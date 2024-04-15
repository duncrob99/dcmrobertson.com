<script lang="ts">
	import { parse } from 'cookie';
	import { onMount } from 'svelte';

	let symbols: HTMLElement;
	let fps: number = 0;

	onMount(() => {
		const max_density = 0.2; // symbols per 100px^2
		let max_symbols = Math.floor(((window.innerWidth * window.innerHeight) / 10000) * max_density);
		while (symbols.children.length > max_symbols) {
			symbols.removeChild(symbols.children[Math.floor(Math.random() * symbols.children.length)]);
		}

		// Get min & max transforms
		let current_bbox = symbols.children[0].getBoundingClientRect();
		let current_centre = {
			x: current_bbox.left + current_bbox.width / 2,
			y: current_bbox.top + current_bbox.height / 2
		};

		let max_translations = {
			x: {
				min: -1 * current_centre.x,
				max: window.innerWidth - current_centre.x
			},
			y: {
				min: -1 * current_centre.y,
				max: window.innerHeight - current_centre.y
			}
		};

		let x_translation_distribution: Array<number> = [];
		let y_translation_distribution: Array<number> = [];
		let rotation_distribution: Array<number> = [];
		let scale_distribution: Array<number> = [];
		let fade_speed_distribution: Array<number> = [];
		let fade_stagger_distribution: Array<number> = [];

		const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
		const randomness = 1;
		const random = () => Math.random() * randomness * 2 - randomness;
		const random_offset = (ix: number) =>
			clamp((ix + 0.5 + random()) / symbols.children.length, 0, 1);

		Array.from(symbols.children).forEach((_, ix) => {
			x_translation_distribution.push(random_offset(ix));
			y_translation_distribution.push(random_offset(ix));
			rotation_distribution.push(random_offset(ix));
			scale_distribution.push(random_offset(ix));
			fade_speed_distribution.push(random_offset(ix));
			fade_stagger_distribution.push(random_offset(ix));
		});

		function get_random_val(distribution: Array<number>) {
			let value = distribution[Math.floor(Math.random() * distribution.length)];
			distribution.splice(distribution.indexOf(value), 1);
			return value;
		}

		// Randomise symbol position
		Array.from(symbols.children).forEach((node, ix) => {
			let symbol = node as HTMLElement;
			symbol.style.setProperty(
				'--origin-x',
				`${
					get_random_val(x_translation_distribution) *
						(max_translations.x.max - max_translations.x.min) +
					max_translations.x.min
				}px`
			);
			symbol.style.setProperty(
				'--origin-y',
				`${
					get_random_val(y_translation_distribution) *
						(max_translations.y.max - max_translations.y.min) +
					max_translations.y.min
				}px`
			);
			symbol.style.setProperty('--rotate', `${get_random_val(rotation_distribution) * 90 - 45}deg`);
			symbol.style.setProperty('--scale', `${get_random_val(scale_distribution) * 80 + 50}%`);
			symbol.style.setProperty(
				'--fade-speed',
				`${get_random_val(fade_speed_distribution) * 2 + 1}s`
			);
			symbol.style.setProperty('--fade-stagger', `${get_random_val(fade_stagger_distribution)}s`);
		});

		// Make symbols opaque
		Array.from(symbols.children).forEach((node) => {
			let symbol = node as HTMLElement;
			symbol.style.opacity = '0.25';
		});

		let cursor_pos: {
			x: number;
			y: number;
		};
		let movement_initialised = false;
		function initialise_movement() {
			movement_initialised = true;
			const interval = 1000 / 60; // ms
			const cursor_force_coefficient = 7e5;
			const origin_force_coefficient = 20;
			const damping_coefficient = 5;

			let frames = 0;

			Array.from(symbols.children).forEach((node, ix) => {
				let symbol = node as HTMLElement;
				let style = getComputedStyle(symbol);
				let bbox = symbol.getBoundingClientRect();

				let origin = {
					x: bbox.left + bbox.width / 2 - parseFloat(style.getPropertyValue('translate').split(' ')[0]),
					y: bbox.top + bbox.height / 2 - parseFloat(style.getPropertyValue('translate').split(' ')[1])
					//x: bbox.left + bbox.width / 2 - parseFloat(style.getPropertyValue('--translate-x')),
					//y: bbox.top + bbox.height / 2 - parseFloat(style.getPropertyValue('--translate-y'))
				};

				// Apply forces to symbol to move it away from cursor
				let int = setInterval(() => {
					if (symbols === null) {
						clearInterval(int);
						return;
					}
					frames += 1 / symbols.children.length;
					bbox = symbol.getBoundingClientRect();
					let cur_pos = {
						x: bbox.left + bbox.width / 2,
						y: bbox.top + bbox.height / 2
					};
					let cur_vel = {
						x: parseFloat(style.getPropertyValue('--velocity-x')) || 0,
						y: parseFloat(style.getPropertyValue('--velocity-y')) || 0
					};

					let mouse_force_vector = {
						x: cursor_pos.x - cur_pos.x,
						y: cursor_pos.y - cur_pos.y
					};

					let mouse_distance =
						Math.pow(mouse_force_vector.x, 2) + Math.pow(mouse_force_vector.y, 2);
					mouse_force_vector = {
						x: (-mouse_force_vector.x / mouse_distance) * cursor_force_coefficient,
						y: (-mouse_force_vector.y / mouse_distance) * cursor_force_coefficient
					};

					let origin_force_vector = {
						x: (origin.x - cur_pos.x) * origin_force_coefficient,
						y: (origin.y - cur_pos.y) * origin_force_coefficient
					};
					let damping_force_vector = {
						x: cur_vel.x * damping_coefficient,
						y: cur_vel.y * damping_coefficient
					};

					let total_force_vector = {
						x: mouse_force_vector.x + origin_force_vector.x - damping_force_vector.x,
						y: mouse_force_vector.y + origin_force_vector.y - damping_force_vector.y
					};

					let new_vel = {
						x: cur_vel.x + (total_force_vector.x * interval) / 1000,
						y: cur_vel.y + (total_force_vector.y * interval) / 1000
					};

					let new_pos = {
						x: cur_pos.x + (new_vel.x * interval) / 1000,
						y: cur_pos.y + (new_vel.y * interval) / 1000
					};

					symbol.style.setProperty('--velocity-x', `${new_vel.x}px`);
					symbol.style.setProperty('--velocity-y', `${new_vel.y}px`);
					//symbol.style.setProperty('--translate-x', `${new_pos.x - origin.x}px`);
					//symbol.style.setProperty('--translate-y', `${new_pos.y - origin.y}px`);
					symbol.style.setProperty('translate', `${new_pos.x - origin.x}px ${new_pos.y - origin.y}px`);
				}, interval);
			});

			// Draw circles that spread out from cursor
			let circle_interval = setInterval(() => {
				if (symbols === null) {
					clearInterval(circle_interval);
					return;
				}
				let circle = document.createElement('div');
				circle.classList.add('circle');
				circle.style.setProperty('--x', `${cursor_pos.x - symbols.getBoundingClientRect().left}px`);
				circle.style.setProperty('--y', `${cursor_pos.y - symbols.getBoundingClientRect().top}px`);
				circle.style.setProperty('--completion', '0');
				circle.style.setProperty('--opacity', '1');
				symbols.appendChild(circle);

				setTimeout(() => {
					circle.style.setProperty('--completion', '1');
					circle.style.setProperty('--opacity', '0');
				}, 0);

				setTimeout(() => {
					circle.remove();
				}, 5000);
			}, 2000);

			// Calculate FPS
			/*
			setInterval(() => {
				let now = Date.now();
				fps = 1000 * frames / (now - last_time);
				last_time = now;
				frames = 0;
			}, 1000);
			*/
		}
		// Move symbols away from cursor
		window.addEventListener('mousemove', (e) => {
			cursor_pos = {
				x: e.clientX,
				y: e.clientY
			};

			if (!movement_initialised) {
				initialise_movement();
			}
		});

		// Move symbols away from touch
		window.addEventListener('touchmove', (e) => {
			cursor_pos = {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY
			};

			if (!movement_initialised) {
				initialise_movement();
			}
		});
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<!--
	<div class="fps">
		{fps.toFixed(2)} FPS
	</div>
	-->
	<div class="headings">
		<h1>Duncan Robertson Tutoring</h1>

		<h2>Guiding students to a deeper understanding and appreciation of maths and science</h2>
	</div>

	<div class="portrait-container">
		<img class="portrait" src="/portrait.jpg" alt="portrait" />
	</div>

	<div bind:this={symbols} class="symbols">
		<!-- Faded mathematical symbols (svgs in static/symbols) that move away from the cursor -->
		<img src="/symbols/sum to n.svg" alt="sum to n" />
		<img src="/symbols/int to infty.svg" alt="int to infty" />
		<img src="/symbols/dydx.svg" alt="dydx" />
		<img src="/symbols/area of circle.svg" alt="area of circle" />
		<img src="/symbols/quadratic inequality.svg" alt="quadratic inequality" />
		<img src="/symbols/wave equation.svg" alt="wave equation" />
		<img src="/symbols/chain rule.svg" alt="chain rule" />
		<img src="/symbols/pythag.svg" alt="pythag" />
		<img src="/symbols/quadratic formula.svg" alt="quadratic formula" />
		<img src="/symbols/cos law.svg" alt="cos law" />
		<img src="/symbols/definition of derivative.svg" alt="definition of derivative" />
		<img src="/symbols/fundamental theorem of calculus.svg" alt="fundamental theorem of calculus" />
	</div>
</section>

<style lang="scss">
	section {
		position: relative;
		display: grid;
		background: var(--background);
		grid-template-columns: 1fr 2fr;
		grid-template-areas: 'symbols heading';
		height: 100%;
		$vertical-breakpoint: 800px;

		/*
		.fps {
			position: absolute;
			top: 0;
			right: 0;
			padding: 1rem;
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--text);
			background: var(--background);
		}
		*/

		@media (max-width: $vertical-breakpoint) {
			grid-template-columns: 1fr;
			grid-template-rows: min-content min-content 1fr;
			grid-template-areas: 'heading' 'portrait' 'symbols';
		}

		.headings {
			grid-area: heading;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding: 0 1rem;

			h1 {
				font-family: var(--display-font);
				font-weight: 700;
				font-size: 3rem;
			}

			h2 {
				font-size: 2rem;
				text-align: center;
			}
		}

		.symbols {
			grid-area: symbols;

			img {
				--origin-x: 0;
				--origin-y: 0;
				--translate-x: 0;
				--translate-y: 0;
				--scale: 1;
				--rotate: 0;
				--fade-speed: 1s;
				--fade-stagger: 0;
				--opacity: 0.5;

				position: absolute;
				top: var(--origin-y);
				left: var(--origin-x);
				width: 30em;
				height: 40em;
				object-fit: contain;
				opacity: 0;
				pointer-events: none;
				translate: 1px 1px;
				scale: 1;
				rotate: 0;
				/*transform: translate(var(--translate-x), var(--translate-y)) scale(var(--scale))
					rotate(var(--rotate));*/
				transition: opacity var(--fade-speed) var(--fade-stagger);
			}

			:global(.circle) {
				--x: 0;
				--y: 0;
				--completion: 0;
				--opacity: 0;
				--final-radius: 300px;
				--duration: 5000ms;

				position: absolute;
				top: var(--y);
				left: var(--x);
				width: var(--final-radius);
				height: var(--final-radius);
				border-radius: 50%;
				background: radial-gradient(
					circle at center,
					rgba(28, 167, 121, 0) 0%,
					rgba(28, 167, 121, 0.1) 90%,
					rgba(28, 167, 121, 1) 100%
				);
				opacity: var(--opacity);
				pointer-events: none;
				transform: translate(-50%, -50%) scale(var(--completion));
				transition: opacity var(--duration), width var(--duration), height var(--duration),
					transform var(--duration);
			}
		}

		.portrait-container {
			grid-area: symbols;
			z-index: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;

			.portrait {
				object-fit: contain;
				border-radius: 50%;
				max-width: 40vw;
			}
		}
	}
</style>
