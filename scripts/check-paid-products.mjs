#!/usr/bin/env node
/**
 * PAID-PRODUCT READINESS DENETİMİ
 * Firebase Storage'daki satış dosyalarını katalog ve isteğe bağlı local delivery kaynağıyla doğrular.
 *
 * Kullanım:
 *   node scripts/check-paid-products.mjs
 *   node scripts/check-paid-products.mjs --strict
 *   node scripts/check-paid-products.mjs --strict --verify-local-parity
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const strict = process.argv.includes('--strict');
const verifyLocalParity = process.argv.includes('--verify-local-parity');

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
} catch {
  console.error('firebase-admin gerekli (npm ci --prefix scripts)');
  process.exit(2);
}
if (admin.apps.length === 0) admin.initializeApp();
const bucketName = process.env.STORAGE_BUCKET || 'carbon-web-1265b.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fileState(storageKey) {
  const file = bucket.file(storageKey);
  try {
    const [exists] = await file.exists();
    if (!exists) return { ready: false, reason: 'OBJECT_MISSING', bytes: null, size: 0, contentType: '', sha256: null };
    const [meta] = await file.getMetadata();
    let bytes = null;
    let digest = null;
    if (verifyLocalParity) {
      [bytes] = await file.download();
      digest = sha256(bytes);
    }
    return {
      ready: true,
      reason: 'OK',
      bytes,
      size: Number(meta.size ?? 0),
      contentType: meta.contentType ?? '',
      sha256: digest,
    };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    const reason = code === 403 || code === 401 ? 'IAM_ACCESS_FAILURE' : `GCS_ERROR:${String(code ?? message)}`;
    return { ready: false, reason, bytes: null, size: 0, contentType: '', sha256: null };
  }
}

function keyOk(storageKey) {
  return /^paid-products\/[a-z0-9-]+\/current\.(xlsx|xlsm)$/.test(storageKey);
}

const rows = [];
let readyCount = 0;
let satistaSayisi = 0;
for (const slug of slugs) {
  const product = products[slug];
  const tier = catalog.tiers?.[product.tier];
  const expectedKey = `paid-products/${slug}/current.${product.fileFormat === 'xlsm' ? 'xlsm' : 'xlsx'}`;
  const remote = await fileState(product.storageKey);

  const keyValid = product.storageKey === expectedKey && keyOk(product.storageKey);
  const tierValid = Boolean(tier?.shopierProductId && tier?.priceTL);
  const satista = product.satista !== false;
  if (satista) satistaSayisi += 1;

  let parity = !verifyLocalParity;
  let localSha = null;
  let parityReason = verifyLocalParity ? 'LOCAL_SOURCE_MISSING' : 'NOT_REQUESTED';
  const localPath = join(root, 'delivery', expectedKey);
  if (verifyLocalParity && existsSync(localPath)) {
    const localBytes = readFileSync(localPath);
    localSha = localBytes.length > 0 ? sha256(localBytes) : null;
    if (!localSha) {
      parityReason = 'LOCAL_SOURCE_EMPTY';
    } else if (!remote.ready || !remote.sha256) {
      parityReason = remote.reason;
    } else if (localSha !== remote.sha256) {
      parityReason = 'CONTENT_MISMATCH';
    } else if (localBytes.length !== remote.size) {
      parityReason = 'SIZE_MISMATCH';
    } else {
      parity = true;
      parityReason = 'MATCH';
    }
  }

  const ready = satista && remote.ready && remote.size > 0 && keyValid && tierValid && parity;
  if (ready) readyCount += 1;

  let reason = remote.ready ? (remote.size > 0 ? 'OK' : 'FILE_EMPTY') : remote.reason;
  if (verifyLocalParity && reason === 'OK' && !parity) reason = parityReason;

  rows.push({
    slug,
    storageKey: product.storageKey,
    expectedKey,
    tier: product.tier,
    priceTL: tier?.priceTL ?? null,
    shopierProductId: tier?.shopierProductId ?? null,
    satista,
    exists: remote.ready,
    size: remote.size,
    contentType: remote.contentType || '',
    keyValid,
    tierValid,
    parity,
    localSha,
    remoteSha: remote.sha256,
    ready,
    reason,
  });
}

const pad = (text, width) => String(text ?? '').padEnd(width);
console.log(`${pad('SLUG', 46)} | ${pad('SATISTA', 7)} | ${pad('EXISTS', 6)} | ${pad('SIZE', 9)} | ${pad('PARITY', 7)} | ${pad('READY', 5)}`);
console.log('-'.repeat(46 + 7 + 6 + 9 + 7 + 5 + 13));
for (const row of rows) {
  console.log(
    `${pad(row.slug, 46)} | ${pad(row.satista ? 'EVET' : 'HAYIR', 7)} | ${pad(row.exists ? 'EVET' : 'HAYIR', 6)} | ${pad(row.size, 9)} | ${pad(row.parity ? 'MATCH' : 'FAIL', 7)} | ${pad(row.ready ? 'EVET' : 'HAYIR', 5)}  ${row.reason === 'OK' ? '' : `(${row.reason})`}`,
  );
}
console.log('-'.repeat(46 + 7 + 6 + 9 + 7 + 5 + 13));
console.log(`SONUÇ: ${readyCount}/${satistaSayisi} satışa açık ürün READY${verifyLocalParity ? ' + SHA-256 PARITY' : ''}`);

const failed = rows.filter((row) => row.satista && !row.ready);
if (failed.length > 0) {
  for (const row of failed) {
    console.error(`  ${row.slug}: READY=false reason=${row.reason} keyValid=${row.keyValid} tierValid=${row.tierValid} parity=${row.parity}`);
    if (verifyLocalParity && row.localSha && row.remoteSha) console.error(`    local=${row.localSha} remote=${row.remoteSha}`);
  }
}
if (failed.length > 0 && strict) {
  console.error('STRICT gate: satışa açık ürünlerin tamamı READY/parity değil → CI bloğu.');
  process.exit(1);
}
process.exit(failed.length > 0 ? 1 : 0);
