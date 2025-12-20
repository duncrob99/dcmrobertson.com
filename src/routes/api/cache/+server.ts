import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PlatformWrapper } from '$lib/platform_wrapper';
import { DateTime } from 'luxon';

export const POST: RequestHandler = async ({ request, platform }) => {
	const platform_wrapper = new PlatformWrapper(platform).platform;
	const cache = platform_wrapper?.env?.FUNCTION_CACHE;

	const { label, value, expires } = await request.json();
	if (!label || !value) {
		return json({success: false, error: "Require both label and value"});
	}

	cache?.put(label, JSON.stringify({
		value,
		expires: expires ? DateTime.now().plus({ seconds: expires }).toISO() : null,
	}));

	return json({success: true, result: await cache?.get(label)});
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const platform_wrapper = new PlatformWrapper(platform).platform;
	const cache = platform_wrapper?.env?.FUNCTION_CACHE;

	const label = url.searchParams.get("label");
	if (!label) {
		return json({success: true, values: await cache?.list()});
	}

	const raw_res = await cache?.get(label);
	if (!raw_res) {
		return json({success: false, error: "No result for label"});
	}

	const result = JSON.parse(raw_res);
	if (result.expires && DateTime.fromISO(result.expires) < DateTime.now()) {
		return json({success: false, error: "Cache result expired"});
	}

	return json({success: true, result});
};
