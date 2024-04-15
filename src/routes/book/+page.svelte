<script lang="ts">
	import type { PageData } from './$types';
	import { TimeRange, Time } from '$lib/types';

	export let data: PageData;
</script>

<p>Request booking for {data.day} from {data.start.hour}:{data.start.minute} to {data.end.hour}:{data.end.minute}</p>

<style lang="scss">

</style>