import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'commerce/catalog.json'), 'utf8'));
const templatesDir = path.join(root, 'src/content/templates');
const templateFiles = fs.readdirSync(templatesDir).filter((name) => name.endsWith('.mdx')).sort();
const errors = [];

// GERÇEK TESLİMAT METADATA KAYNAĞI.
// Tüm teknik metadata iddiaları delivery/paid-products/<slug>/current.xlsx içindeki
// gerçek satış dosyasından deterministik olarak okunur. Dosya eksikse veya mdx
// değerleri gerçek dosyayla uyuşmuyorsa build aşağıda FAIL eder; web'e
// doğrulanmamış bilgi çıkmaz.
const deliveryProc = spawnSync(
  process.execPath,
  [path.join('scripts', 'read-delivery-metadata.mjs'), '--json'],
  { cwd: root, encoding: 'utf8' },
);
if (deliveryProc.status !== 0) {
  errors.push(
    `Teslimat metadata okunamadı: ${(deliveryProc.stderr || deliveryProc.stdout || '').trim() || 'bilinmeyen hata'}`,
  );
}
const delivery = deliveryProc.status === 0 ? JSON.parse(deliveryProc.stdout) : {};

// Cloud Functions uploads only the functions/ directory. Its local catalog mirror
// must therefore stay byte-for-data equivalent to the commerce source of truth.
const functionsCatalogPath = path.join(root, 'functions/catalog.json');
if (!fs.existsSync(functionsCatalogPath)) {
  errors.push('functions/catalog.json eksik; Cloud Functions ürün kataloğunu yükleyemez.');
} else {
  const functionsCatalog = JSON.parse(fs.readFileSync(functionsCatalogPath, 'utf8'));
  if (JSON.stringify(functionsCatalog) !== JSON.stringify(catalog)) {
    errors.push('functions/catalog.json commerce/catalog.json ile eşleşmiyor.');
  }
}

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

  const real = delivery[slug];
  if (!real) {
    errors.push(`${slug}: delivery/paid-products/${slug}/current.xlsx bulunamadı; teknik metadata doğrulanamaz.`);
  } else {
    const sheetCount = Number(source.match(/^sheetCount:\s*(\d+)\s*$/m)?.[1]);
    const sizeMB = Number(source.match(/^sizeMB:\s*([\d.]+)\s*$/m)?.[1]);
    const fileFormat = source.match(/^fileFormat:\s*['"]?(xlsx|xlsm)['"]?\s*$/m)?.[1];
    const hasMacros = source.match(/^hasMacros:\s*(true|false)\s*$/m)?.[1] === 'true';
    const sheetNames = [...source.matchAll(/^\s*- name:\s*'(.+?)'\s*$/gm)].map((m) => m[1]);

    if (sheetCount !== real.sheetCount) errors.push(`${slug}: sheetCount ${sheetCount}, gerçek dosya ${real.sheetCount}.`);
    if (sizeMB !== real.sizeMB) errors.push(`${slug}: sizeMB ${sizeMB}, gerçek dosya ${real.sizeMB}.`);
    if (fileFormat !== real.fileFormat) errors.push(`${slug}: fileFormat ${fileFormat}, gerçek dosya ${real.fileFormat}.`);
    if (hasMacros !== real.hasMacros) errors.push(`${slug}: hasMacros ${hasMacros}, gerçek dosya ${real.hasMacros}.`);
    if (product.fileFormat !== real.fileFormat) errors.push(`${slug}: katalog fileFormat ${product.fileFormat}, gerçek dosya ${real.fileFormat}.`);
    if (JSON.stringify(sheetNames) !== JSON.stringify(real.sheetNames)) {
      errors.push(`${slug}: sheetMap gerçek dosya sheet'leriyle birebir eşleşmiyor.`);
    }
  }
}

for (const slug of Object.keys(catalog.products)) {
  if (!liveSlugs.has(slug)) errors.push(`${slug}: katalogda var fakat ürün MDX dosyası yok.`);
}

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const rewrites = firebaseConfig.hosting?.[0]?.rewrites ?? [];
const requiredRoutes = [
  '/api/checkout',
  '/api/checkout-status',
  '/api/verify-order',
  '/api/recover-purchase',
  '/api/download-token',
  '/api/download',
  '/api/demo-request',
  '/api/demo-download',
];
for (const route of requiredRoutes) {
  if (!rewrites.some((entry) => entry.source === route && entry.function?.functionId)) {
    errors.push(`${route}: Firebase Hosting function rewrite eksik.`);
  }
}

// Proof Demo güvenlik kapısı: indirilebilir Excel binary'si public/ altında bulunamaz.
const publicDir = path.join(root, 'public');
const publicExcel = [];
function scanPublic(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanPublic(full);
    else if (/\.(xlsx|xlsm)$/i.test(entry.name)) publicExcel.push(path.relative(root, full));
  }
}
scanPublic(publicDir);
if (publicExcel.length) {
  errors.push(`Public Excel binary yasak; Proof Demo API üzerinden üretilmeli: ${publicExcel.join(', ')}`);
}

const demoComponent = fs.readFileSync(path.join(root, 'src/components/DemoDownloadBox.astro'), 'utf8');
if (/href\s*=\s*\{?[^\n]*demoFile/i.test(demoComponent) || /\/demo\/[^\s'\"]+\.xlsx/i.test(demoComponent)) {
  errors.push('DemoDownloadBox statik /demo/*.xlsx bağlantısı içeremez.');
}
if (!demoComponent.includes('/api/demo-request')) errors.push('DemoDownloadBox Proof Demo API akışına bağlı değil.');

const proofSpecs = fs.readFileSync(path.join(root, 'functions/proof-demo-specs.js'), 'utf8');
for (const slug of Object.keys(catalog.products)) {
  if (!proofSpecs.includes(`'${slug}'`)) errors.push(`${slug}: Proof Demo sözleşmesi eksik.`);
}

if (errors.length) {
  console.error(`Commerce validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Commerce validation OK: ${templateFiles.length} ürün, 4 Shopier seviyesi, ${requiredRoutes.length} güvenli API rotası, public Excel binary=0.`);
