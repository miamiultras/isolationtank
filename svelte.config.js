import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            // Runtime options
            runtime: 'nodejs20.x'
        })
    },
    preprocess: vitePreprocess()
};

export default config;
