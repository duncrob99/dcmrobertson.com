import { dev } from '$app/environment';
import { PlatformWrapper } from '$lib/platform_wrapper';

type AsyncLocalStorageInstance<T> = {
	run<R>(store: T, callback: () => R): R;
	getStore(): T | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let asyncLocalStorage: AsyncLocalStorageInstance<Map<string, any>>;
let initialized = false;

async function ensureInitialized() {
	if (initialized) return;

	// Dynamic import with variable to prevent static analysis/bundling
	const moduleName = 'node:async_hooks';
	const { AsyncLocalStorage } = await import(/* @vite-ignore */ moduleName);
	asyncLocalStorage = new AsyncLocalStorage();
	initialized = true;
}

// Initialize immediately via top-level await
await ensureInitialized();

export function runWithContext<T>(fn: () => T) {
	return asyncLocalStorage.run(new Map(), fn);
}

export function setRequestContext<T>(key: string, value: T) {
	const store = asyncLocalStorage.getStore();
	if (store) {
		store.set(key, value);
	} else {
		console.error('AsyncLocalStorage store is not available');
	}
}

export function getRequestContext<T>(key: string): T | undefined {
	const store = asyncLocalStorage.getStore();
	return store ? store.get(key) : undefined;
}

export function getPlatform(): Readonly<App.Platform> {
	const platform = getRequestContext<Readonly<App.Platform>>('platform');
	const platform_wrapper = new PlatformWrapper(platform).platform;
	return platform_wrapper;
}
