// import { ORIGIN } from '$env/static/private';
import { getPlatform, saveLog, saveTimedLog } from '$lib/server/requestContext';
import { type DurationLike, DateTime, Duration } from 'luxon';

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

		let logs = [];
		const startTime = DateTime.now();
		logs.push(`cache label: ${cache_label}`);

		const platform = getPlatform();
		const cache = platform?.env?.FUNCTION_CACHE;

		const raw_res = await cache?.get(cache_label);
		const result = JSON.parse(raw_res || 'null');
		const expired = result && result.expires && DateTime.now() > DateTime.fromISO(result.expires);

		if (result && !expired) {
			logs.push('cache hit');
			if (deserialiser) {
				saveTimedLog(startTime, ...logs);
				return deserialiser(result.value);
			} else {
				saveTimedLog(startTime, ...logs);
				return result.value;
			}
		} else if (expired) {
			logs.push('cache expired');
		} else {
			logs.push('cache miss');
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
			}),
			{
				expirationTtl: expires ? Duration.fromDurationLike(expires).as('seconds') : undefined
			}
		);

		saveTimedLog(startTime, ...logs);
		return function_result;
	}) as (...args: Parameters<F>) => ReturnType<F>;

	return result;
}
