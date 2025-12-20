<script lang="ts">
	import { TimeRange, type Availability, AppointmentState } from '$lib/types';
	import { Time, Day } from '$lib/types';
	import { tick, onMount } from 'svelte';

	export let appointments: Availability[];
	export let startHour = 0;
	export let endHour = 24;
	export let num_weeks = 10;
	let shortenDays = true;
	let days: HTMLDivElement;

	let showTimes = true;
	let testingTimeWidth = false;
	let appointmentsEl: HTMLDivElement;
	export let calendarEl: HTMLDivElement;

	async function checkDayOverflow() {
		if (!days) return;
		shortenDays = false;
		await tick();
		for (const label of days.children) {
			if (label.scrollWidth > label.clientWidth) {
				shortenDays = true;
				break;
			}
		}
	}

	async function checkTimeOverflow() {
		if (!appointmentsEl) return;
		showTimes = true;
		testingTimeWidth = true;
		await tick();
		for (const appointment of appointmentsEl.children) {
			const timeStyle = window.getComputedStyle(appointment, ':after');
			const timeWidth = parseFloat(timeStyle.width);
			if (timeWidth > appointment.clientWidth) {
				console.log('hiding times due to ', appointment);
				console.log(timeWidth, appointment.clientWidth);
				showTimes = false;
				break;
			}
		}
		testingTimeWidth = false;
	}

	function getVisibleDuration(time: TimeRange): number {
		const start = Math.max(time.start.asQuarterHours(), startHour * 4);
		const end = Math.min(time.end.asQuarterHours(), endHour * 4);
		return end - start;
	}

	function checkTimeAvailable(time: TimeRange, offset: number): boolean {
		let effective_time_range = new TimeRange(
			time.day,
			Time.fromQuarterHours(time.start.asQuarterHours() + offset),
			Time.fromQuarterHours(time.start.asQuarterHours() + offset + 4)
		);
		let val = Array.from(appointments)
			.filter((app) => app.booked > 0)
			.every((app) => !effective_time_range.overlaps(app.time_range));

		return val;
	}

	onMount(() => {
		checkDayOverflow();
		checkTimeOverflow();
		window.addEventListener('resize', checkDayOverflow);
		window.addEventListener('resize', checkTimeOverflow);

		const calendarObserver = new IntersectionObserver((entries) => {
			console.log(entries[0]);
		});

		calendarObserver.observe(calendarEl);
	});

	$: marked_appointments = appointments.map((app, ix) => {
		const abutsStart =
			appointments[ix - 1]?.time_range.end.toString() === app.time_range.start.toString();
		const abutsEnd =
			appointments[ix + 1]?.time_range.start.toString() === app.time_range.end.toString();
		const displayTime = !(
			ix !== 0 &&
			abutsStart &&
			appointments[ix - 1].booked > 0 === app.booked > 0 &&
			appointments[ix - 1].available > 0 === app.available > 0
		);

		if (app.time_range.day === Day.Friday) {
			console.log(
				'Friday: ',
				abutsEnd,
				app.time_range.toString(),
				appointments[ix + 1].available,
				app.available
			);
		}

		let displayTimeRange = TimeRange.fromJSON(JSON.stringify(app.time_range));
		let i = ix + 1;
		while (
			displayTime &&
			i < appointments.length &&
			appointments[i].time_range.start.toString() === displayTimeRange.end.toString() &&
			appointments[i].booked > 0 === app.booked > 0 &&
			appointments[i].available > 0 === app.available > 0
		) {
			displayTimeRange.end = appointments[i].time_range.end;
			i++;
		}

		return {
			matchStart:
				ix !== 0 &&
				abutsStart &&
				appointments[ix - 1].booked > 0 === app.booked > 0 &&
				appointments[ix - 1].available > 0 === app.available > 0,
			matchEnd:
				ix !== appointments.length - 1 &&
				abutsEnd &&
				appointments[ix + 1].booked > 0 === app.booked > 0 &&
				appointments[ix + 1].available > 0 === app.available > 0,
			displayTimeRange,
			displayTime,
			abutsStart,
			abutsEnd,
			state:
				app.booked > 0
					? AppointmentState.Booked
					: app.available > 0
					? AppointmentState.Available
					: undefined,
			...app
		};
	});
