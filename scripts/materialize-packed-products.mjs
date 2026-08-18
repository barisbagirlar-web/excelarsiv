#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const paidRoot = join(root, 'delivery', 'paid-products');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function findManifests() {
  if (!existsSync(paidRoot)) return [];
  const manifests = [];
  for (const slug of readdirSync(paidRoot)) {
    const productDir = join(paidRoot, slug);
    if (!statSync(productDir).isDirectory()) continue;
    const manifest = join(productDir, 'packed', 'manifest.json');
    if (existsSync(manifest)) manifests.push(manifest);
  }
  return manifests.sort();
}

function materialize(manifestPath) {
  const manifestDir = dirname(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error(`${manifestPath}: assets listesi eksik.`);
  }

  for (const asset of manifest.assets) {
    const prefix = String(asset.partPrefix ?? '');
    const target = String(asset.target ?? '');
    const expectedSha256 = String(asset.sha256 ?? '').toLowerCase();
    const expectedBytes = Number(asset.bytes);
    if (!prefix || !target || !/^[0-9a-f]{64}$/.test(expectedSha256) || !Number.isSafeInteger(expectedBytes) || expectedBytes <= 0) {
      throw new Error(`${manifestPath}: geçersiz asset sözleşmesi.`);
    }
    if (target.includes('..') || target.startsWith('/') || target.startsWith('\\')) {
      throw new Error(`${manifestPath}: güvenli olmayan target: ${target}`);
    }

    const parts = readdirSync(manifestDir)
      .filter((name) => name.startsWith(prefix) && /^\d{2}$/.test(name.slice(prefix.length)))
      .sort();
    if (parts.length === 0) throw new Error(`${manifestPath}: ${prefix} parçaları bulunamadı.`);

    const encoded = parts.map((name) => readFileSync(join(manifestDir, name), 'utf8').trim()).join('');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error(`${manifestPath}: ${prefix} base64 geçersiz.`);
    const buffer = Buffer.from(encoded, 'base64');
    const actualSha256 = sha256(buffer);
    if (buffer.length !== expectedBytes || actualSha256 !== expectedSha256) {
      throw new Error(
        `${manifestPath}: ${target} bütünlük hatası; bytes ${buffer.length}/${expectedBytes}, sha256 ${actualSha256}/${expectedSha256}.`,
      );
    }

    const targetPath = resolve(root, target);
    if (!targetPath.startsWith(`${resolve(root)}${process.platform === 'win32' ? '\\' : '/'}`)) {
      throw new Error(`${manifestPath}: target repo dışına çıkıyor: ${target}`);
    }
    mkdirSync(dirname(targetPath), { recursive: true });
    const existing = existsSync(targetPath) ? readFileSync(targetPath) : null;
    if (!existing || sha256(existing) !== expectedSha256) writeFileSync(targetPath, buffer);
    console.log(`MATERIALIZED ${target} · ${buffer.length} bytes · ${expectedSha256}`);
  }
}

const manifests = findManifests();
for (const manifest of manifests) materialize(manifest);
console.log(`Packed delivery materializer OK: ${manifests.length} manifest.`);
