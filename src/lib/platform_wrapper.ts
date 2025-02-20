import { TimeRange, Day, Time, AppointmentState } from "./types";

class DummyKVStore {
	data: Record<string, string> = {};

	async get(key: string): Promise<string | null> {
		return this.data[key] ?? null;
	}

	async put(key: string, value: string): Promise<void> {
		this.data[key] = value;
	}

	async delete(key: string): Promise<void> {
		delete this.data[key];
	}

	async list(prefix?: string): Promise<KVListType> {
		return {
            keys: Object.keys(this.data)
                        .filter(key => key.startsWith(prefix ?? ''))
                        .map(key => {
                            return {
                                name: key,
                                expiration: 5,
                                metadata: {}
                            }
                        }),
            list_complete: true,
            cursor: ""
        }
	}
}

class DummyEnv {
	BOOKABLE_TIMES: DummyKVStore;
	ACCOUNTS: DummyKVStore;

	constructor() {
		this.BOOKABLE_TIMES = new DummyKVStore();
		let example_times = [
			{
				time_range: new TimeRange(Day.Thursday, new Time(14, 0), new Time(15, 0)),
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
				time_range: new TimeRange(Day.Monday, new Time(13, 0), new Time(14, 0)),
				state: AppointmentState.Available
			},
		];

		for (let time of example_times) {
			this.BOOKABLE_TIMES.put(JSON.stringify(time), '');
		}
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Monday, new Time(13, 0), new Time(14, 0))), '');
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Thursday, new Time(13, 0), new Time(17, 15))), '');
		//this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Friday, new Time(13, 0), new Time(17, 15))), '');

		this.ACCOUNTS = new DummyKVStore();
		this.ACCOUNTS.put('admin@admin.com', '{"publicKey": "something", "wrappedPrivateKey": "something else"}');
		this.ACCOUNTS.put('someone@someplace.com', '{"publicKey": "someone\'s public key", "wrappedPrivateKey": "someone\'s private key"}');
	}
}

class DummyPlatform {
	env: DummyEnv = new DummyEnv();
}

export class PlatformWrapper {
	readonly platform: Readonly<App.Platform>

	constructor(platform?: Readonly<App.Platform>) {
		this.platform = platform ?? new DummyPlatform();
	}
}

export type KVListType = {
  keys: {
    name: string;
    expiration: number;
    metadata: Record<string, string>;
  }[];
  list_complete: boolean;
  cursor: string;
};
