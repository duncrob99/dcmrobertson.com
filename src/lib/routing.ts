import { DateTime, Duration } from 'luxon';
import { cache_function } from '$lib/server/cache.server';
import { GOOGLE_API } from '$env/static/private';
import { saveLog } from '$lib/server/requestContext';

let total_requests = 0;

export enum TimeType {
	Departure,
	Arrival
}

type Address = { address: string };
type PlaceID = { placeId: string };
type Latlon = { lat: number; lng: number };
type Location = Address | PlaceID | Latlon;

function parseLocation(location: string): Location {
	if (location.startsWith('place_id:')) {
		return { placeId: location.slice('place_id:'.length) };
	} else if (location.startsWith('lat:')) {
		const [lat, lng] = location.slice('lat:'.length).split(',');
		return { lat: parseFloat(lat), lng: parseFloat(lng) };
	} else {
		return { address: location };
	}
}

export const getSimpleTravelTime = cache_function(
	'getSimpleTravelTime',
	async (from: string, to: string, departureTime?: DateTime): Promise<Duration> => {
		const normalizedDepartureTime = departureTime?.plus({
			weeks: -1 * Math.ceil(departureTime.diffNow('weeks').weeks) + 52
		});

		// Check if time is already normalised to the current week one year in the future
		if (departureTime && normalizedDepartureTime && +departureTime !== +normalizedDepartureTime) {
			return getSimpleTravelTime(from, to, normalizedDepartureTime);
		}

		const res = await (
			await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
				method: 'POST',
				body: JSON.stringify({
					origin: parseLocation(from),
					destination: parseLocation(to),
					travelMode: 'DRIVE',
					routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
					trafficModel: 'PESSIMISTIC',
					departureTime: normalizedDepartureTime,
					regionCode: 'AU'
				}),
				headers: {
					'Content-Type': 'application/json',
					'X-Goog-Api-Key': GOOGLE_API,
					'X-Goog-FieldMask': 'routes.duration'
				}
			})
		).json();

		total_requests++;
		saveLog(
			'Total Routes Requests',
			total_requests,
			`${from} -> ${to} at ${normalizedDepartureTime}`
		);

		try {
			return Duration.fromObject({ seconds: parseInt(res.routes[0].duration) });
		} catch (e) {
			saveLog('Error parsing google routes api return value');
			saveLog(JSON.stringify(res, null, 2));
			return Duration.fromObject({ seconds: 0 });
		}
	},
	{ days: 1 },
	Duration.fromISO
);

export const getTravelTime = cache_function(
	'getTravelTime',
	async (from: string, to: string, time?: DateTime, timeType?: TimeType): Promise<Duration> => {
		if (!time || timeType === TimeType.Departure) {
			return getSimpleTravelTime(from, to, time);
		}

		const arrivalTime = time;
		let departureTime = time;
		let travelTime = await getSimpleTravelTime(from, to, departureTime);
		const error = () => +departureTime.plus(travelTime) - +arrivalTime;
		let iters = 1;
		const logs = [];

		while (iters < 10 && (error() > 10 * 1000 || error() < -60 * 1000)) {
			// console.log('iter', iters, departureTime, arrivalTime, travelTime, error());
			logs.push({
				iter: iters,
				departureTime,
				arrivalTime,
				travelTime: travelTime.rescale().toHuman(),
				error: error()
			});
			departureTime = arrivalTime.minus(travelTime);
			travelTime = await getSimpleTravelTime(from, to, departureTime);
			iters++;
		}

		logs.push({
			iter: iters,
			departureTime,
			arrivalTime,
			travelTime: travelTime.rescale().toHuman(),
			error: error()
		});
		saveLog(`${from} -> ${to}`, JSON.stringify(logs, null, 2));

		return travelTime;
	},
	{ weeks: 2 },
	Duration.fromISO
);
