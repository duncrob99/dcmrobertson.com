<script lang="ts">
	import { Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { PageData } from './$types';
    import type { KVListType } from '$lib/platform_wrapper';

	export let data: PageData;

    const appointments_data: KVListType = data.appointments;
	let appointments = appointments_data.keys.map(val => {
        const time = val.name;
		return {
			time_range: TimeRange.fromJSON(time),
			state: AppointmentState.Available
		} as Appointment
	});
</script>

<Calendar appointments={appointments} />
