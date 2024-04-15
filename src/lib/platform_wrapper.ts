import { TimeRange, Day, Time } from "./types";

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

	async list(prefix?: string): Promise<string[]> {
		return Object.keys(this.data).filter(key => key.startsWith(prefix ?? ''));
	}
}

class DummyEnv {
	BOOKABLE_TIMES: DummyKVStore;
	ACCOUNTS: DummyKVStore;

	constructor() {
		this.BOOKABLE_TIMES = new DummyKVStore();
		this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Monday, new Time(10, 0), new Time(11, 0))), '');
		this.BOOKABLE_TIMES.put(JSON.stringify(new TimeRange(Day.Thursday, new Time(13, 0), new Time(17, 15))), '');

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
