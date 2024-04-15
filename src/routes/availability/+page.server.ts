import type { PageServerLoad } from './$types';
import { PlatformWrapper } from '$lib/platform_wrapper';

export const load = (async ({params, platform}) => {
	const appointments: Array<string> = (await new PlatformWrapper(platform).platform.env?.BOOKABLE_TIMES.list());

	return {
		appointments: appointments
	}
}) satisfies PageServerLoad;