import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],

	css: {
		preprocessorOptions: {
			scss: {
				includePaths: ['src/styles']
			}
		}
	},

	ssr: {
		external: ['node:async_hooks']
	}
};

export default config;
