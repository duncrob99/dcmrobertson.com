<script lang="ts">
	import { goto } from "$app/navigation";
	import type { TimeRange } from "$lib/types";

	export let bookableTimes: TimeRange[];
</script>

<div class="calendar-container">
	<div class="days">
		<div>Sunday</div>
		<div>Monday</div>
		<div>Tuesday</div>
		<div>Wednesday</div>
		<div>Thursday</div>
		<div>Friday</div>
		<div>Saturday</div>
	</div>
	<div class="times">
		{#each Array.from({ length: 24 }, (_, i) => i) as hour}
			<div>{(hour).toString().padStart(2, "0")}:00</div>
		{/each}
	</div>
	<div class="bookable-times">
		{#each bookableTimes as time}
			<button
				class="bookable-time"
				on:click={() => goto(`/book?day=${time.day}&start=${time.start.asQuarterHours()}&end=${time.end.asQuarterHours()}`)}
				style="grid-row: {time.start.asQuarterHours() + 1} / {time.end.asQuarterHours() + 1}; grid-column: {time.day + 1} / {time.day + 2}">
					Book {time.start.hour}:{time.start.minute.toString().padStart(2, "0")}
			</button>
		{/each}
	</div>
	<div class="gridlines">
		{#each Array.from({ length: 24 }, (_, i) => i) as hour}
			{#each Array.from({ length: 7 }, (_, i) => i) as quarter}
				<div></div>
			{/each}
		{/each}
	</div>
</div>

<style lang="scss">
	.calendar-container {
		display: grid;
		grid-template-columns: min-content repeat(7, 1fr);
		grid-template-rows: min-content 1fr;
		--gridline-width: 1px;

		.gridlines {
			grid-column: 2 / -1;
			grid-row: 2 / -1;
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			grid-template-rows: repeat(24, 1fr);
			gap: var(--gridline-width);
			
			& > div {
				outline: var(--gridline-width) solid grey;
			}
		}
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-column: 2 / -1;
		grid-row: 1 / 2;

		gap: var(--gridline-width);

		& > div {
			outline: var(--gridline-width) solid grey;
		}
	}

	.times {
		display: grid;
		grid-template-rows: repeat(96, 1fr);
		grid-column: 1 / 2;
		grid-row: 2 / -1;
		gap: var(--gridline-width);

		& > div {
			grid-row: span 4;
			outline: var(--gridline-width) solid grey;
		}
	}

	.bookable-times {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(96, 1fr);
		grid-column: 2 / -1;
		grid-row: 2 / -1;
	}

	.bookable-time {
		background-color: #00ff00;
		cursor: pointer;
		z-index: 10;
		outline: 1px solid black;
	}
</style>