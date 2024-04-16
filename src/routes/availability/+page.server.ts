import type { PageServerLoad } from './$types';
import { PlatformWrapper } from '$lib/platform_wrapper';

export const load = (async ({params, platform}) => {
    const platform_wrapper = new PlatformWrapper(platform).platform;
    console.log(`availability +page.server.ts platform_wrapper: ${JSON.stringify(platform_wrapper)}`);
    console.log(`availability +page.server.ts platform_wrapper.env: ${JSON.stringify(platform_wrapper.env)}`);
    console.log(`availability +page.server.ts platform_wrapper.env?.BOOKABLE_TIMES: ${JSON.stringify(platform_wrapper.env?.BOOKABLE_TIMES)}`);
    console.log(`availability +page.server.ts platform_wrapper.env?.BOOKABLE_TIMES.list(): ${JSON.stringify(platform_wrapper.env?.BOOKABLE_TIMES.list())}`);
	const appointments: Array<string> = (platform_wrapper.env?.BOOKABLE_TIMES.list());

	return {
		appointments: appointments
	}
}) satisfies PageServerLoad;
