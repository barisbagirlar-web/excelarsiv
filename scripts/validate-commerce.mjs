import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'commerce/catalog.json'), 'utf8'));
const templatesDir = path.join(root, 'src/content/templates');
const templateFiles = fs.readdirSync(templatesDir).filter((name) => name.endsWith('.mdx')).sort();
const errors = [];

const allowedPrices = new Set(Object.values(catalog.tiers).map((tier) => tier.priceTL));
if (allowedPrices.size !== 4 || ![990, 1490, 2490, 7900].every((price) => allowedPrices.has(price))) {
  errors.push('Shopier fiyat seviyeleri 990/1490/2490/7900 TL olmalı.');
}

for (const [tierName, tier] of Object.entries(catalog.tiers)) {
  if (!/^\d+$/.test(String(tier.shopierProductId))) errors.push(`${tierName}: geçersiz Shopier ürün ID`);
  if (tier.shopierUrl !== `https://www.shopier.com/${tier.shopierProductId}`) {
    errors.push(`${tierName}: Shopier URL ürün ID ile eşleşmiyor.`);
  }
}

const liveSlugs = new Set();
for (const file of templateFiles) {
  const slug = file.replace(/\.mdx$/, '');
  liveSlugs.add(slug);
  const source = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  const name = source.match(/^name:\s*['"](.+?)['"]\s*$/m)?.[1];
  const price = Number(source.match(/^priceTL:\s*(\d+(?:\.\d+)?)\s*$/m)?.[1]);
  const product = catalog.products[slug];

  if (!product) {
    errors.push(`${slug}: commerce/catalog.json içinde ürün kaydı yok.`);
    continue;
  }
  const tier = catalog.tiers[product.tier];
  if (!tier) errors.push(`${slug}: bilinmeyen fiyat seviyesi ${product.tier}.`);
  if (name !== product.name) errors.push(`${slug}: ürün adı katalogla eşleşmiyor.`);
  if (!Number.isFinite(price) || price !== tier?.priceTL) {
    errors.push(`${slug}: MDX fiyatı ${price} TL, ${product.tier} seviyesi ${tier?.priceTL} TL.`);
  }
  if (!/^paid-products\/[a-z0-9-]+\/current\.(xlsx|xlsm)$/.test(product.storageKey)) {
    errors.push(`${slug}: private storageKey standarda uymuyor.`);
  }
  if (!product.storageKey.includes(`/${slug}/`)) errors.push(`${slug}: storageKey yanlış ürüne işaret ediyor.`);
}

for (const slug of Object.keys(catalog.products)) {
  if (!liveSlugs.has(slug)) errors.push(`${slug}: katalogda var fakat ürün MDX dosyası yok.`);
}

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const rewrites = firebaseConfig.hosting?.[0]?.rewrites ?? [];
for (const route of ['/api/checkout', '/api/checkout-status', '/api/verify-order', '/api/download-token', '/api/download']) {
  if (!rewrites.some((entry) => entry.source === route && entry.function?.functionId)) {
    errors.push(`${route}: Firebase Hosting function rewrite eksik.`);
  }
}

if (errors.length) {
  console.error(`Commerce validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Commerce validation OK: ${templateFiles.length} ürün, 4 Shopier seviyesi, 5 güvenli API rotası.`);
