import { Day, Time, TimeRange } from '$lib/types';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
	const params = url.searchParams;

    if (!params.has('day') || !params.has('start') || !params.has('end')) {
        return;
    }

	let timerange = new TimeRange(
		Day[params.get('day') as keyof typeof Day],
		Time.fromQuarterHours(parseInt(params.get('start') as string)),
		Time.fromQuarterHours(parseInt(params.get('end') as string))
	);

	return {
        timerange
    };
}) as PageLoad;
