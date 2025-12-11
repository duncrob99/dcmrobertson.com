import { getAvailability } from "$lib/gcal";
import { PlatformWrapper, type KVListType, type KVStore } from "$lib/platform_wrapper";
import { json } from "@sveltejs/kit";
import { DateTime } from "luxon";
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const platform_wrapper = new PlatformWrapper(platform).platform;
	const cache = platform_wrapper.env?.FUNCTION_CACHE;

	const startDateString = url.searchParams.get("start-date");
	const startDateOffsetString = url.searchParams.get("start-date-offset") ?? "0";

	const startDate = startDateString ? DateTime.fromISO(startDateString, {zone: "Australia/Melbourne"}) : DateTime.now().endOf("day").plus({weeks: parseInt(startDateOffsetString)});

	const numWeeksString = url.searchParams.get("num-weeks") ?? "10";
	const numWeeks = parseInt(numWeeksString);

	const cacheName = `availability:::${startDate?.toISO()}:::${numWeeks}`;
	const cacheValueString = await cache?.get(cacheName);
	const cacheValue = cacheValueString ? JSON.parse(cacheValueString) : null;

	if (cacheValue && DateTime.fromISO(cacheValue.expires) > DateTime.now()) {
		return json({ availability: cacheValue.value, ok: true, cacheHit: true, cacheExpiry: cacheValue.expires });
	} else {
		const availability = await getAvailability(startDate, numWeeks);
		const cacheList = await cache?.list();
		await cache?.put(cacheName, JSON.stringify({value: availability, expires: DateTime.now().plus({ minutes: 30 })}));

		return json({ availability, ok: true, cacheHit: false, cacheList, cacheListAfter: await cache?.list() });
	}
};
