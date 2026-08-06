// 12 ürünün demo .xlsx dosyalarını public/demo/ altına üretir.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildXlsx } from './xlsx.mjs';
import { products } from './product-data.mjs';

function slugify(text) {
  const map = {
    ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u', Â: 'a', Î: 'i', Û: 'u',
  };
  return text
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const outDir = resolve(process.cwd(), 'public/demo');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const p of products) {
  const slug = slugify(p.name);
  const buffer = buildXlsx({ name: p.name, sheets: p.sheets });
  const file = join(outDir, `${slug}.xlsx`);
  writeFileSync(file, buffer);
  console.log(`${slug}.xlsx — ${(buffer.length / 1024).toFixed(1)} KB`);
}
