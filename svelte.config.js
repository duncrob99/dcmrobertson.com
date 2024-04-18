import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    compilerOptions: {
        enableSourcemap: true
    },
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: preprocess({
		scss: {
			includePaths: ['src/styles']
		}
	}),

	kit: {
		adapter: adapter()
	}
};

export default config;
