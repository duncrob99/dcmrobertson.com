// See https://kit.svelte.dev/docs/types#app

import type { KVStore } from "$lib/platform_wrapper";
import type { User } from "$lib/server/auth_utils";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | undefined;
		}
		// interface PageData {}
		interface Platform {
			env?: {
				BOOKABLE_TIMES: KVStore;
				ACCOUNTS: KVStore;
				FUNCTION_CACHE: KVStore;
			};
		}
	}
}

export {};
