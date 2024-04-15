<script lang="ts">
	import { Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let appointments = data.appointments.map(time => {
		return {
			time_range: TimeRange.fromJSON(time),
			state: AppointmentState.Available
		} as Appointment
	});
</script>

<Calendar appointments={appointments} />
