<script lang="ts">
	import { Day, Time, TimeRange } from '$lib/types';
	import { AppointmentState, type Appointment } from '$lib/types';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { PageData } from './$types';

    type KVListType = {
      keys: {
        name: string;
        expiration: number;
        metadata: Record<string, string>;
      }[];
      list_complete: boolean;
      cursor: string;
    };

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
