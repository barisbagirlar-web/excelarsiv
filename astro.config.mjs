// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const pagePaths = [
  '',
  '/sablonlar',
  '/paketler',
  '/nasil-calisir',
  '/rehber',
  '/iletisim',
  '/sss',
  '/teslimat-ve-iade',
  '/lisans',
  '/mesafeli-satis-sozlesmesi',
  '/kvkk-aydinlatma',
  '/cerez-politikasi',
];

// https://astro.build/config
export default defineConfig({
  site: 'https://excelarsiv.com',
  trailingSlash: 'never',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/og') && !page.includes('/demo'),
      serialize: (item) => {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        const isHome = path === '';
        const isTemplate = path.startsWith('/sablon/');
        const isCategory = path.startsWith('/sablonlar');
        if (isHome) {
          item.changefreq = 'weekly';
          item.priority = 1;
        } else if (isTemplate) {
          item.changefreq = 'monthly';
          item.priority = 0.9;
        } else if (isCategory || pagePaths.includes(path)) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        }
        return item;
      },
    }),
  ]
});
