// import { ORIGIN } from '$env/static/private';
import { getPlatform } from '$lib/server/requestContext';
import { type DurationLike, DateTime } from 'luxon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cache_function<F extends (...args: any[]) => Promise<any>>(
	label: string,
	fn: F,
	expires?: DurationLike,
	deserialiser?: (value: any) => Awaited<ReturnType<F>>
): (...args: Parameters<F>) => ReturnType<F> {
	const result = (async (...args: Parameters<F>) => {
		const cache_label = JSON.stringify({
			label,
			args
		});
		console.log('cache label: ', cache_label);

		const platform = getPlatform();
		const cache = platform?.env?.FUNCTION_CACHE;

		const raw_res = await cache?.get(cache_label);
		const result = JSON.parse(raw_res || 'null');
		const expired = result && result.expires && DateTime.now() > DateTime.fromISO(result.expires);

		if (result && !expired) {
			console.log('cache hit');
			if (deserialiser) {
				return deserialiser(result.value);
			} else {
				return result.value;
			}
		} else if (expired) {
			console.log('cache expired');
		} else {
			console.log('cache miss');
		}
		/*
		const searchParams = new URLSearchParams({
			label: cache_label
		}).toString();
		const cache_url = `${ORIGIN}/api/cache?${searchParams}`;
		const response = await fetch(cache_url);
		const cache_resp = await response.json();

		if (cache_resp.success) {
			if (deserialiser) {
				return deserialiser(cache_resp.result.value);
			} else {
				return cache_resp.result.value;
			}
		}
		*/

		const function_result = await fn(...args);

		/*
		console.log('posting', cache_label);
		const body = JSON.stringify({
			label: cache_label,
			value: function_result,
			expires
		});
		console.log('Cache payload size:', body.length, 'bytes');

		fetch(`${ORIGIN}/api/cache`, {
			method: 'POST',
			body,
			headers: {
				'Content-Type': 'application/json'
			}
		}).catch((error) => {
			console.error('Error posting to cache:', error);
		});
		*/

		await cache?.put(
			cache_label,
			JSON.stringify({
				value: function_result,
				expires: expires ? DateTime.now().plus(expires).toISO() : null
			})
		);

		return function_result;
	}) as (...args: Parameters<F>) => ReturnType<F>;

	return result;
}