</script>

<div class="calendar-legend" style="--num-weeks: {num_weeks};">
	<div class="legend--appointment bookable" style="--available: {num_weeks}">Available</div>
	<div class="legend--appointment booked" style="--booked: {num_weeks};">Booked</div>
</div>
<div
	class="calendar-container"
	style="--num-rows: {endHour - startHour}; --num-weeks: {num_weeks}"
	bind:this={calendarEl}
>
	<div bind:this={days} class="days">
		{#if shortenDays}
			<div>Sun</div>
			<div>Mon</div>
			<div>Tue</div>
			<div>Wed</div>
			<div>Thu</div>
			<div>Fri</div>
			<div>Sat</div>
		{:else}
			<div>Sunday</div>
			<div>Monday</div>
			<div>Tuesday</div>
			<div>Wednesday</div>
			<div>Thursday</div>
			<div>Friday</div>
			<div>Saturday</div>
		{/if}
	</div>
	<div class="times">
		{#each Array.from({ length: endHour - startHour }, (_, i) => i + startHour) as hour}
			<div>{hour.toString().padStart(2, '0')}:00</div>
		{/each}
	</div>
	<div class="appointments" bind:this={appointmentsEl}>
		{#if appointments.length > 0}
			{#each marked_appointments as appointment, app_ix}
				{@const visible_duration = getVisibleDuration(appointment.time_range)}
				{#if visible_duration >= 1}
					<div
						class="appointment"
						class:bookable={appointment.state === AppointmentState.Available ||
							appointment.available > 0}
						class:booked={appointment.state === AppointmentState.Booked || appointment.booked > 0}
						class:show-times={showTimes && appointment.displayTime}
						class:match-start={appointment.matchStart}
						class:match-end={appointment.matchEnd}
						class:testing-time-width={testingTimeWidth}
						style="grid-row: {Math.max(
							appointment.time_range.start.asQuarterHours() + 1 - startHour * 4,
							1
						)}
                    / {Math.min(
							appointment.time_range.end.asQuarterHours() + 1 - startHour * 4,
							4 * (endHour - startHour) + 1
						)};
                    grid-column: {appointment.time_range.day + 1} / {appointment.time_range.day +
							2};
                    --duration: {visible_duration}; --booked: {appointment.booked}; --available: {appointment.available};"
						data-start-hour={appointment.displayTimeRange.start.hour}
						data-start-minute={appointment.displayTimeRange.start.minute
							.toString()
							.padStart(2, '0')}
						data-end-hour={appointment.displayTimeRange.end.hour}
						data-end-minute={appointment.displayTimeRange.end.minute.toString().padStart(2, '0')}
					>
						{#each Array.from({ length: visible_duration - (appointment.matchEnd ? 0 : 3) }, (_, i) => i) as offset}
							{#if checkTimeAvailable(appointment.time_range, offset)}
								{@const available =
									offset < visible_duration - 3
										? appointment.available
										: Math.min(appointment.available, appointments[app_ix + 1].available)}
								<a
									href={`/contact?day=${appointment.time_range.day}&start=${
										Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset
									}&end=${
										Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) +
										offset +
										4
									}`}
									style="--offset: {offset}"
									aria-label="Inquire about {Time.fromQuarterHours(
										Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset
									)} - {Time.fromQuarterHours(
										Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) +
											offset +
											4
									)}
{num_weeks > 1 ? `Available ${available} of the next ${num_weeks} weeks` : ''}"
								/>
							{/if}
						{/each}
					</div>
				{/if}
			{/each}
		{:else}
			<div class="loading">Loading...</div>
			<div class="cradle">
				<div class="ball" />
				<div class="ball" />
				<div class="ball" />
				<div class="ball" />
				<div class="ball" />
			</div>
		{/if}
	</div>
	<div class="gridlines">
		{#each Array.from({ length: endHour - startHour }, (_, i) => i) as _}
			{#each Array.from({ length: 7 }, (_, i) => i) as _}
				<div />
			{/each}
		{/each}
	</div>
</div>

<style lang="scss">
	@import 'global';

	.calendar-legend {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin-bottom: 1em;
	}

	.legend--appointment {
		display: flex;
		padding: 0.3em;

		& {
			content: '';
			display: inline-block;
			width: 10ch;
			height: 1em;
			background: var(--inactive-background);
			outline: 1px solid black;
			--margin: 0.1em;
			margin: var(--margin) calc(2 * var(--margin));
			border-radius: 0.2em;
		}
	}

	.calendar-container {
		display: grid;
		grid-template-columns: min-content repeat(7, 1fr);
		grid-template-rows: min-content 1fr;
		--gridline-width: 1px;
		flex-grow: 1;
		min-height: 800px;

		.gridlines {
			grid-column: 2 / -1;
			grid-row: 2 / -1;
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			grid-template-rows: repeat(var(--num-rows), 1fr);
			gap: var(--gridline-width);

			& > div {
				/*outline: var(--gridline-width) dotted darkgrey;*/
				border-top: var(--gridline-width) dotted darkgrey;
				border-left: var(--gridline-width) dotted darkgrey;
				translate: calc(-1 * var(--gridline-width));
			}
		}
	}

	.days {
		display: grid;
		grid-auto-columns: minmax(0, 1fr);
		grid-auto-flow: column;
		grid-column: 2 / -1;
		grid-row: 1 / 2;

		gap: var(--gridline-width);

		& > div {
			/*outline: var(--gridline-width) solid grey;*/
			border-left: 1px dotted darkgrey;
			padding: 0.5em 0;
			text-align: center;
		}
	}

	.times {
		display: grid;
		grid-template-rows: repeat(calc(var(--num-rows) * 4), 1fr);
		grid-column: 1 / 2;
		grid-row: 2 / -1;
		gap: var(--gridline-width);

		& > div {
			grid-row: span 4;
			padding: min(1em, 1vw);
			padding-top: 0;
			/*outline: var(--gridline-width) solid grey;*/
			border-top: 1px dotted darkgrey;
		}
	}

	.appointments {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(calc(var(--num-rows) * 4), 1fr);
		grid-column: 2 / -1;
		grid-row: 2 / -1;

		&:has(.loading) {
			opacity: 0.5;
			grid-template-columns: 1fr min-content 1fr;
			grid-template-rows: calc(500% / 18) calc(100% / 18) calc(100% / 18);
			align-items: end;
		}

		.loading {
			height: min-content;
			font-size: 1.5em;
			color: grey;
			grid-column: 2/3;
			grid-row: 2/3;
			text-align: center;
		}
	}

	.appointment:not(.bookable):not(.booked) {
		display: none;
	}

	.bookable {
		--inactive-background: rgba(
			75,
			177,
			255,
			calc(
				0.8 * var(--available, var(--num-weeks)) * var(--available, var(--num-weeks)) /
					(var(--num-weeks) * var(--num-weeks)) + 0.2
			)
		);
		--hover-background: rgba(0, 0, 0, 0.3);
	}

	.appointment {
		outline: 1px solid lightgrey;
		--margin: 1px;
		margin: var(--margin) calc(6 * var(--margin));
		border-radius: 0.8em;
		display: flex;
		flex-direction: column;
		position: relative;
		background: var(--inactive-background);

		&.match-end {
			--bottom-radius: 0;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			margin-bottom: 0;
		}

		&.match-start {
			--top-radius: 0;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
			margin-top: 0;
		}

		&.show-times::after {
			content: attr(data-start-hour) ':' attr(data-start-minute) ' - ' attr(data-end-hour) ':'
				attr(data-end-minute);
			pointer-events: none;
			padding: 0.5em;
			position: absolute;
			top: 0;
			bottom: 0;
			overflow: hidden;
			width: calc(100% - 1.5em);
			min-width: min-content;
			box-sizing: border-box;
		}

		&.testing-time-width::after {
			width: min-content;
		}

		a {
			color: black;
			//flex-grow: 1;
			text-decoration: none;
			position: absolute;
			--whole-height: calc(100% + 2 * var(--margin));
			top: calc(var(--offset) * var(--whole-height) / var(--duration) - var(--margin));
			width: 100%;
			height: calc(var(--whole-height) / var(--duration) * 4);
			z-index: 10;

			&:first-child,
			&:last-child {
				height: calc(var(--whole-height) / var(--duration) * 4 - var(--margin));
			}

			&:first-child:last-child {
				height: calc(var(--whole-height) / var(--duration) * 4 - 2 * var(--margin));
			}

			&:first-child {
				top: calc(var(--offset) * var(--whole-height) / var(--duration));
				border-top-left-radius: var(--top-radius, 0.8em);
				border-top-right-radius: var(--top-radius, 0.8em);
			}

			&:last-child {
				border-bottom-left-radius: var(--bottom-radius, 0.8em);
				border-bottom-right-radius: var(--bottom-radius, 0.8em);
			}

			&:hover {
				background: var(--hover-background);

				/*
                & + a,
                & + a + a,
                & + a + a + a {
                    background-color: #00cc00;
                }
                */

				&::before {
					position: absolute;
					//top: calc(var(--offset) * var(--whole-height) / var(--duration) - var(--margin));
					top: 0;
					left: calc(100% + 0.1em);
					content: attr(aria-label);
					white-space: pre;
					width: max-content;
					background: white;
					box-shadow: 5px 5px 8px rgba(0, 0, 0, 0.2);
					border-radius: 0.5em;
					border-top-left-radius: 0;
					padding: 0.2em 0.5em;
					z-index: 8;
					pointer-events: none;
				}
			}
		}
	}

	.booked {
		--inactive-background: rgb(242, 104, 104);
		--hover-background: rgb(155, 28, 28);
		--repeat-length: 30px;
		--stripe-width: 10px;
		background: repeating-linear-gradient(
			25deg,
			var(--inactive-background),
			var(--inactive-background) calc(var(--repeat-length) - var(--stripe-width)),
			var(--hover-background) calc(var(--repeat-length) - var(--stripe-width)),
			var(--hover-background) var(--repeat-length)
		);
		color: white;
		z-index: 5;

		a {
			pointer-events: none;
		}
	}

	.cradle {
		width: 200px;
		height: 40px;
		grid-column: 2/3;
		grid-row: 3/4;
		position: relative;
		scale: 0.8;
	}
	.cradle:before {
		content: '';
		display: block;
		position: absolute;
		width: 200px;
		height: 6px;
		top: -3px;
		left: 0;
		border-radius: 3px;
		background: #bdc3c7;
	}
	.cradle .ball {
		position: relative;
		float: left;
		width: 40px;
		height: 40px;
		background: #000;
		border-radius: 50%;
		-webkit-transform-origin: 50% -100px;
		transform-origin: 50% -100px;
		top: 100px;
	}
	.cradle .ball:before {
		content: '';
		display: block;
		position: absolute;
		height: 100px;
		width: 1px;
		top: -100px;
		left: 19px;
		background: #bdc3c7;
	}
	.cradle .ball:nth-child(1) {
		-webkit-animation: ball-1 0.8s ease-in infinite alternate;
		animation: ball-1 0.8s ease-in infinite alternate;
	}
	.cradle .ball:nth-child(5) {
		-webkit-animation: ball-5 0.8s ease-out 0.8s infinite alternate;
		animation: ball-5 0.8s ease-out infinite alternate;
	}

	@keyframes ball-1 {
		0% {
			-webkit-transform: rotate(30deg);
			transform: rotate(30deg);
		}
		50%,
		100% {
			-webkit-transform: rotate(0);
			transform: rotate(0);
		}
	}
	@keyframes ball-5 {
		0%,
		50% {
			-webkit-transform: rotate(0);
			transform: rotate(0);
		}
		100% {
			-webkit-transform: rotate(-30deg);
			transform: rotate(-30deg);
		}
	}
</style>
