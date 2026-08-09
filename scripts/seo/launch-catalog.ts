import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, MISSING_DATA: 3, CONFIG: 4 });

type RegistryRecord = {
  pageId: string;
  route: string;
  type: string;
  status: string;
  primaryQueryClusterId?: string | null;
  primaryEntity?: string | null;
  templateId?: string | null;
};
type Registry = { records: RegistryRecord[] };
type KacCluster = {
  clusterId: string;
  primaryQuery: string;
  ownerRoute: string | null;
  contentGap?: boolean;
  observedKeywordVolumeSum?: number | null;
  suggestedRoute?: string | null;
};
type Kac = { clusters: KacCluster[]; contentGaps?: Array<Record<string, unknown>>; demandSource?: Record<string, unknown> };
type LaunchPage = {
  pageId: string | null;
  route: string;
  type: 'category' | 'product' | 'draft-gap';
  status: 'live' | 'draft';
  clusterId: string | null;
  primaryQuery: string | null;
  observedKeywordVolume: number | null;
  demandRank: number | null;
};

type LaunchCatalog = {
  meta: { artifact: 'launch_catalog'; schemaVersion: string; siteId: 'excelarsiv'; partial: boolean; confidence: 'low' };
  status: 'BASELINE_READY' | 'DEMAND_PRIORITIZED';
  demandPriorityStatus: 'SKIP_NO_DATA' | 'AVAILABLE';
  selectionRule: string;
  pages: LaunchPage[];
  contentGaps: LaunchPage[];
  counts: { categories: number; products: number; gaps: number; totalLive: number };
};
type RegistryDelta = { status: 'NO_CHANGES' | 'PROPOSED'; writerContract: 'faz-01'; records: Array<Record<string, unknown>> };

function buildLaunchCatalog(registry: Registry, kac: Kac, limit?: number): { catalog: LaunchCatalog; delta: RegistryDelta } {
  const live = registry.records.filter((record) => record.status === 'live');
  const categories = live.filter((record) => record.type === 'category').sort((a, b) => a.route.localeCompare(b.route));
  const products = live.filter((record) => record.type === 'product');
  const clusterById = new Map(kac.clusters.map((cluster) => [cluster.clusterId, cluster]));
  const ownerByRoute = new Map(kac.clusters.filter((cluster) => cluster.ownerRoute).map((cluster) => [cluster.ownerRoute as string, cluster]));
  const hasDemand = products.some((record) => {
    const cluster = record.primaryQueryClusterId ? clusterById.get(record.primaryQueryClusterId) : ownerByRoute.get(record.route);
    return typeof cluster?.observedKeywordVolumeSum === 'number';
  });

  const rankedProducts = products.map((record) => {
    const cluster = record.primaryQueryClusterId ? clusterById.get(record.primaryQueryClusterId) : ownerByRoute.get(record.route);
    return { record, cluster, volume: typeof cluster?.observedKeywordVolumeSum === 'number' ? cluster.observedKeywordVolumeSum : null };
  }).sort((a, b) => {
    if (hasDemand) return (b.volume ?? -1) - (a.volume ?? -1) || a.record.route.localeCompare(b.record.route);
    return a.record.route.localeCompare(b.record.route);
  });

  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) throw new Error('INVALID_LIMIT');
  const selected = limit === undefined ? rankedProducts : rankedProducts.slice(0, limit);
  const productPages: LaunchPage[] = selected.map(({ record, cluster, volume }, index) => ({
    pageId: record.pageId,
    route: record.route,
    type: 'product',
    status: 'live',
    clusterId: record.primaryQueryClusterId ?? cluster?.clusterId ?? null,
    primaryQuery: cluster?.primaryQuery ?? null,
    observedKeywordVolume: volume,
    demandRank: hasDemand ? index + 1 : null,
  }));
  const categoryPages: LaunchPage[] = categories.map((record) => ({
    pageId: record.pageId,
    route: record.route,
    type: 'category',
    status: 'live',
    clusterId: record.primaryQueryClusterId ?? null,
    primaryQuery: null,
    observedKeywordVolume: null,
    demandRank: null,
  }));

  const registryRoutes = new Set(registry.records.map((record) => record.route));
  const gapClusters = kac.clusters.filter((cluster) => cluster.contentGap === true && cluster.ownerRoute === null);
  const contentGaps: LaunchPage[] = gapClusters.map((cluster) => ({
    pageId: null,
    route: cluster.suggestedRoute ?? '',
    type: 'draft-gap',
    status: 'draft',
    clusterId: cluster.clusterId,
    primaryQuery: cluster.primaryQuery,
    observedKeywordVolume: typeof cluster.observedKeywordVolumeSum === 'number' ? cluster.observedKeywordVolumeSum : null,
    demandRank: null,
  })).filter((page) => page.route.startsWith('/') && !registryRoutes.has(page.route));

  const deltaRecords = contentGaps.map((page) => ({
    route: page.route,
    type: 'product',
    status: 'draft',
    primaryQueryClusterId: page.clusterId,
    primaryQuery: page.primaryQuery,
    source: 'launch-catalog-content-gap',
  }));

  const catalog: LaunchCatalog = {
    meta: { artifact: 'launch_catalog', schemaVersion: '6.0-wave2-b2', siteId: 'excelarsiv', partial: !hasDemand, confidence: 'low' },
    status: hasDemand ? 'DEMAND_PRIORITIZED' : 'BASELINE_READY',
    demandPriorityStatus: hasDemand ? 'AVAILABLE' : 'SKIP_NO_DATA',
    selectionRule: hasDemand ? 'observed-imported-keyword-volume-desc' : 'all-live-categories-and-products; no volume claim',
    pages: [...categoryPages, ...productPages],
    contentGaps,
    counts: { categories: categoryPages.length, products: productPages.length, gaps: contentGaps.length, totalLive: categoryPages.length + productPages.length },
  };
  const delta: RegistryDelta = { status: deltaRecords.length ? 'PROPOSED' : 'NO_CHANGES', writerContract: 'faz-01', records: deltaRecords };
  return { catalog, delta };
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main(): void {
  try {
    const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
    const kac = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/kac/cluster_map.json'), 'utf8')) as Kac;
    const limitArg = arg('--limit');
    const limit = limitArg === undefined ? undefined : Number(limitArg);
    const { catalog, delta } = buildLaunchCatalog(registry, kac, limit);
    console.log(`LAUNCH CATALOG status=${catalog.status} demand=${catalog.demandPriorityStatus}`);
    console.log(`CATALOG categories=${catalog.counts.categories} products=${catalog.counts.products} gaps=${catalog.counts.gaps} live=${catalog.counts.totalLive}`);
    for (const page of catalog.pages) console.log(`PAGE ${page.type} ${page.route} pageId=${page.pageId ?? 'null'} volume=${page.observedKeywordVolume ?? 'null'}`);
    for (const gap of catalog.contentGaps) console.log(`GAP ${gap.primaryQuery ?? 'unknown'} -> ${gap.route}`);
    console.log(`REGISTRY DELTA ${delta.status} records=${delta.records.length} writer=${delta.writerContract}`);

    if (process.argv.includes('--write')) {
      writeFileSync(resolve(ROOT, 'data/seo/launch_catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
      writeFileSync(resolve(ROOT, 'data/seo/registry_delta.json'), `${JSON.stringify(delta, null, 2)}\n`, 'utf8');
      console.log('LAUNCH CATALOG WRITE PASS');
    } else {
      console.log('DRY_RUN PASS — registry ve runtime yazılmadı');
    }
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EXIT, buildLaunchCatalog };
