#!/usr/bin/env node
/**
 * PAID-PRODUCT READINESS DENETİMİ
 * Firebase Storage'daki katalog ürünlerinin satış dosyasını doğrular.
 *
 * Katalogdaki her ürün bir "satista" bayrağı taşır. Yalnızca satışa açık
 * (satista: true) ürünler READY olmak zorundadır; satışa kapalı ürünler
 * READY beklenmeden geçer. Bu, dosyası henüz yüklenmemiş ürünlerin
 * checkout'a düşmesini engellerken CI'ın satışa açık seti bloklamasını sağlar.
 *
 * Kullanım:
 *   node scripts/check-paid-products.mjs
 *   node scripts/check-paid-products.mjs --strict   # satışa açık ürünlerin tamamı READY zorunlu (CI gate)
 *
 * Çıkış kodları:
 *   0 = satışa açık ürünlerin tamamı READY
 *   1 = satışa açık en az bir ürün READY değil (veya yapılandırma hatası)
 *
 * Bu betik yalnızca ADMIN SDK / GCS üzerinden okur; güvenlik kapılarını
 * bypass etmez, ürün değiştirmez. Tek görevi OBJECT ABSENT ile IAM ACCESS
 * FAILURE'u birbirinden ayırarak satışa açık setin READY durumunu ölçmektir.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const strict = process.argv.includes('--strict');

const root = process.cwd();
const catalogPath = join(root, 'commerce/catalog.json');
if (!existsSync(catalogPath)) {
  console.error('catalog.json bulunamadı:', catalogPath);
  process.exit(2);
}
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const products = catalog.products || {};
const slugs = Object.keys(products).sort();

if (slugs.length === 0) {
  console.error('Katalog boş: ürün bulunamadı');
  process.exit(2);
}

let admin;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.error('firebase-admin gerekli (npm install --prefix scripts firebase-admin)');
  process.exit(2);
}
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const bucketName = process.env.STORAGE_BUCKET || 'carbon-web-1265b.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

async function fileMeta(storageKey) {
  const file = bucket.file(storageKey);
  try {
    const [exists] = await file.exists();
    if (!exists) return { ready: false, reason: 'OBJECT_MISSING' };
    const [meta] = await file.getMetadata();
    return {
      ready: true,
      size: Number(meta.size ?? 0),
      contentType: meta.contentType ?? '',
    };
  } catch (error) {
    const reason =
      error?.code === 403 || error?.code === 401
        ? 'IAM_ACCESS_FAILURE'
        : `GCS_ERROR:${error?.code ?? error?.message ?? 'UNKNOWN'}`;
    return { ready: false, reason };
  }
}

function zipOk(storageKey) {
  // Storage yalnızca metadata döner; binary yapı doğrulaması upload aracının
  // görevidir. Burada uzantı/zaman bilgisi yeterlidir.
  return /^paid-products\/[a-z0-9-]+\/current\.(xlsx|xlsm)$/.test(storageKey);
}

const rows = [];
let readyCount = 0;
let satistaSayisi = 0;
for (const slug of slugs) {
  const product = products[slug];
  const tier = catalog.tiers?.[product.tier];
  const expectedKey = `paid-products/${slug}/current.${product.fileFormat === 'xlsm' ? 'xlsm' : 'xlsx'}`;
  const meta = await fileMeta(product.storageKey);

  const keyValid = product.storageKey === expectedKey && zipOk(product.storageKey);
  const tierValid = Boolean(tier?.shopierProductId && tier?.priceTL);
  const satista = product.satista !== false; // varsayılan: satışa açık
  if (satista) satistaSayisi += 1;
  // READY yalnızca satışa açık ürünler için zorunlu.
  const ready = satista && meta.ready && meta.size > 0 && keyValid && tierValid;
  if (ready) readyCount += 1;

  rows.push({
    slug,
    storageKey: product.storageKey,
    expectedKey,
    tier: product.tier,
    priceTL: tier?.priceTL ?? null,
    shopierProductId: tier?.shopierProductId ?? null,
    satista,
    exists: meta.ready,
    size: meta.ready ? meta.size : 0,
    contentType: meta.contentType || '',
    keyValid,
    tierValid,
    ready,
    reason: meta.ready ? (meta.size > 0 ? 'OK' : 'FILE_EMPTY') : meta.reason,
  });
}

const pad = (text, width) => String(text ?? '').padEnd(width);
console.log(`${pad('SLUG', 46)} | ${pad('SATISTA', 7)} | ${pad('EXISTS', 6)} | ${pad('SIZE', 9)} | ${pad('TYPE', 8)} | ${pad('READY', 5)}`);
console.log('-'.repeat(46 + 7 + 6 + 9 + 8 + 5 + 13));
for (const row of rows) {
  console.log(
    `${pad(row.slug, 46)} | ${pad(row.satista ? 'EVET' : 'HAYIR', 7)} | ${pad(row.exists ? 'EVET' : 'HAYIR', 6)} | ${pad(row.size, 9)} | ${pad(row.contentType.slice(0, 8), 8)} | ${pad(row.ready ? 'EVET' : 'HAYIR', 5)}  ${row.reason === 'OK' ? '' : `(${row.reason})`}`,
  );
}
console.log('-'.repeat(46 + 7 + 6 + 9 + 8 + 5 + 13));
console.log(`SONUÇ: ${readyCount}/${satistaSayisi} satışa açık ürün READY`);

const failed = rows.filter((row) => row.satista && !row.ready);
if (failed.length > 0) {
  for (const row of failed) {
    console.error(`  ${row.slug}: READY=false reason=${row.reason} keyValid=${row.keyValid} tierValid=${row.tierValid}`);
  }
}
if (failed.length > 0 && strict) {
  console.error('STRICT gate: satışa açık ürünlerin tamamı READY değil → CI bloğu.');
  process.exit(1);
}
process.exit(failed.length > 0 ? 1 : 0);
