import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeeds, normalizeKeyword, parseDemandCsv } from '../../scripts/seo/demand-import.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const fixture = readFileSync(resolve(ROOT, 'tests/fixtures/seo-demand/sample.csv'), 'utf8');

const kac = {
  meta: { partial: true, coldStart: true },
  clusters: [
    { clusterId: 'cashbook-excel', primaryQuery: 'kasa defteri excel', ownerRoute: '/sablon/kasa-defteri' },
    { clusterId: 'stock-tracking-excel', primaryQuery: 'stok takip excel', ownerRoute: '/sablon/stok-takip' },
  ],
  missingSignals: ['gsc-query-impressions'],
};
const tam = {
  meta: { partial: true, coldStart: true },
  coverage: { ownedCommercialClusters: 2, totalDemandUniverse: null, coverageRatio: null },
  missingSignals: ['authenticated-gsc-query-universe', 'keyword-demand-source', 'ga4-value-series'],
};
const registry = {
  records: [
    { pageId: 'excelarsiv:kasa', route: '/sablon/kasa-defteri', type: 'product', status: 'live' },
    { pageId: 'excelarsiv:stok', route: '/sablon/stok-takip', type: 'product', status: 'live' },
  ],
};

test('B1 CSV normalize, dedupe and invalid-row rejection are deterministic', () => {
  const result = parseDemandCsv(fixture);
  assert.equal(result.rows.length, 3);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rows.find((row) => row.normalizedKeyword === 'kasa defteri excel')?.volume, 1200);
  assert.equal(normalizeKeyword('  KASA   DEFTERİ Excel '), 'kasa defteri excel');
});

test('B1 demand seed maps known owners and emits explicit content gap without INVEST score', () => {
  const parsed = parseDemandCsv(fixture);
  const seeded = buildSeeds(parsed, 'ads_keyword_planner', '2026-08-09T00:00:00.000Z', kac, tam, registry);
  assert.equal(seeded.totalVolume, 2450);
  assert.equal(seeded.mappedVolume, 2100);
  assert.equal(seeded.gaps.length, 1);
  assert.equal(seeded.gaps[0]?.primaryQuery, 'yeni özel maliyet analizi excel');
  const cashbook = seeded.kac.clusters.find((cluster) => cluster.clusterId === 'cashbook-excel');
  assert.equal(cashbook?.registryPageId, 'excelarsiv:kasa');
  assert.equal(cashbook?.observedKeywordVolumeSum, 1200);
  assert.equal(cashbook?.priorityScore, undefined);
});

test('B1 TAM seed uses only imported dataset denominator and stays provisional', () => {
  const parsed = parseDemandCsv(fixture);
  const seeded = buildSeeds(parsed, 'semrush', '2026-08-09T00:00:00.000Z', kac, tam, registry);
  assert.equal(seeded.tam.coverage.totalDemandUniverse, 2450);
  assert.equal(seeded.tam.coverage.mappedDemandVolume, 2100);
  assert.equal(seeded.tam.coverage.coverageBasis, 'imported-keyword-dataset-only');
  assert.equal(seeded.tam.coverage.provisional, true);
  assert.equal((seeded.tam.missingSignals ?? []).includes('keyword-demand-source'), false);
});
