import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],
  build: {
    // Always emit CSS as separate files. Small stylesheets are otherwise inlined into the page,
    // and the site's CSP allows inline styles only by exact hash, so every CSS edit would change it.
    inlineStylesheets: 'never',
  },
});
