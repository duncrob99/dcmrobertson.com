import type { DateTime } from "luxon";

declare module 'intervaljs' {
	export default class Interval<T> {
		constructor(start: T, end?: T): Interval<T>;

		difference(other: Interval<T>): Interval<T>;
		difference(start: T, end?: T): Interval<T>;

		intervals(): Interval<T>[];
	};
}
