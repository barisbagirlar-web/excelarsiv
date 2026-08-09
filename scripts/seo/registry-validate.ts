import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });
const MONEY_FIELDS = ['conversionValueMinor','firstTouchValueMinor','ltv12ValueMinor','assistedValueMinor','aiReferralValueMinor','productionCostMinor'] as const;

type JsonRecord = Record<string, unknown>;
type Registry = { meta: JsonRecord; mode: string; source: JsonRecord; recordDefaults: JsonRecord; records: JsonRecord[] };

function readRegistry(site: string): Registry {
  return JSON.parse(readFileSync(resolve(ROOT, `data/seo/registry/${site}_seo_registry.json`), 'utf8')) as Registry;
}
function materialize(registry: Registry): JsonRecord[] {
  return registry.records.map((record) => ({ ...registry.recordDefaults, ...record }));
}
function canonicalFor(route: string): string {
  return `https://excelarsiv.com${route === '/' ? '' : route}`;
}
function validateRecords(records: JsonRecord[], sitemapRoutes: Set<string> | null = null): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const routes = new Set<string>();
  const canonicals = new Set<string>();
  for (const record of records) {
    const id = typeof record.pageId === 'string' ? record.pageId : '';
    const route = typeof record.route === 'string' ? record.route : '';
    const canonical = typeof record.canonical === 'string' ? record.canonical : '';
    const status = typeof record.status === 'string' ? record.status : '';
    if (!id || ids.has(id)) errors.push(`INV-1.1 pageId duplicate/empty: ${id}`); else ids.add(id);
    if (!route.startsWith('/') || routes.has(route)) errors.push(`INV-1.1 route duplicate/invalid: ${route}`); else routes.add(route);
    if (!canonical || canonicals.has(canonical)) errors.push(`INV-1.1 canonical duplicate/empty: ${canonical}`); else canonicals.add(canonical);
    if (status === 'live' && canonical !== canonicalFor(route)) errors.push(`INV-1.1 canonical mismatch: ${route}`);
    const cluster = record.primaryQueryClusterId;
    if (cluster !== null && cluster !== undefined) {
      if (typeof cluster !== 'string' || cluster.length === 0) errors.push(`INV-1.3 cluster invalid: ${route}`);
      if (record.ownerRoute !== route) errors.push(`INV-1.3 ownerRoute mismatch: ${route}`);
      const clusters = Array.isArray(record.queryClusterIds) ? record.queryClusterIds : [];
      if (!clusters.includes(cluster)) errors.push(`INV-1.3 primary cluster absent from queryClusterIds: ${route}`);
    }
    for (const key of MONEY_FIELDS) {
      const value = record[key];
      if (value !== null && value !== undefined && (!Number.isInteger(value) || typeof value !== 'number')) errors.push(`INV-1.2 ${key} integer değil: ${route}`);
    }
    if (status === 'retired' && sitemapRoutes?.has(route)) errors.push(`INV-1.5 retired sitemap içinde: ${route}`);
  }
  return errors;
}
function fixture(name: string, registry: Registry): { records: JsonRecord[]; sitemapRoutes: Set<string> | null; unauthorized: boolean } {
  const records = materialize(registry).map((record) => ({ ...record }));
  const first = records[0];
  if (!first) throw new Error('EMPTY_REGISTRY');
  if (name === 'duplicate') records.push({ ...first });
  else if (name === 'float-money') first.conversionValueMinor = 1.5;
  else if (name === 'cluster-owner') { first.primaryQueryClusterId = 'fixture-cluster'; first.queryClusterIds = ['fixture-cluster']; first.ownerRoute = null; }
  else if (name === 'retired-sitemap') { first.status = 'retired'; return { records, sitemapRoutes: new Set([String(first.route)]), unauthorized: false }; }
  else if (name === 'unauthorized-writer') return { records, sitemapRoutes: null, unauthorized: true };
  else if (name !== 'none') throw new Error(`UNKNOWN_FIXTURE:${name}`);
  return { records, sitemapRoutes: null, unauthorized: false };
}
function parseArg(name: string): string | undefined { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function main(): void {
  const site = parseArg('--site') ?? process.env.SITE_ID;
  if (!site) process.exit(EXIT.CONFIG);
  try {
    const registry = readRegistry(site);
    if (registry.meta.siteId !== site) throw new Error('SITE_ID_MISMATCH');
    const fx = fixture(parseArg('--fixture') ?? 'none', registry);
    const errors = fx.unauthorized ? ['INV-1.7 registry writer phase1 dışı'] : validateRecords(fx.records, fx.sitemapRoutes);
    if (errors.length) { console.error(errors.join('\n')); process.exit(EXIT.BLOCK); }
    console.log(`SEO REGISTRY PASS — ${fx.records.length} kayıt — ${site}`);
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
export { materialize, validateRecords };
