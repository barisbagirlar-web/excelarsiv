#!/usr/bin/env node
/**
 * PRIVATE PAID-PRODUCT SYNC
 * delivery/paid-products/<slug>/current.* -> Firebase Storage paid-products/<slug>/current.*
 *
 * Varsayılan mod read-only'dir. Yazma yalnız --apply ile yapılır.
 * Başarı ölçütü: satışa açık katalog setinde local ve remote binary SHA-256 birebir eşit.
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const APPLY = process.argv.includes('--apply');
const root = process.cwd();
const catalogPath = join(root, 'commerce/catalog.json');
const deliveryRoot = join(root, 'delivery');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function expectedStorageKey(slug, product) {
  const extension = product.fileFormat === 'xlsm' ? 'xlsm' : 'xlsx';
  return `paid-products/${slug}/current.${extension}`;
}

function validateBinary(buffer, storageKey) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error(`${storageKey}: local dosya boş`);
  const signature = buffer.length >= 4 ? buffer.readUInt32LE(0) : 0;
  const isZip = signature === 0x04034b50 || signature === 0x06054b50 || signature === 0x08074b50;
  if (!isZip) throw new Error(`${storageKey}: geçerli OOXML/ZIP başlığı yok`);
}

async function remoteState(file) {
  const [exists] = await file.exists();
  if (!exists) return { exists: false, bytes: null, sha: null, metadata: null };
  const [bytes] = await file.download();
  const [metadata] = await file.getMetadata();
  return { exists: true, bytes, sha: sha256(bytes), metadata };
}

if (!existsSync(catalogPath)) throw new Error(`catalog yok: ${catalogPath}`);
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const products = catalog.products ?? {};
const slugs = Object.keys(products).sort();
if (slugs.length === 0) throw new Error('katalog boş');

let admin;
try {
  admin = require('firebase-admin');
} catch {
  throw new Error('firebase-admin gerekli: npm ci --prefix scripts');
}
if (admin.apps.length === 0) admin.initializeApp();
const bucketName = process.env.STORAGE_BUCKET || 'carbon-web-1265b.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

let uploaded = 0;
let unchanged = 0;
let skippedClosed = 0;
const failures = [];

for (const slug of slugs) {
  const product = products[slug];
  const satista = product.satista !== false;
  if (!satista) {
    skippedClosed += 1;
    console.log(`SKIP CLOSED: ${slug}`);
    continue;
  }

  try {
    const expectedKey = expectedStorageKey(slug, product);
    if (product.storageKey !== expectedKey) throw new Error(`storageKey ${product.storageKey} != ${expectedKey}`);
    if (!/^paid-products\/[a-z0-9-]+\/current\.(xlsx|xlsm)$/.test(expectedKey)) throw new Error(`storageKey standard dışı: ${expectedKey}`);

    const localPath = join(deliveryRoot, expectedKey);
    if (!existsSync(localPath)) throw new Error(`local kaynak yok: ${localPath}`);
    const stat = statSync(localPath);
    if (!stat.isFile() || stat.size === 0) throw new Error(`local kaynak boş/geçersiz: ${localPath}`);
    const localBytes = readFileSync(localPath);
    validateBinary(localBytes, expectedKey);
    const localSha = sha256(localBytes);

    const file = bucket.file(expectedKey);
    let remote = await remoteState(file);
    if (remote.exists && remote.sha === localSha) {
      unchanged += 1;
      console.log(`UNCHANGED: ${slug} sha256=${localSha}`);
      continue;
    }

    const prior = remote.exists ? `remote=${remote.sha}` : 'remote=MISSING';
    if (!APPLY) {
      failures.push(`${slug}: CONTENT_MISMATCH ${prior} local=${localSha}`);
      console.error(`DRY-RUN MISMATCH: ${slug} ${prior} local=${localSha}`);
      continue;
    }

    const mime = expectedKey.endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel.sheet.macroEnabled.12';
    await file.save(localBytes, {
      resumable: false,
      contentType: mime,
      metadata: {
        contentDisposition: 'attachment',
        cacheControl: 'private, max-age=0',
        metadata: {
          sourceSha256: localSha,
          sourceCommit: process.env.GITHUB_SHA ?? 'manual',
        },
      },
    });

    remote = await remoteState(file);
    if (!remote.exists || remote.sha !== localSha || remote.bytes?.length !== localBytes.length) {
      throw new Error(`post-upload parity başarısız local=${localSha} remote=${remote.sha ?? 'MISSING'}`);
    }
    uploaded += 1;
    console.log(`SYNCED: ${slug} sha256=${localSha} bytes=${localBytes.length}`);
  } catch (error) {
    failures.push(`${slug}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`PAID PRODUCT SYNC — mode=${APPLY ? 'APPLY' : 'DRY_RUN'} uploaded=${uploaded} unchanged=${unchanged} closed=${skippedClosed} failures=${failures.length}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
process.exit(0);
