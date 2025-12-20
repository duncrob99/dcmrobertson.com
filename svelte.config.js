import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
// import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		enableSourcemap: true
	},
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	// preprocess: preprocess({
	// 	scss: {
	// 		includePaths: ['src/styles']
	// 	}
	// }),
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			platformProxy: true
		})
	}
};

export default config;
