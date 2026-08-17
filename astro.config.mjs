// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  // Inline CSS denetimde 186KB olarak ölçülüyor; stilleri harici dosyaya çıkar.
  build: {
    inlineStylesheets: 'never',
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ]
});
