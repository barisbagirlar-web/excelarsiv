#!/usr/bin/env node
/**
 * CycloneDX benzeri SBOM iskeleti — package-lock bağımlılık envanteri.
 * Çıktı: sbom/site-cyclonedx.json + sbom/functions-cyclonedx.json
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const OUT_DIR = resolve(ROOT, 'sbom');

function readLock(path) {
  if (!existsSync(path)) throw new Error(`LOCK_YOK: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function componentsFromLock(lock, scope) {
  const packages = lock.packages ?? {};
  const components = [];
  for (const [key, meta] of Object.entries(packages)) {
    if (!key || key === '') continue;
    const name = key.replace(/^node_modules\//, '').replace(/\/node_modules\//g, ' > ');
    if (!meta?.version) continue;
    components.push({
      type: 'library',
      name,
      version: meta.version,
      scope: meta.dev ? 'optional' : 'required',
      purl: `pkg:npm/${encodeURIComponent(name.split(' > ').at(-1))}@${meta.version}`,
      hashes: meta.integrity
        ? [{ alg: 'SHA-512', content: String(meta.integrity).replace(/^sha512-/, '') }]
        : undefined,
      properties: [{ name: 'excelarsiv:lock-scope', value: scope }],
    });
  }
  return components.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

function buildBom(lockPath, scope, name) {
  const lock = readLock(lockPath);
  const components = componentsFromLock(lock, scope);
  const bom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${createHash('sha256').update(`${scope}:${lock.lockfileVersion}:${components.length}`).digest('hex').slice(0, 32)}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: 'Excel Arşiv', name: 'generate-sbom.mjs', version: '1.0.0' }],
      component: { type: 'application', name, version: lock.version ?? '0.0.0' },
    },
    components,
  };
  return bom;
}

mkdirSync(OUT_DIR, { recursive: true });
const siteBom = buildBom(resolve(ROOT, 'package-lock.json'), 'site', 'excel-arsiv');
const fnBom = buildBom(resolve(ROOT, 'functions/package-lock.json'), 'functions', 'excel-arsiv-functions');
writeFileSync(resolve(OUT_DIR, 'site-cyclonedx.json'), JSON.stringify(siteBom, null, 2));
writeFileSync(resolve(OUT_DIR, 'functions-cyclonedx.json'), JSON.stringify(fnBom, null, 2));
console.log(`SBOM OK — site=${siteBom.components.length} bileşen, functions=${fnBom.components.length} bileşen → sbom/`);
