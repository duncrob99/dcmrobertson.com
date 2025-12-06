//import { calendar } from '@googleapis/calendar';
//import { google } from 'googleapis';
//const {google} = require('googleapis');
//const calendar = google.calendar('v3');

import { DateTime, Duration } from "luxon";
import ICAL from "ical.js";
import Interval from "intervaljs";
import { TimeRange, Time, AppointmentState, Day } from "$lib/types";
import type { Appointment } from "$lib/types";
import { BUSY_CALENDARS, BOOKED_CALENDAR } from "$env/static/private";

const toDateTime = (icaltime: ICAL.Time) => DateTime.fromISO(icaltime?.toString(), {zone: "Australia/Melbourne"});

const busy_calendars = BUSY_CALENDARS.split(";");
const tutoring_calendar = BOOKED_CALENDAR;

const rangeStart = DateTime.fromObject({ hour: 0 }, { zone: "Australia/Melbourne" }).endOf("day");
const rangeEnd = rangeStart.endOf("day").plus({ weeks: 10 });

async function getEvents(cal: string) {
	//const icals = await Promise.all(cals.map(async cal => await (await fetch(cal)).text()));
	//const jcals = icals.map(ICAL.parse);
	console.log("events from: ", cal);
	const ical = await (await fetch(cal)).text();
	const jcal = ICAL.parse(ical);
	const events = new ICAL.Component(jcal).getAllSubcomponents("vevent").map(comp => new ICAL.Event(comp)); 

	function summariseEvent(ev: ICAL.Event, start?: DateTime) {
		const transparent = new ICAL.Component(ICAL.parse(ev.toString())).getFirstPropertyValue("transp") as string;
		let busy = null;

		switch (transparent) {
			case "OPAQUE":
				busy = true;
			break;
			case "TRANSPARENT":
				busy = false;
			break;
		}

		return {
			title: ev.summary,
			start: start ?? toDateTime(ev.startDate),
			end: (start?.plus(Duration.fromISO(ev.duration.toString()))) ?? toDateTime(ev.endDate),
			location: ev.location,
			busy,
		}
	}

	const dets = events.map(ev => {
		const iterator = ev.iterator();
		if (!ev.isRecurring()) {
			if (!(toDateTime(ev.startDate) < rangeEnd && toDateTime(ev.endDate) > rangeStart)) return [];
			return [summariseEvent(ev)];
		}
		//console.log(ev.summary, ev.isRecurring());

		//let next = iterator.next()
		//console.log(DateTime.fromISO(next.toString()));
		let occurences = [];
		for (let start = toDateTime(iterator.next()); start && start < rangeEnd; start = toDateTime(iterator.next())) {
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
	}).filter(a => a.length > 0).flat().filter(ev => ev.busy).map(({busy, ...ev}) => ev);

	return dets;
}

const busy_events = (await Promise.all(busy_calendars.map(getEvents))).flat();
const tutoring_events = await getEvents(tutoring_calendar);
console.log(busy_events);

let availability: Interval = new Interval(rangeStart, rangeEnd);
busy_events.forEach(ev => {
	let start = ev.start;
	while (availability.intersection(start, ev.end).intervals().length > 0) {
		availability = availability.difference(new Interval.Endpoint(start, false), new Interval.Endpoint(ev.end, true));
		start = start.plus({minute: 1});
	}
});

// Split intervals on midnight
for (let t=rangeStart; t<=rangeEnd; t = t.plus({days: 1})) {
	console.log(t);
	availability = availability.difference(t);
}

let availability_intervals: {start: DateTime, end: DateTime, state: AppointmentState}[] = availability.intervals().map((int: Interval) => {
	return {
		start: int.start.value(),
		end: int.end.value(),
		state: AppointmentState.Available,
	}
});

console.log(availability_intervals.map(({start, end}) => [start.toISO(), end.toISO()]));

let booked = new Interval();
tutoring_events.forEach(ev => {
	booked = booked.union(ev.start, ev.end);
});
booked = booked.intervals().map((int: Interval) => {
	return {
		start: int.start.value(),
		end: int.end.value(),
		state: AppointmentState.Booked,
	};
});

const appointments: Appointment[] = availability_intervals.concat(booked).map(int => {
	if (int.end.hour === 0 && int.end.minute === 0) {
		int.end = {
			hour: 24,
			minute: 0,
		};
	}
	return {
		state: int.state,
		time_range: new TimeRange(int.start.weekday % 7, new Time(int.start.hour, int.start.minute), new Time(int.end.hour, int.end.minute))
	}
});

function toHours(app: Appointment): {start: number, end: number} {
	const start = app.time_range.day * 24 + app.time_range.start.asQuarterHours()/4;
	const end = app.time_range.day * 24 + app.time_range.end.asQuarterHours()/4;
	return {start, end};
}

let combinedIntervals: Interval<number> = new Interval(0, 24*7);
appointments.forEach(app => {
	let {start, end} = toHours(app);
	combinedIntervals = combinedIntervals.difference(start).difference(end);
});

let combinedAvailability = combinedIntervals.intervals().map(int => {
	const booked = appointments.filter(app => app.state === AppointmentState.Booked && (new Interval(int.start, int.end)).subset(toHours(app).start, toHours(app).end));
	const available = appointments.filter(app => app.state === AppointmentState.Available && (new Interval(int.start, int.end)).subset(toHours(app).start, toHours(app).end));

	const weekday = Math.floor(int.start.value()/24);
	const start = Time.fromQuarterHours((int.start.value() - weekday * 24)*4);
	const end = Time.fromQuarterHours((int.end.value() - weekday * 24)*4);

	return {
		time_range: new TimeRange(weekday, start, end),
		booked: booked.length,
		available: available.length,
	}
});
console.log(combinedAvailability.map(av => av.time_range.toString()));
//combinedAvailability.sort((a, b) => a.time_range.start.asQuarterHours() - b.time_range.start.asQuarterHours());
console.log(combinedAvailability.map(av => av.time_range.toString()));

// Join adjacent times with same availability
let i = 0;
let loops = 0;
while (i < combinedAvailability.length-1 && loops < 200) {
	const av1 = combinedAvailability[i];
	const av2 = combinedAvailability[i+1];
	const same_availability = av1.time_range.weekday === av2.time_range.weekday && av1.time_range.end.toString() == av2.time_range.start.toString() && av1.booked === av2.booked && av1.available === av2.available;

	if (av1.time_range.toString() === '6 14:00 - 15:00') {
		console.log("15:00", av1, av2);
	}

	if (same_availability) {
		console.log();
		console.log("combining:");
		console.log(av1, av2);
		console.log(combinedAvailability.map(av => av.time_range.toString()));
		console.log();
		combinedAvailability[i].time_range.end = av2.time_range.end;
		combinedAvailability.splice(i+1, 1);
		console.log(combinedAvailability[i], combinedAvailability[i+1]);
	} else {
		i++;
	}
	loops++;
}

export function getAvailability(startDate: DateTime, numWeeks: number): Appointment[] {
	return combinedAvailability;
}
