import { PlatformWrapper } from '$lib/platform_wrapper';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ platform, url }: RequestEvent) => {
	const platform_wrapper = new PlatformWrapper(platform).platform;
	const cache = platform_wrapper?.env?.FUNCTION_CACHE;

	const labelsParams = url.searchParams.getAll('label');
	const labels = labelsParams.length > 0 ? labelsParams : [''];
	console.log(`Purging cache for labels: ${JSON.stringify(labels)}`);

	for (const label of labels) {
		while (true) {
			const key_list = await cache?.list({ prefix: `{"label":"${label}` });
			const keys = key_list?.keys;

			console.log(`Purging ${keys?.length ?? 0} keys for label ${label}`);
			const promises = keys?.map(async (key) => {
				const val = cache?.delete(key.name);
				return val;
			});

			if (promises) {
				await Promise.all(promises);
			}
			console.log(`Finished purging ${keys?.length ?? 0} keys for label ${label}`);

			if (key_list?.list_complete) break;

			console.log(`Waiting to purge next batch of keys for label ${label}`);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	return new Response('Cache purged', { status: 200 });
};
