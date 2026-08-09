import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLaunchCatalog, validateLaunchCatalogPolicy } from '../../scripts/seo/launch-catalog.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
function json<T>(path: string): T { return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as T; }

test('B2 launch policy uses registry as single source and forbids mutable page snapshots', () => {
  const policy = json<Record<string, unknown>>('data/seo/launch_catalog.json');
  assert.deepEqual(validateLaunchCatalogPolicy(policy as never), []);
  assert.equal(policy.sourceOfTruth, 'data/seo/registry/excelarsiv_seo_registry.json');
  assert.equal(policy.selectionMode, 'all-live-registry');
  assert.equal(policy.snapshotPolicy, 'computed-at-runtime');
  assert.equal(policy.automaticPublish, false);
  assert.equal('pages' in policy, false);
  assert.equal('counts' in policy, false);
});

test('B2 current live category+product catalog is derived from registry and non-empty', () => {
  const registry = json<{ records: Array<{ pageId:string; route:string; type:string; status:string; primaryQueryClusterId?:string|null }> }>('data/seo/registry/excelarsiv_seo_registry.json');
  const kac = json<{ clusters:Array<{ clusterId:string; primaryQuery:string; ownerRoute:string|null; contentGap?:boolean; observedKeywordVolumeSum?:number|null; suggestedRoute?:string|null }> }>('data/seo/kac/cluster_map.json');
  const { catalog, delta } = buildLaunchCatalog(registry, kac);
  const expectedCategories = registry.records.filter((record) => record.status === 'live' && record.type === 'category').length;
  const expectedProducts = registry.records.filter((record) => record.status === 'live' && record.type === 'product').length;

  assert.ok(registry.records.length > 0);
  assert.ok(catalog.counts.categories > 0);
  assert.ok(catalog.counts.products > 0);
  assert.equal(catalog.counts.categories, expectedCategories);
  assert.equal(catalog.counts.products, expectedProducts);
  assert.equal(catalog.counts.totalLive, expectedCategories + expectedProducts);
  assert.equal(catalog.sourceOfTruth, 'data/seo/registry/excelarsiv_seo_registry.json');
  assert.ok(['SKIP_NO_DATA', 'AVAILABLE'].includes(catalog.demandPriorityStatus));
  assert.equal(delta.writerContract, 'faz-01');
});

test('B2 content gap can only produce draft registry delta, never direct live registry mutation', () => {
  const registry = { records: [{ pageId:'p1', route:'/sablonlar', type:'category', status:'live', primaryQueryClusterId:'root' }] };
  const kac = { clusters: [{ clusterId:'gap-x', primaryQuery:'özel analiz excel', ownerRoute:null, contentGap:true, observedKeywordVolumeSum:100, suggestedRoute:'/sablon/ozel-analiz-excel' }] };
  const { catalog, delta } = buildLaunchCatalog(registry, kac);
  assert.equal(catalog.contentGaps.length, 1);
  assert.equal(catalog.contentGaps[0]?.status, 'draft');
  assert.equal(delta.writerContract, 'faz-01');
  assert.equal(delta.records.length, 1);
  assert.equal(delta.records[0]?.status, 'draft');
});

test('B2 policy fixture rejects duplicated mutable page snapshots', () => {
  const bad = {
    meta: { artifact:'launch_catalog_policy', schemaVersion:'x', siteId:'excelarsiv', partial:false, confidence:'high' },
    sourceOfTruth:'data/seo/registry/excelarsiv_seo_registry.json',
    selectionMode:'all-live-registry',
    snapshotPolicy:'computed-at-runtime',
    demandRankingSource:'data/seo/kac/cluster_map.json',
    demandFallback:'no-volume-claim',
    contentGapPolicy:'draft-only-faz1-delta',
    registryWriterContract:'faz-01',
    automaticPublish:false,
    pages:[],
  };
  assert.ok(validateLaunchCatalogPolicy(bad).includes('POLICY_MUTABLE_SNAPSHOT_FORBIDDEN'));
});
