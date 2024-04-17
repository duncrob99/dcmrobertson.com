export enum Day {
	Sunday = 0,
	Monday = 1,
	Tuesday = 2,
	Wednesday = 3,
	Thursday = 4,
	Friday = 5,
	Saturday = 6,
}

// export type Time = {
// 	hour: number;
// 	minute: number;
// }

export class Time {
	hour: number;
	minute: number;

	constructor(hour: number, minute: number) {
		this.hour = hour;
		this.minute = minute;
	}

	asQuarterHours(): number {
		return this.hour * 4 + Math.floor(this.minute / 15);
	}

	toString(): string {
		return `${this.hour}:${this.minute.toString().padStart(2, '0')}`;
	}

	public static fromQuarterHours(quarterHours: number): Time {
		return new Time(Math.floor(quarterHours / 4), (quarterHours % 4) * 15);
	}

	toJSON() {
		return { ...this };
	}

	public static fromJSON(json: string): Time {
		const obj = JSON.parse(json);
		return new Time(obj.hour, obj.minute);
	}
}

// export type TimeRange = {
// 	day: Day; // 0 = Sunday, 1 = Monday, etc.
// 	start: Time; // 0 = 12:00am, 1 = 12:15am, etc.
// 	end: Time;
// }

export class TimeRange {
	day: Day;
	start: Time;
	end: Time;

	constructor(day: Day, start: Time, end: Time) {
		this.day = day;
		this.start = start;
		this.end = end;
	}

	public static fromJSON(json: string): TimeRange {
		const obj = JSON.parse(json);
		return new TimeRange(obj.day, new Time(obj.start.hour, obj.start.minute), new Time(obj.end.hour, obj.end.minute));
	}

	duration(): number {
		return this.end.asQuarterHours() - this.start.asQuarterHours();
	}

	toJSON() {
		return {
			day: this.day,
			start: {
				hour: this.start.hour,
				minute: this.start.minute,
			},
			end: {
				hour: this.end.hour,
				minute: this.end.minute,
			}
		};
	}

    toString() {
        return `${this.day} ${this.start.toString()} - ${this.end.toString()}`;
    }
}

export enum AppointmentState {
	Available,
	Booked,
}

export type Appointment = {
	time_range: TimeRange;
	state: AppointmentState;
}
