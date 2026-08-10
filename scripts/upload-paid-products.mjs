#!/usr/bin/env node
/**
 * PAID-PRODUCT UPLOAD ARACI
 * Yalnızca private Firebase Storage'a (paid-products/<slug>/current.*) yazar.
 *
 * Kullanım:
 *   node scripts/upload-paid-products.mjs --slug <slug> --file <xlsx-yolu>
 *
 * Sevk öncesi zorunlu kontroller:
 *   - dosya gerçekten var ve > 0 byte
 *   - xlsx/xlsm → geçerli OOXML ZIP paketi
 *   - slug katalogda var; storageKey standarda uygun; extension eşleşiyor
 *   - dosya adı/İçerik demo olduğunu ima ediyorsa reddet
 *   - hedef yalnız private paid-products/ altıdır
 */
import { readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const slug = arg('slug');
const filePath = arg('file');
if (!slug || !filePath) {
  console.error('Kullanım: node scripts/upload-paid-products.mjs --slug <slug> --file <xlsx|xlsm>');
  process.exit(2);
}

const root = process.cwd();
const catalog = JSON.parse(readFileSync(join(root, 'commerce/catalog.json'), 'utf8'));
const product = catalog.products?.[slug];
if (!product) {
  console.error(`Katalogda ürün yok: ${slug}`);
  process.exit(2);
}

const expectedKey = `paid-products/${slug}/current.${product.fileFormat === 'xlsm' ? 'xlsm' : 'xlsx'}`;
if (product.storageKey !== expectedKey) {
  console.error(`storageKey tutarsız: ${product.storageKey} beklenen ${expectedKey}`);
  process.exit(2);
}
if (!/^paid-products\/[a-z0-9-]+\/current\.(xlsx|xlsm)$/.test(expectedKey)) {
  console.error(`storageKey standarda uymuyor: ${expectedKey}`);
  process.exit(2);
}

if (!existsSync(filePath)) {
  console.error(`Dosya yok: ${filePath}`);
  process.exit(2);
}
const stat = statSync(filePath);
if (stat.size === 0) {
  console.error('Dosya 0 byte — boş dosya sevk edilemez.');
  process.exit(2);
}

const base = basename(filePath).toLowerCase();
if (base.includes('demo')) {
  console.error('Demo dosyası ücretli ürün olarak sevk edilemez.');
  process.exit(2);
}
const expectedExtension = product.fileFormat === 'xlsm' ? '.xlsm' : '.xlsx';
if (!filePath.toLowerCase().endsWith(expectedExtension)) {
  console.error(`Uzantı uyuşmazlığı: katalog ${expectedExtension} istiyor, dosya ${basename(filePath)}`);
  process.exit(2);
}

// XLSX ve XLSM aynı OOXML/ZIP paket ailesindedir.
const handle = readFileSync(filePath);
const signature = handle.length >= 4 ? handle.readUInt32LE(0) : 0;
const isZip = signature === 0x04034b50 || signature === 0x06054b50 || signature === 0x08074b50;
if (!isZip) {
  console.error('Dosya geçerli bir OOXML Excel (ZIP) paketi değil.');
  process.exit(2);
}

let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('firebase-admin gerekli (npm ci --prefix scripts)');
  process.exit(2);
}
if (admin.apps.length === 0) admin.initializeApp();
const bucketName = process.env.STORAGE_BUCKET || 'carbon-web-1265b.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);
const file = bucket.file(expectedKey);

const mime = expectedKey.endsWith('.xlsx')
  ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  : 'application/vnd.ms-excel.sheet.macroEnabled.12';

console.log(`Yükleniyor: ${basename(filePath)} → ${expectedKey} (${(stat.size / 1024).toFixed(1)} KB)`);
await file.save(handle, {
  contentType: mime,
  metadata: { contentDisposition: 'attachment', cacheControl: 'private, max-age=0' },
  resumable: true,
});

const [meta] = await file.getMetadata();
if (Number(meta.size) !== stat.size) {
  console.error('Yükleme boyutu eşleşmedi — dosya tutarsız.');
  process.exit(1);
}
console.log(`OK: ${slug} READY → ${expectedKey} (${meta.size} byte, ${meta.contentType})`);
