// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  // Astro'nun seçici CSS inlining davranışını koru. 12 KiB eşiği katalogdaki
  // küçük component/page CSS parçalarını kritik render zincirinden çıkarırken
  // büyük CommerceLayout stilini ayrı ve cacheable bırakır.
  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      assetsInlineLimit: 12 * 1024,
    },
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ]
});
