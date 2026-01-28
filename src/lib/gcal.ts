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

function eventFromJSON(json: any): Event {
	return {
		...json,
		start: DateTime.fromISO(json.start),
		end: DateTime.fromISO(json.end)
	};
}

async function getEvents(cal: string, rangeStart: DateTime, rangeEnd: DateTime): Promise<Event[]> {
	//const icals = await Promise.all(cals.map(async cal => await (await fetch(cal)).text()));
	//const jcals = icals.map(ICAL.parse);
	console.log('events from: ', cal);
	const ical = await cache_function('icalFetch', async (cal) => await (await fetch(cal)).text(), {
		minutes: 15
	})(cal);
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

const getCalendarEvents = cache_function(
	'getCalendarEvents',
	async (rangeStart: DateTime, rangeEnd: DateTime): Promise<Event[]> => {
		return (
			await Promise.all(
				busy_calendars
					.concat([tutoring_calendar])
					.map((cal) => getEvents(cal, rangeStart, rangeEnd))
			)
		).flat();
	},
	{ minutes: 15 },
	(evList) => evList.map(eventFromJSON)
);

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

// Round event times to 15 minutes, only expanding
function roundEventOut(event: Event): Event {
	const startMins =
		event.start.minute + event.start.second / 60 + event.start.millisecond / (1000 * 60);
	const endMins = event.end.minute + event.end.second / 60 + event.end.millisecond / (1000 * 60);

	return {
		...event,
		start: event.start.minus({ minute: startMins % 15 }),
		end: event.end.plus({ minute: 15 - (endMins % 15 || 15) })
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
	console.log('Done filtering & rounding');

	console.log('Num busy events:', busy_events.length);
	const mergeIntervals = (items: Event[]): { start: DateTime; end: DateTime }[] => {
		const sorted = items
			.map((event) => ({ start: event.start, end: event.end }))
			.sort((a, b) => a.start.toMillis() - b.start.toMillis());
		const merged: { start: DateTime; end: DateTime }[] = [];
		for (const interval of sorted) {
			const last = merged[merged.length - 1];
			if (!last || interval.start.toMillis() > last.end.toMillis()) {
				merged.push(interval);
			} else if (interval.end.toMillis() > last.end.toMillis()) {
				last.end = interval.end;
			}
		}
		return merged;
	};

	const busyIntervals = mergeIntervals(busy_events);
	console.log('Merged busy events:', busyIntervals.length);

	const availabilityIntervals: { start: DateTime; end: DateTime }[] = [];
	let cursor = rangeStart;
	for (const busy of busyIntervals) {
		if (busy.end.toMillis() <= cursor.toMillis()) {
			continue;
		}
		if (busy.start.toMillis() > cursor.toMillis()) {
			availabilityIntervals.push({ start: cursor, end: busy.start });
		}
		if (busy.end.toMillis() > cursor.toMillis()) {
			cursor = busy.end;
		}
		if (cursor.toMillis() >= rangeEnd.toMillis()) {
			break;
		}
	}
	if (cursor.toMillis() < rangeEnd.toMillis()) {
		availabilityIntervals.push({ start: cursor, end: rangeEnd });
	}
	console.log('Done busy events loop');

	const splitByMidnight = (items: { start: DateTime; end: DateTime }[]) => {
		const split: { start: DateTime; end: DateTime }[] = [];
		for (const interval of items) {
			let start = interval.start;
			const end = interval.end;
			while (start.toMillis() < end.toMillis()) {
				const nextMidnight = start.startOf('day').plus({ days: 1 });
				const sliceEnd = nextMidnight.toMillis() < end.toMillis() ? nextMidnight : end;
				split.push({ start, end: sliceEnd });
				start = sliceEnd;
			}
		}
		return split;
	};

	const availability_intervals: { start: DateTime; end: DateTime; state: AppointmentState }[] =
		splitByMidnight(availabilityIntervals).map((int) => ({
			start: int.start,
			end: int.end,
			state: AppointmentState.Available
		}));
	console.log('calculated availability intervals');

	const booked = mergeIntervals(tutoring_events).map((int) => ({
		start: int.start,
		end: int.end,
		state: AppointmentState.Booked
	}));
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

	const boundarySet = new Set<number>([0, 24 * 7]);
	const appointmentHours = appointments.map((app) => ({
		state: app.state,
		...toHours(app)
	}));
	appointmentHours.forEach(({ start, end }) => {
		boundarySet.add(start);
		boundarySet.add(end);
	});

	const boundaries = Array.from(boundarySet).sort((a, b) => a - b);
	const indexByBoundary = new Map(boundaries.map((value, index) => [value, index]));
	const bookedDiff = new Array(boundaries.length).fill(0);
	const availableDiff = new Array(boundaries.length).fill(0);

	for (const app of appointmentHours) {
		const startIndex = indexByBoundary.get(app.start);
		const endIndex = indexByBoundary.get(app.end);
		if (startIndex === undefined || endIndex === undefined) {
			continue;
		}
		if (app.state === AppointmentState.Booked) {
			bookedDiff[startIndex] += 1;
			bookedDiff[endIndex] -= 1;
		} else {
			availableDiff[startIndex] += 1;
			availableDiff[endIndex] -= 1;
		}
	}

	console.log('calculated combined intervals');

	const combinedAvailability: Availability[] = [];
	let bookedCount = 0;
	let availableCount = 0;
	for (let i = 0; i < boundaries.length - 1; i++) {
		bookedCount += bookedDiff[i];
		availableCount += availableDiff[i];
		const startValue = boundaries[i];
		const endValue = boundaries[i + 1];
		if (startValue === endValue) continue;
		const weekday = Math.floor(startValue / 24);
		const start = Time.fromQuarterHours((startValue - weekday * 24) * 4);
		const end = Time.fromQuarterHours((endValue - weekday * 24) * 4);
		combinedAvailability.push({
			time_range: new TimeRange(weekday, start, end),
			booked: bookedCount,
			available: availableCount
		});
	}

	console.log('calculated combined availability');

	const mergedAvailability: Availability[] = [];
	const state = (av: Availability): string | number => (av.booked > 0 ? 'booked' : av.available);
	for (const current of combinedAvailability) {
		const prev = mergedAvailability[mergedAvailability.length - 1];
		if (
			prev &&
			prev.time_range.weekday === current.time_range.weekday &&
			prev.time_range.end.toString() === current.time_range.start.toString() &&
			state(prev) === state(current)
		) {
			prev.time_range.end = current.time_range.end;
			continue;
		}
		mergedAvailability.push(current);
	}

	console.log('joined adjacent times with same availability');

	return mergedAvailability;
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
