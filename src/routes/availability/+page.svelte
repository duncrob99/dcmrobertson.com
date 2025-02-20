<script lang="ts">
	import { Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import ScrollabilityIndicator from '$lib/components/ScrollabilityIndicator.svelte';
	import type { PageData } from './$types';
	import type { KVListType } from '$lib/platform_wrapper';

	export let data: PageData;

	let calendarEl: HTMLDivElement;

	const appointments_data: KVListType = data.appointments;
	/*
	let appointments = appointments_data.keys.map(val => {
		const time = val.name;
		return {
			time_range: TimeRange.fromJSON(time),
			state: AppointmentState.Available
		} as Appointment
	});
	*/
	let appointments = appointments_data.keys.map(val => {
		const raw_appointment = JSON.parse(val.name) as Appointment;
		const time_range = TimeRange.fromJSON(JSON.stringify(raw_appointment.time_range));
		const state = raw_appointment.state;
		return {
			time_range,
			state
		};
	});
</script>

<svelte:head>
	<title>Availability</title>
	<meta name="description" content="See my availability to choose a convenient time for lessons." />
</svelte:head>

<p>You can see my availability here and choose a suitable time for you. Please note that these times aren't guaranteed to be accurate, so please reach out to me to confirm availability.</p>
<Calendar appointments={appointments} startHour={9} endHour={21} bind:calendarEl />

<ScrollabilityIndicator scrollMarker={calendarEl} text={"Scroll to view more available times"} />
