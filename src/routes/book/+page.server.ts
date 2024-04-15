import { Day, Time, TimeRange } from '$lib/types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ url }) => {
	const params = url.searchParams;
	let timerange = new TimeRange(
		Day[params.get('day') as keyof typeof Day],
		Time.fromQuarterHours(parseInt(params.get('start') as string)),
		Time.fromQuarterHours(parseInt(params.get('end') as string))
	).toJSON();
	return timerange;
})