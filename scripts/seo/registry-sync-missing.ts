#!/usr/bin/env node
/**
 * Registry parity sync — source’taki indexlenebilir route’ları registry’ye ekler.
 * node --experimental-strip-types scripts/seo/registry-sync-missing.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registryParity, sourceIndexableRoutes } from './registry-source-parity.ts';

const ROOT = resolve(process.cwd());
const path = resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json');
const registry = JSON.parse(readFileSync(path, 'utf8'));
const { missing } = registryParity(registry, sourceIndexableRoutes());

function typeFor(route) {
  if (route === '/') return 'home';
  if (route.startsWith('/sablon/')) return 'product';
  if (route.startsWith('/rehber/')) return 'guide';
  if (route.startsWith('/demo/')) return 'landing';
  if (route.startsWith('/hesaplayici/')) return 'landing';
  if (route.startsWith('/sektor/')) return 'landing';
  if (route === '/basari-hikayeleri') return 'landing';
  if (route.startsWith('/sablonlar')) return 'category';
  return 'legal';
}

for (const route of missing) {
  const pageId = `excelarsiv:${route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, ':')}`;
  registry.records.push({
    pageId,
    route,
    type: typeFor(route),
    status: 'live',
    primaryQueryClusterId: null,
    primaryEntity: route,
    searchIntent: route.startsWith('/demo/') || route.startsWith('/hesaplayici/') ? 'informational' : null,
    templateId: null,
    serpFeatureTargets: [],
    canonical: `https://excelarsiv.com${route === '/' ? '' : route}`,
    ownerRoute: null,
    notes: 'Registry parity sync — otomatik eklendi.',
  });
}

registry.records.sort((a, b) => String(a.route).localeCompare(String(b.route), 'tr'));
registry.source = {
  ...registry.source,
  builtIndexableUrlCount: sourceIndexableRoutes().length,
};
writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`REGISTRY SYNC — eklendi=${missing.length}; toplam live=${registry.records.filter((r) => r.status === 'live').length}`);
