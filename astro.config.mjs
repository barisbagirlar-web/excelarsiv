// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  // Kritik CSS'i HTML'e gömerek ürün/katalog ilk paint yolundaki ayrı CSS
  // isteklerini kaldır. Katalog ilk kartı artık ağ bağımsız hafif görsel
  // kullandığı için önceki ağır-PNG LCP regresyonu bu kombinasyonda yoktur.
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
