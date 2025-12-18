//import { calendar } from '@googleapis/calendar';
//import { google } from 'googleapis';
//const {google} = require('googleapis');
//const calendar = google.calendar('v3');

import { DateTime, Duration } from 'luxon';
import ICAL from 'ical.js';
import Interval from 'intervaljs';
import { TimeRange, Time, AppointmentState, type Availability } from '$lib/types';
import type { Appointment } from '$lib/types';
import { BUSY_CALENDARS, BOOKED_CALENDAR } from '$env/static/private';
import { cache_function } from '$lib/server/cache.server';
import { getTravelTime, TimeType } from '$lib/routing';

const toDateTime = (icaltime: ICAL.Time): DateTime =>
	DateTime.fromISO(icaltime?.toString(), { zone: 'Australia/Melbourne' });
// TODO: Consider non-AEST events

const busy_calendars = BUSY_CALENDARS.split(';');
const tutoring_calendar = BOOKED_CALENDAR;

enum EventType {
	Busy,
	Tutoring,
	Travel
}

type Event = {
	title: string | undefined;
	start: DateTime;
	end: DateTime;
	location: string | undefined;
	type: EventType;
};

async function getEvents(cal: string, rangeStart: DateTime, rangeEnd: DateTime): Promise<Event[]> {
	//const icals = await Promise.all(cals.map(async cal => await (await fetch(cal)).text()));
	//const jcals = icals.map(ICAL.parse);
	console.log('events from: ', cal);
	const ical = await (await fetch(cal)).text();
	const jcal = ICAL.parse(ical);
	const events = new ICAL.Component(jcal)
		.getAllSubcomponents('vevent')
		.map((comp) => new ICAL.Event(comp));

	function summariseEvent(ev: ICAL.Event, start?: DateTime) {
		const transparent = new ICAL.Component(ICAL.parse(ev.toString())).getFirstPropertyValue(
			'transp'
		) as string;
		let busy = null;

		switch (transparent) {
			case 'OPAQUE':
				busy = true;
				break;
			case 'TRANSPARENT':
				busy = false;
				break;
		}

		return {
			title: ev.summary,
			start: start ?? toDateTime(ev.startDate),
			end: start?.plus(Duration.fromISO(ev.duration.toString())) ?? toDateTime(ev.endDate),
			location: ev.location,
			busy,
			type: cal === tutoring_calendar ? EventType.Tutoring : EventType.Busy
		};
	}

	const dets = events
		.map((ev) => {
			const iterator = ev.iterator();
			if (!ev.isRecurring()) {
				if (!(toDateTime(ev.startDate) < rangeEnd && toDateTime(ev.endDate) > rangeStart))
					return [];
				return [summariseEvent(ev)];
			}
			//console.log(ev.summary, ev.isRecurring());

			//let next = iterator.next()
			//console.log(DateTime.fromISO(next.toString()));
			let occurences = [];
			for (
				let start = toDateTime(iterator.next());
				start && start < rangeEnd;
				start = toDateTime(iterator.next())
			) {
				const end = start.plus(Duration.fromISO(ev.duration.toString()));
				if (end < rangeStart) {
					continue;
				}
				// Do something with the date
				//console.log("duration: ", Duration.fromISO(ev.duration.toString()));
				if (!(start < rangeEnd && end > rangeStart)) continue;
				//console.log(ev.summary, start.toISO());

				occurences.push(summariseEvent(ev, start));
			}
			return occurences;
		})
		.filter((a) => a.length > 0)
		.flat()
		.filter((ev) => ev.busy)
		.map(({ busy, ...ev }) => ev);

	return dets;
}

async function getCalendarEvents(rangeStart: DateTime, rangeEnd: DateTime): Promise<Event[]> {
	return (
		await Promise.all(
			busy_calendars.concat([tutoring_calendar]).map((cal) => getEvents(cal, rangeStart, rangeEnd))
		)
	).flat();
}

type LatLon = [number, number];

async function getLocation(loc: string): Promise<LatLon> {
	const searchParams = new URLSearchParams({
		api_key:
			'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNmMGY5Njc3MDU0YzQ1ZTJhMDE3N2E1ZDJjMjliZGY0IiwiaCI6Im11cm11cjY0In0=',
		text: loc,
		'boundary.country': 'AU',
		size: '1'
	});
	const url = `https://api.openrouteservice.org/geocode/search?${searchParams.toString()}`;
	const resp = await fetch(url);
	const body = await resp.json();
	const bbox = body.bbox;
	const centre: LatLon = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
	return centre;
}

