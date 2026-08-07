import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const { TIERS, PRODUCTS } = require('../functions/catalog.js');

const templatesDir = path.resolve('src/content/templates');
const files = (await readdir(templatesDir)).filter((file) => file.endsWith('.mdx')).sort();
const errors = [];

function readField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

for (const file of files) {
  const slug = file.replace(/\.mdx$/, '');
  const text = await readFile(path.join(templatesDir, file), 'utf8');
  const frontmatter = text.split('---')[1] ?? '';
  const product = PRODUCTS[slug];

  if (!product) {
    errors.push(`${slug}: functions/catalog.js içinde ürün yok`);
    continue;
  }

  const name = readField(frontmatter, 'name');
  const priceTL = Number(readField(frontmatter, 'priceTL'));
  const fileFormat = readField(frontmatter, 'fileFormat');

  if (name !== product.name) errors.push(`${slug}: ürün adı katalogla eşleşmiyor`);
  if (priceTL !== product.priceTL) errors.push(`${slug}: fiyat ${priceTL} != ${product.priceTL}`);
  if (fileFormat !== product.fileFormat) errors.push(`${slug}: format ${fileFormat} != ${product.fileFormat}`);

  const tier = TIERS[product.tier];
  if (!tier) errors.push(`${slug}: bilinmeyen tier ${product.tier}`);
  else if (tier.priceTL !== priceTL) errors.push(`${slug}: ${product.tier} fiyatı ürün fiyatıyla eşleşmiyor`);
}

for (const slug of Object.keys(PRODUCTS)) {
  if (!files.includes(`${slug}.mdx`)) errors.push(`${slug}: MDX ürün dosyası yok`);
}

if (errors.length) {
  console.error('Commerce config validation FAILED:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log(`Commerce config OK: ${files.length} ürün, ${Object.keys(TIERS).length} Shopier fiyat seviyesi.`);
