import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLaunchCatalog } from '../../scripts/seo/launch-catalog.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
function json<T>(path: string): T { return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as T; }

test('B2 current live category+product catalog is non-empty and registry-backed', () => {
  const registry = json<{ records: Array<{ pageId:string; route:string; type:string; status:string; primaryQueryClusterId?:string|null }> }>('data/seo/registry/excelarsiv_seo_registry.json');
  const kac = json<{ clusters:Array<{ clusterId:string; primaryQuery:string; ownerRoute:string|null; contentGap?:boolean; observedKeywordVolumeSum?:number|null; suggestedRoute?:string|null }> }>('data/seo/kac/cluster_map.json');
  const committed = json<{ pages:Array<{pageId:string|null;route:string;type:string;status:string}>; counts:{categories:number;products:number;gaps:number;totalLive:number}; demandPriorityStatus:string }>('data/seo/launch_catalog.json');
  const { catalog, delta } = buildLaunchCatalog(registry, kac);

  assert.ok(registry.records.length > 0);
  assert.ok(catalog.counts.categories > 0);
  assert.ok(catalog.counts.products > 0);
  assert.equal(catalog.counts.totalLive, catalog.counts.categories + catalog.counts.products);
  assert.equal(catalog.demandPriorityStatus, 'SKIP_NO_DATA');
  assert.equal(catalog.counts.gaps, 0);
  assert.equal(delta.status, 'NO_CHANGES');
  assert.deepEqual(delta.records, []);

  const liveKey = (page:{pageId:string|null;route:string;type:string;status:string}) => `${page.type}|${page.route}|${page.pageId}|${page.status}`;
  assert.deepEqual(committed.pages.map(liveKey).sort(), catalog.pages.map(liveKey).sort());
  assert.deepEqual(committed.counts, catalog.counts);
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