async function getMatrix(locations: { name: string; latlon: LatLon }[], center: LatLon) {
	//const Matrix = new Openrouteservice.Matrix({ api_key: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNmMGY5Njc3MDU0YzQ1ZTJhMDE3N2E1ZDJjMjliZGY0IiwiaCI6Im11cm11cjY0In0=" });

	console.log(locations.map((loc) => loc.latlon).concat([center]));
	const body = JSON.stringify({
		locations: locations.map((loc) => loc.latlon).concat([center]),
		sources: [locations.length]
	});
	console.log(body);
	const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
		method: 'POST',
		body,
		headers: {
			Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
			Authorization:
				'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNmMGY5Njc3MDU0YzQ1ZTJhMDE3N2E1ZDJjMjliZGY0IiwiaCI6Im11cm11cjY0In0=',
			'Content-Type': 'application/json; charset=utf-8'
		}
	});
	const json = await response.json();
	const duration_values = json.durations[0].map((dur: number) =>
		Duration.fromObject({ seconds: dur })
	);
	const durations = duration_values.map((val: Duration, i: number) => {
		return { ...locations[i], timeFromCenter: val.rescale().toHuman({ showZeros: false }) };
	});
	console.log('durations: ', durations);

	/*
		 try {
		 console.log("getting matrix");
		 let response = await Matrix.calculate({
locations: locations.map(loc => loc.latlon).push(center),
profile: "driving-car",
sources: ['all'],
destinations: ['all'],
})
	// Add your own result handling here
	console.log("response: ", response)

	} catch (err) {
	console.log("An error occurred: " + err)
	//console.error(await err.response.json())
	}
	console.log("done getting matrix");
	 */
}

/* https://stackoverflow.com/questions/57001515/sliding-window-over-array-in-javascript */
function toWindows<T>(inputArray: T[], size: number): T[][] {
	return inputArray.reduce((acc, _, index, arr) => {
		if (index + size > arr.length) {
			//we've reached the maximum number of windows, so don't add any more
			return acc;
		}

		//add a new window of [currentItem, maxWindowSizeItem)
		return acc.concat(
			//wrap in extra array, otherwise .concat flattens it
			[arr.slice(index, index + size)]
		);
	}, []);
}

async function getTravel(events: Event[], location: string): Promise<Event[]> {
	let travel: Event[] = [];
	await Promise.all(
		events.map(async (ev, i) => {
			if (i > 0 && ev.location) {
				const timeBefore = await getTravelTime(location, ev.location, ev.start, TimeType.Arrival);
				console.log(`Travel to ${ev.location} takes ${timeBefore.rescale().toHuman()} minutes`);
				travel.push({
					title: `Travel to ${ev.location}`,
					type: EventType.Travel,
					start: ev.start.minus(timeBefore),
					end: ev.start,
					location: undefined
				});
			}
			if (i < events.length && ev.location) {
				const timeAfter = await getTravelTime(ev.location, location, ev.end, TimeType.Departure);
				console.log(`Travel from ${ev.location} takes ${timeAfter.rescale().toHuman()} minutes`);
				travel.push({
					title: `Travel from ${ev.location}`,
					type: EventType.Travel,
					start: ev.end,
					end: ev.end.plus(timeAfter),
					location: undefined
				});
			}
		})
	);

	travel.sort((a, b) => a.start.valueOf() - b.start.valueOf());

	// Remove overlap with other events and previous travel
	travel = travel
		.map((trv, ix) => {
			console.log(`Travel ${ix + 1}: ${trv.title} (${trv.start.toISO()} - ${trv.end.toISO()})`);
			let trv_int = new Interval(trv.start, trv.end);
			for (const ev of events.concat(travel.slice(0, ix))) {
				if (ev.start >= trv.end) break;
				if (ev.end <= trv.start) continue;

				console.log(`Overlapping event: ${ev.title} (${ev.start.toISO()} - ${ev.end.toISO()})`);

				const ev_int = new Interval(ev.start, ev.end);
				trv_int = trv_int.difference(ev_int);
			}

			if (
				trv_int.intervals().length === 0 ||
				+trv_int.intervals()[0].start.value() === +trv_int.intervals()[0].end.value()
			) {
				console.log(`Travel ${ix + 1} is fully overlapped`);
				return undefined;
			}

			return {
				...trv,
				start: trv_int.intervals()[0].start.value(),
				end: trv_int.intervals()[0].end.value()
			} as Event;
		})
		.filter((t) => t !== undefined) as Event[];

	return travel;
}

// Round event times to 15 minuets, only expanding
function roundEventOut(event: Event): Event {
	return {
		...event,
		start: event.start.minus({ minute: event.start.minute % 15 }),
		end: event.end.plus({ minute: 15 - (event.end.minute % 15) })
	};
}

