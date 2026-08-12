// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  // Commerce pages use several small component stylesheets above the fold.
  // Inlining them removes the mobile Lighthouse render-blocking chain without
  // changing page semantics, assets, or visual design.
  build: {
    inlineStylesheets: 'always',
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ]
});
