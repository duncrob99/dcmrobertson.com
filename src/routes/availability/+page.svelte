<script lang="ts">
	import { Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

    console.log(`availability/+page.svelte data: ${data}`);
    console.log(`availability/+page.svelte data.appointments: ${data.appointments}`);

    console.log(`availability/+page.svelte data: ${JSON.stringify(data)}`);
    console.log(`availability/+page.svelte data.appointments: ${JSON.stringify(data.appointments)}`);

	let appointments = data.appointments.map(time => {
		return {
			time_range: TimeRange.fromJSON(time),
			state: AppointmentState.Available
		} as Appointment
	});
</script>

<Calendar appointments={appointments} />
