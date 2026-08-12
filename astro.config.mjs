// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  // Keep Astro's selective CSS inlining, but raise the small-asset threshold
  // enough to inline catalog/page component CSS while leaving the much larger
  // CommerceLayout stylesheet cacheable. This removes several render-blocking
  // requests without repeating the previous global `always` regression.
  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      assetsInlineLimit: 8192,
    },
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ]
});
