import { AsyncLocalStorage } from 'node:async_hooks';
import { PlatformWrapper } from '$lib/platform_wrapper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

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

export function getPlatform(): PlatformWrapper {
	const platform = getRequestContext('platform');
	const platform_wrapper = new PlatformWrapper(platform).platform;
	return platform_wrapper;
}
