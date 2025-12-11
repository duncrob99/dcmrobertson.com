import type { PageServerLoad } from './$types';
import { PlatformWrapper, type KVListType } from '$lib/platform_wrapper';
import { getAvailability } from '$lib/gcal';

export const load = (async ({params, platform, fetch}) => {
	/*
	const platform_wrapper = new PlatformWrapper(platform).platform;
	const appointments = await (platform_wrapper.env?.BOOKABLE_TIMES.list());
	*/

	const cal = await (await fetch("/api/availability")).json();

	return {
		//appointments: appointments,
		calendar: JSON.stringify(cal.availability),
	}
}) satisfies PageServerLoad;
