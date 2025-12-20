import { TimeRange, Day, Time, AppointmentState } from './types';
import { DateTime } from 'luxon';
import { dev } from '$app/environment';

class DummyKVStore {
	data: Record<string, { value: string; expiry?: DateTime }> = {};

	async get(key: string): Promise<string | null> {
		this.purge_expired();
		return this.data[key]?.value ?? null;
	}

	async put(
		key: string,
		value: string,
		opts?: { expiration?: number; expirationTtl?: number }
	): Promise<void> {
		this.data[key] = {
			value,
			expiry: opts?.expirationTtl
				? DateTime.now().plus({ seconds: opts.expirationTtl })
				: opts?.expiration
				? DateTime.fromSeconds(opts.expiration)
				: undefined
		};
	}

	async delete(key: string): Promise<void> {
		delete this.data[key];
	}

	async list(options?: { prefix?: string }): Promise<KVListType> {
		this.purge_expired();
		return {
			keys: Object.keys(this.data)
				.filter((key) => key.startsWith(options?.prefix ?? ''))
				.map((key) => {
					return {
						name: key,
						expiration: this.data[key].expiry?.toSeconds() ?? undefined,
						metadata: {}
					};
				}),
			list_complete: true,
			cursor: ''
		};
	}

	purge_expired() {
		const now = DateTime.now();
		Object.keys(this.data).forEach((key) => {
			if (this.data[key].expiry && this.data[key].expiry < now) {
				delete this.data[key];
			}
		});
	}
}

class DummyEnv {
	BOOKABLE_TIMES: DummyKVStore;
	ACCOUNTS: DummyKVStore;
	FUNCTION_CACHE: DummyKVStore;

	constructor() {
		this.BOOKABLE_TIMES = new DummyKVStore();
		let example_times = [
			{
				time_range: new TimeRange(Day.Thursday, new Time(13, 30), new Time(15, 0)),
				state: AppointmentState.Booked
			},
			{
				time_range: new TimeRange(Day.Wednesday, new Time(15, 0), new Time(16, 30)),
				state: AppointmentState.Booked
			},
			{
				time_range: new TimeRange(Day.Friday, new Time(13, 0), new Time(17, 15)),
				state: AppointmentState.Available
			},
			{
				time_range: new TimeRange(Day.Wednesday, new Time(13, 0), new Time(17, 45)),
				state: AppointmentState.Available
			},
			{
				time_range: new TimeRange(Day.Thursday, new Time(13, 0), new Time(17, 30)),
				state: AppointmentState.Available
			},
			{
				time_range: new TimeRange(Day.Friday, new Time(13, 0), new Time(14, 0)),
				state: AppointmentState.Booked
			},
			{
				time_range: new TimeRange(Day.Monday, new Time(13, 0), new Time(14, 0)),
				state: AppointmentState.Available
			}
		];

		for (let time of example_times) {
			this.BOOKABLE_TIMES.put(JSON.stringify(time), '');
		}
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Monday, new Time(13, 0), new Time(14, 0))), '');
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Thursday, new Time(13, 0), new Time(17, 15))), '');
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Friday, new Time(13, 0), new Time(17, 15))), '');

		this.ACCOUNTS = new DummyKVStore();
		this.ACCOUNTS.put(
			'admin@admin.com',
			'{"publicKey": "something", "wrappedPrivateKey": "something else"}'
		);
		this.ACCOUNTS.put(
			'someone@someplace.com',
			'{"publicKey": "someone\'s public key", "wrappedPrivateKey": "someone\'s private key"}'
		);

		this.FUNCTION_CACHE = new DummyKVStore();
	}
}

class DummyPlatform {
	env: DummyEnv = new DummyEnv();
}

const globalDummyPlatform = dev ? new DummyPlatform() : undefined;

export class PlatformWrapper {
	readonly platform: Readonly<App.Platform>;

	constructor(platform?: Readonly<App.Platform>) {
		this.platform = platform ?? globalDummyPlatform ?? new DummyPlatform();
	}
}

export type KVListType = {
	keys: {
		name: string;
		expiration?: number;
		metadata?: Record<string, string>;
	}[];
	list_complete: boolean;
	cursor: string;
};

export type KVStore = {
	get(key: string): Promise<string | null>;

	put(key: string, value: string): Promise<void>;

	delete(key: string): Promise<void>;

	list(prefix?: string): Promise<KVListType>;
};
