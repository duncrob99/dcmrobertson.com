<script lang="ts">
	import { type Availability, TimeRange } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import ScrollabilityIndicator from '$lib/components/ScrollabilityIndicator.svelte';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';

	let calendarEl: HTMLDivElement;

	let timeRangeParams = '0 1';
	$: num_weeks = parseInt(timeRangeParams.split(' ')[1]);
	let appointments: Availability[] = [];

	let cached_appointments: { [key: string]: Availability[] } = {};
	cached_appointments[
		new URLSearchParams({
			'start-date-offset': timeRangeParams.split(' ')[0],
			'num-weeks': timeRangeParams.split(' ')[1]
		}).toString()
	] = appointments;

	let customInput: HTMLInputElement | undefined;
	let selectLocation = '';
	let customLocation = '';
	$: location = selectLocation === 'Custom' ? customLocation : selectLocation;
	$: if (selectLocation === 'Custom') {
		(async () => {
			await tick();
			customInput?.focus();
		})();
	}

	onMount(async () => {
		updateAppointments();
	});

	let updateTimer: ReturnType<typeof setTimeout>;
	async function debouncedUpdateAppointments() {
		clearTimeout(updateTimer);
		updateTimer = setTimeout(updateAppointments, 500);
	}

	async function updateAppointments() {
		await tick();
		const params = new URLSearchParams({
			'start-date-offset': timeRangeParams.split(' ')[0],
			'num-weeks': timeRangeParams.split(' ')[1],
			location
		});
		console.log('params: ', params.toString());
		const cached = cached_appointments[params.toString()];
		if (cached) {
			appointments = cached_appointments[params.toString()];
			return;
		}

		appointments = [];

		console.log('Fetching: ', `/api/availability?${params.toString()}`);

		appointments = await fetch(`/api/availability?${params.toString()}`)
			.then((resp) => resp.json())
			.then((json) => {
				console.log('json: ', json);
				return json.availability.map((avail: { [key: string]: string }) => {
					return {
						time_range: TimeRange.fromJSON(JSON.stringify(avail.time_range)),
						//state: avail.state,
						booked: avail.booked,
						available: avail.available
					};
				});
			});

		cached_appointments[params.toString()] = appointments;
	}

	async function detectLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				const formattedAddress = await (
					await fetch(`/api/geocoding?latlng=${latitude},${longitude}`)
				).json();

				customLocation = formattedAddress;
				updateAppointments();
			},
			(error) => {
				alert(`Error getting location: ${error.message}`);
			}
		);
	}
</script>

<svelte:head>
	<title>Availability</title>
	<meta name="description" content="See my availability to choose a convenient time for lessons." />
</svelte:head>

<p>
	You can see my availability here and choose a suitable time for you. Please note that these times
	aren't guaranteed to be accurate, so please reach out to me to confirm availability.
</p>
<div class="options">
	<div class="row">
		<select id="time-range-select" bind:value={timeRangeParams} on:change={updateAppointments}>
			<option value="0 10">Combined next 10 weeks</option>
			<option value="0 1">This week</option>
			<option value="1 1">Next week</option>
		</select>
		<select id="location-select" bind:value={selectLocation} on:change={updateAppointments}>
			<option value=""> Select a location </option>
			<option value="647J+5H Doncaster, Victoria"> Doncaster Library </option>
			<option value="53PP+H6 Balwyn, Victoria"> Balwyn Library </option>
			<option value="62C9+XJ Fairfield, Victoria"> Fairfield Library </option>
			<option value="Custom"> Custom (e.g. your house) </option>
		</select>
	</div>
	{#if selectLocation === 'Custom'}
		<div class="row" transition:fade>
			<input
				hidden={selectLocation !== 'Custom'}
				type="text"
				placeholder="Enter custom location"
				bind:value={customLocation}
				on:change={debouncedUpdateAppointments}
			/>
			<button on:click={detectLocation} id="detect-location"> Use current location </button>
		</div>
	{/if}
</div>
<Calendar {appointments} startHour={6} endHour={24} bind:num_weeks bind:calendarEl />

<ScrollabilityIndicator scrollMarker={calendarEl} text={'Scroll to view more available times'} />

<style lang="scss">
	.options {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	select {
		width: max-content;
		padding: 0.3rem 0.8rem;
		background: rgba(255, 255, 255, 0.4);
		border: none;
		border-radius: 10px;
		margin: 0.5rem;
	}

	#location-select[value='Custom'] {
		background: red !important;
	}

	input,
	button {
		width: max-content;
		padding: 0.3rem 0.8rem;
		background: rgba(255, 255, 255, 0.4);
		border: none;
		border-radius: 10px;
		margin: 0.5rem;

		&:focus {
			outline: none;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
		}
	}
</style>
