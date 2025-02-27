import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            // Runtime options
            runtime: 'nodejs16.x'
        })
    },
    preprocess: vitePreprocess()
};

export default config;
