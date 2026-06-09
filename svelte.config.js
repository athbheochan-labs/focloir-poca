import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isMobile = process.env.BUILD_TARGET === 'mobile';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isMobile
      ? adapterStatic({ fallback: 'index.html' })
      : adapterNode(),
  },
};

export default config;
