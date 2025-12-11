<script lang="ts">
	import { type Availability, Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import ScrollabilityIndicator from '$lib/components/ScrollabilityIndicator.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let calendarEl: HTMLDivElement;

	/*
	const appointments_data: KVListType = data.appointments;
	let appointments = appointments_data.keys.map(val => {
		const time = val.name;
		return {
			time_range: TimeRange.fromJSON(time),
			state: AppointmentState.Available
		} as Appointment
	});
	*/
	/*
	let appointments = appointments_data.keys.map(val => {
		const raw_appointment = JSON.parse(val.name) as Appointment;
		const time_range = TimeRange.fromJSON(JSON.stringify(raw_appointment.time_range));
		const state = raw_appointment.state;
		return {
			time_range,
			state
		};
	});
	*/
	let timeRangeParams: string = "0 10";
	$: num_weeks = timeRangeParams.split(" ")[1];
	let appointments = JSON.parse(data.calendar).map((json: any) => {
		return {
			time_range: TimeRange.fromJSON(JSON.stringify(json.time_range)),
			//state: json.state,
			booked: json.booked,
			available: json.available,
		}
	});

	let cached_appointments: {[key: string]: Availability[]} = {};

	async function updateAppointments() {
		const params = new URLSearchParams({"start-date-offset": timeRangeParams.split(" ")[0], "num-weeks": timeRangeParams.split(" ")[1]});
		const cached = cached_appointments[params.toString()];
		if (cached) {
			appointments = cached_appointments[params.toString()];
			return;
		}

		appointments = [];

		console.log("Fetching: ", `/api/availability?${params.toString()}`);

		appointments = await fetch(`/api/availability?${params.toString()}`)
		.then(resp => resp.json())
		.then(json => {
			console.log("json: ", json);
			return json.availability.map(avail => {
			return {
				time_range: TimeRange.fromJSON(JSON.stringify(avail.time_range)),
				//state: avail.state,
				booked: avail.booked,
				available: avail.available,
			}
		})});

		cached_appointments[params.toString()] = appointments;
	}
</script>

<svelte:head>
	<title>Availability</title>
	<meta name="description" content="See my availability to choose a convenient time for lessons." />
</svelte:head>

<p>You can see my availability here and choose a suitable time for you. Please note that these times aren't guaranteed to be accurate, so please reach out to me to confirm availability.</p>
<select id="time-range-select" bind:value={timeRangeParams} on:change={updateAppointments}>
	<option value="0 10">Combined next 10 weeks</option>
	<option value="0 1">This week</option>
	<option value="1 1">Next week</option>
</select>
<Calendar appointments={appointments} startHour={6} endHour={24} bind:num_weeks bind:calendarEl />

<ScrollabilityIndicator scrollMarker={calendarEl} text={"Scroll to view more available times"} />

<style lang="scss">
	#time-range-select {
	width: max-content;
	padding: 0.3rem 0.8rem;
	background: rgba(255, 255, 255, 0.4);
	border: none;
	border-radius: 10px;
}
</style>

