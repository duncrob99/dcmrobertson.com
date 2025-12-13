import { getAvailability } from "$lib/gcal";
import { PlatformWrapper, type KVListType, type KVStore } from "$lib/platform_wrapper";
import { cache_function } from "$lib/server/cache.server";
import { json } from "@sveltejs/kit";
import { DateTime } from "luxon";
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const startDateString = url.searchParams.get("start-date");
	const startDateOffsetString = url.searchParams.get("start-date-offset") ?? "0";

	const startDate = startDateString ? DateTime.fromISO(startDateString, {zone: "Australia/Melbourne"}) : DateTime.now().setZone("Australia/Melbourne").startOf("week").plus({weeks: parseInt(startDateOffsetString), days: -1});

	const numWeeksString = url.searchParams.get("num-weeks") ?? "10";
	const numWeeks = parseInt(numWeeksString);

	return json({availability: await getAvailability(startDate, numWeeks)});
};
