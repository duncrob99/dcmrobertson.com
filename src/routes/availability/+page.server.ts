import type { PageServerLoad } from './$types';
import { PlatformWrapper, type KVListType } from '$lib/platform_wrapper';

export const load = (async ({params, platform}) => {
    const platform_wrapper = new PlatformWrapper(platform).platform;
	const appointments: KVListType = (platform_wrapper.env?.BOOKABLE_TIMES.list());

	return {
		appointments: appointments
	}
}) satisfies PageServerLoad;