function calculateAvailability(
	events: Event[],
	rangeStart: DateTime,
	rangeEnd: DateTime
): Availability[] {
	console.log('calculateAvailability');
	const busy_events = events.map(roundEventOut);
	const tutoring_events = events.filter((ev) => ev.type === EventType.Tutoring).map(roundEventOut);

	let availability: Interval = new Interval(rangeStart, rangeEnd);
	busy_events.forEach((ev) => {
		let start = ev.start;
		while (availability.intersection(start, ev.end).intervals().length > 0) {
			availability = availability.difference(
				new Interval.Endpoint(start, false),
				new Interval.Endpoint(ev.end, true)
			);
			start = start.plus({ minute: 1 });
		}
	});

	// Split intervals on midnight
	for (let t = rangeStart; t <= rangeEnd; t = t.plus({ days: 1 })) {
		availability = availability.difference(t);
	}

	const availability_intervals: { start: DateTime; end: DateTime; state: AppointmentState }[] =
		availability.intervals().map((int: Interval) => {
			return {
				start: int.start.value(),
				end: int.end.value(),
				state: AppointmentState.Available
			};
		});
	console.log('calculated availability intervals');

	let booked = new Interval();
	tutoring_events.forEach((ev) => {
		booked = booked.union(ev.start, ev.end);
	});
	booked = booked.intervals().map((int: Interval) => {
		return {
			start: int.start.value(),
			end: int.end.value(),
			state: AppointmentState.Booked
		};
	});
	console.log('calculated booked intervals');

	const appointments: Appointment[] = availability_intervals.concat(booked).map((int) => {
		if (int.end.hour === 0 && int.end.minute === 0) {
			int.end = DateTime.fromObject({
				hour: 24,
				minute: 0
			});
		}
		return {
			state: int.state,
			time_range: new TimeRange(
				int.start.weekday % 7,
				new Time(int.start.hour, int.start.minute),
				new Time(int.end.hour, int.end.minute)
			)
		};
	});
	console.log('calculated appointments');

	function toHours(app: Appointment): { start: number; end: number } {
		const start = app.time_range.day * 24 + app.time_range.start.asQuarterHours() / 4;
		const end = app.time_range.day * 24 + app.time_range.end.asQuarterHours() / 4;
		return { start, end };
	}

	let combinedIntervals: Interval<number> = new Interval(0, 24 * 7);
	appointments.forEach((app) => {
		const { start, end } = toHours(app);
		combinedIntervals = combinedIntervals.difference(start).difference(end);
	});

	console.log('calculated combined intervals');

	const combinedAvailability = combinedIntervals.intervals().map((int: Interval<number>) => {
		const booked = appointments.filter(
			(app) =>
				app.state === AppointmentState.Booked &&
				new Interval(int.start, int.end).subset(toHours(app).start, toHours(app).end)
		);
		const available = appointments.filter(
			(app) =>
				app.state === AppointmentState.Available &&
				new Interval(int.start, int.end).subset(toHours(app).start, toHours(app).end)
		);

		const weekday = Math.floor(int.start.value() / 24);
		const start = Time.fromQuarterHours((int.start.value() - weekday * 24) * 4);
		const end = Time.fromQuarterHours((int.end.value() - weekday * 24) * 4);

		return {
			time_range: new TimeRange(weekday, start, end),
			booked: booked.length,
			available: available.length
		};
	});

	console.log('calculated combined availability');

	//combinedAvailability.sort((a, b) => a.time_range.start.asQuarterHours() - b.time_range.start.asQuarterHours());

	// Join adjacent times with same availability
	const state = (av: Availability): string | number => (av.booked > 0 ? 'booked' : av.available);
	let i = 0;
	let loops = 0;
	while (i < combinedAvailability.length - 1 && loops < 200) {
		const av1 = combinedAvailability[i];
		const av2 = combinedAvailability[i + 1];
		const same_availability =
			av1.time_range.weekday === av2.time_range.weekday &&
			av1.time_range.end.toString() == av2.time_range.start.toString() &&
			state(av1) === state(av2);

		if (same_availability) {
			combinedAvailability[i].time_range.end = av2.time_range.end;
			combinedAvailability.splice(i + 1, 1);
		} else {
			i++;
		}
		loops++;
	}

	console.log('joined adjacent times with same availability');

	return combinedAvailability;
}

export const getAvailability = cache_function(
	'availability',
	async (startDate?: DateTime, numWeeks?: number, location?: string): Promise<Availability[]> => {
		const rangeStart =
			startDate ?? DateTime.fromObject({ hour: 0 }, { zone: 'Australia/Melbourne' }).endOf('day');
		const rangeEnd = rangeStart.plus({ weeks: numWeeks ?? 10 });

		const events = await getCalendarEvents(rangeStart, rangeEnd);

		events.sort((ev1, ev2) => ev1.start.toMillis() - ev2.start.toMillis());

		/*
			const locationStrings = new Set(events.map((ev: Event) => ev.location).filter((loc) => loc));
			const locations = await Promise.all(Array.from(locationStrings).map(async loc => {return {name: loc, latlon: await getLocation(loc)}}));
			const center = await getLocation("State Library of Victoria");
			await getMatrix(locations, center);
			console.log(
				'travel time: ',
				await getTravelTime(
					'1 Nyorie Court, Ivanhoe',
					'20 Ayr Street',
					DateTime.fromObject({ year: 2025, month: 12, day: 20, hour: 15 }),
					TimeType.Arrival
				)
			);
		*/

		const travel = location ? await getTravel(events, location) : [];
		// console.log('travel', travel);

		const combinedAvailability = calculateAvailability(events.concat(travel), rangeStart, rangeEnd);
		return combinedAvailability;
	},
	Duration.fromObject({ hours: 30 })
);
