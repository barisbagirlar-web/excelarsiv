import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DIST = resolve(ROOT, 'dist');
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, MISSING_DATA: 3, CONFIG: 4 });
const PRODUCTION_ORIGIN = 'https://excelarsiv.com';

type RegistryRecord = { pageId: string; route: string; status: string; canonical?: string; type: string };
type Registry = { records: RegistryRecord[] };
type Thresholds = { lcpP75Ms: number; inpP75Ms: number; clsP75: number };
type HttpSnapshot = { status: number; url: string; text: string };
type LighthouseReport = { requestedUrl?: string; finalUrl?: string; audits?: Record<string, { numericValue?: number; scoreDisplayMode?: string }> };
type InpLab = { url?: string; inpLabMs?: number | null; eventCount?: number; interaction?: string; measurementMode?: string; confidence?: string };
type MetricProof = { url: string; lcpMs: number; cls: number; lcpBudgetMs: number; clsBudget: number; pass: boolean };
type StagingProof = {
  meta: {
    artifact: 'staging_proof';
    schemaVersion: string;
    generatedAt: string;
    generatorScript: string;
    confidence: 'strong-lab-not-field';
    partial: false;
    siteId: 'excelarsiv';
    structuralBreaksApplied: string[];
  };
  stagingUrl: string;
  status: 'PASS';
  renderParity: { checked: number; failures: string[] };
  lighthouse: { reports: MetricProof[]; inpLabMs: number; inpBudgetMs: number; inpEventCount: number; inpMeasurementMode: string; fieldDataClaimed: false };
  sitemap: { rootType: 'sitemapindex'; children: number; urls: number; registryUrls: number; failures: string[] };
  notFound: { route: string; status: number; soft404: false };
};

function normalizeRoute(value: string): string {
  const url = new URL(value, PRODUCTION_ORIGIN);
  let route = url.pathname.replace(/\/{2,}/g, '/');
  if (route.length > 1) route = route.replace(/\/$/, '');
  return route || '/';
}

function normalizeCanonical(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, `${PRODUCTION_ORIGIN}/`);
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
}

function extractTagText(html: string, tag: 'title' | 'h1'): string | null {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ? normalizeText(match[1]) : null;
}

function extractCanonical(html: string): string | null {
  const match = html.match(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*canonical[^"']*["'])(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*>/i)
    ?? html.match(/<link\b(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])(?=[^>]*\brel\s*=\s*["'][^"']*canonical[^"']*["'])[^>]*>/i);
  return match?.[1] ?? null;
}

function isNoindex(html: string): boolean {
  const meta = html.match(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])(?=[^>]*\bcontent\s*=\s*["']([^"']+)["'])[^>]*>/i)
    ?? html.match(/<meta\b(?=[^>]*\bcontent\s*=\s*["']([^"']+)["'])(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i);
  return meta?.[1]?.toLowerCase().split(/[\s,]+/).includes('noindex') ?? false;
}

function distHtmlPath(route: string): string {
  const normalized = normalizeRoute(route);
  return normalized === '/' ? resolve(DIST, 'index.html') : resolve(DIST, normalized.slice(1), 'index.html');
}

function parseSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1]?.trim()).filter((value): value is string => Boolean(value));
}

function setDiff(expected: Iterable<string>, actual: Iterable<string>): { missing: string[]; extra: string[] } {
  const left = new Set(expected);
  const right = new Set(actual);
  return {
    missing: [...left].filter((value) => !right.has(value)).sort(),
    extra: [...right].filter((value) => !left.has(value)).sort(),
  };
}

function evaluateLighthouseReport(report: LighthouseReport, thresholds: Thresholds): MetricProof {
  const lcp = report.audits?.['largest-contentful-paint']?.numericValue;
  const cls = report.audits?.['cumulative-layout-shift']?.numericValue;
  if (typeof lcp !== 'number' || !Number.isFinite(lcp)) throw new Error('LIGHTHOUSE_LCP_MISSING');
  if (typeof cls !== 'number' || !Number.isFinite(cls)) throw new Error('LIGHTHOUSE_CLS_MISSING');
  const url = report.finalUrl ?? report.requestedUrl ?? 'unknown';
  return { url, lcpMs: lcp, cls, lcpBudgetMs: thresholds.lcpP75Ms, clsBudget: thresholds.clsP75, pass: lcp <= thresholds.lcpP75Ms && cls <= thresholds.clsP75 };
}

function evaluateInpLab(inp: InpLab, thresholds: Thresholds): { inpLabMs: number; inpBudgetMs: number; inpEventCount: number; inpMeasurementMode: string; pass: boolean } {
  if (typeof inp.inpLabMs !== 'number' || !Number.isFinite(inp.inpLabMs) || inp.inpLabMs < 0) throw new Error('INP_LAB_MISSING');
  const count = typeof inp.eventCount === 'number' && Number.isInteger(inp.eventCount) && inp.eventCount >= 0 ? inp.eventCount : 0;
  return { inpLabMs: inp.inpLabMs, inpBudgetMs: thresholds.inpP75Ms, inpEventCount: count, inpMeasurementMode: inp.measurementMode ?? 'synthetic-event-timing', pass: inp.inpLabMs <= thresholds.inpP75Ms };
}

async function get(url: string): Promise<HttpSnapshot> {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000), headers: { 'user-agent': 'ExcelArsiv-SEO-Staging-Proof/1.0' } });
  return { status: response.status, url: response.url, text: await response.text() };
}

function stagingUrl(base: URL, route: string): string {
  return new URL(normalizeRoute(route), `${base.origin}/`).toString();
}

async function runStagingProof(baseUrl: string, lighthouseDir: string, inpJsonPath: string): Promise<StagingProof> {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:') throw new Error('STAGING_URL_MUST_BE_HTTPS');
  const defaults = JSON.parse(readFileSync(resolve(ROOT, 'seo.config.defaults.json'), 'utf8')) as { thresholds: Thresholds };
  const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
  const live = registry.records.filter((record) => record.status === 'live').sort((a, b) => a.route.localeCompare(b.route));
  if (live.length === 0) throw new Error('REGISTRY_EMPTY');
  const cache = new Map<string, HttpSnapshot>();
  const fetchRoute = async (route: string): Promise<HttpSnapshot> => {
    const normalized = normalizeRoute(route);
    const cached = cache.get(normalized);
    if (cached) return cached;
    const snapshot = await get(stagingUrl(base, normalized));
    cache.set(normalized, snapshot);
    return snapshot;
  };

  const renderFailures: string[] = [];
  for (const record of live) {
    const localPath = distHtmlPath(record.route);
    if (!existsSync(localPath)) { renderFailures.push(`${record.route}:LOCAL_HTML_MISSING`); continue; }
    const local = readFileSync(localPath, 'utf8');
    const remote = await fetchRoute(record.route);
    if (remote.status !== 200) renderFailures.push(`${record.route}:HTTP_${remote.status}`);
    const localH1 = extractTagText(local, 'h1');
    const remoteH1 = extractTagText(remote.text, 'h1');
    if (!localH1 || !remoteH1 || localH1 !== remoteH1) renderFailures.push(`${record.route}:H1_PARITY`);
    const localTitle = extractTagText(local, 'title');
    const remoteTitle = extractTagText(remote.text, 'title');
    if (!localTitle || !remoteTitle || localTitle !== remoteTitle) renderFailures.push(`${record.route}:TITLE_PARITY`);
    const expectedCanonical = normalizeCanonical(record.canonical ?? new URL(record.route, `${PRODUCTION_ORIGIN}/`).toString());
    const actualCanonical = normalizeCanonical(extractCanonical(remote.text));
    if (!expectedCanonical || !actualCanonical || actualCanonical !== expectedCanonical) renderFailures.push(`${record.route}:CANONICAL_PARITY`);
    if (isNoindex(remote.text)) renderFailures.push(`${record.route}:NOINDEX`);
  }

  const rootSitemapPath = resolve(DIST, 'sitemap.xml');
  if (!existsSync(rootSitemapPath)) throw new Error('SITEMAP_ROOT_MISSING');
  const rootXml = readFileSync(rootSitemapPath, 'utf8');
  if (!rootXml.includes('<sitemapindex')) throw new Error('SITEMAP_ROOT_NOT_INDEX');
  const childLocs = parseSitemapLocs(rootXml);
  const sitemapRoutes = new Set<string>();
  const sitemapFailures: string[] = [];
  for (const childLoc of childLocs) {
    const childName = basename(new URL(childLoc).pathname);
    const localChild = resolve(DIST, childName);
    if (!existsSync(localChild)) { sitemapFailures.push(`${childName}:LOCAL_CHILD_MISSING`); continue; }
    const childRemote = await get(new URL(`/${childName}`, `${base.origin}/`).toString());
    if (childRemote.status !== 200) sitemapFailures.push(`${childName}:HTTP_${childRemote.status}`);
    if (!childRemote.text.includes('<urlset')) sitemapFailures.push(`${childName}:NOT_URLSET`);
    const localChildLocs = parseSitemapLocs(readFileSync(localChild, 'utf8'));
    for (const loc of localChildLocs) sitemapRoutes.add(normalizeRoute(new URL(loc).pathname));
  }
  const registryRoutes = new Set(live.map((record) => normalizeRoute(record.route)));
  const parity = setDiff(registryRoutes, sitemapRoutes);
  for (const route of parity.missing) sitemapFailures.push(`${route}:MISSING_FROM_SITEMAP`);
  for (const route of parity.extra) sitemapFailures.push(`${route}:EXTRA_IN_SITEMAP`);
  for (const route of sitemapRoutes) {
    const remote = await fetchRoute(route);
    if (remote.status !== 200) sitemapFailures.push(`${route}:HTTP_${remote.status}`);
    const record = live.find((item) => normalizeRoute(item.route) === route);
    const expectedCanonical = normalizeCanonical(record?.canonical ?? new URL(route, `${PRODUCTION_ORIGIN}/`).toString());
    const actualCanonical = normalizeCanonical(extractCanonical(remote.text));
    if (!expectedCanonical || !actualCanonical || actualCanonical !== expectedCanonical) sitemapFailures.push(`${route}:CANONICAL_MISMATCH`);
    if (isNoindex(remote.text)) sitemapFailures.push(`${route}:NOINDEX_LEAK`);
  }

  if (!existsSync(lighthouseDir)) throw new Error('LIGHTHOUSE_DIR_MISSING');
  const reportFiles = readdirSync(lighthouseDir).filter((file) => /^lighthouse-.*\.json$/.test(file)).sort();
  if (reportFiles.length === 0) throw new Error('LIGHTHOUSE_REPORTS_MISSING');
  const metricProofs = reportFiles.map((file) => evaluateLighthouseReport(JSON.parse(readFileSync(resolve(lighthouseDir, file), 'utf8')) as LighthouseReport, defaults.thresholds));
  const inp = evaluateInpLab(JSON.parse(readFileSync(inpJsonPath, 'utf8')) as InpLab, defaults.thresholds);

  const missingRoute = '/__seo_staging_proof_missing__';
  const notFound = await get(stagingUrl(base, missingRoute));
  const failures = [
    ...renderFailures,
    ...sitemapFailures,
    ...metricProofs.filter((metric) => !metric.pass).map((metric) => `${metric.url}:LIGHTHOUSE_BUDGET:LCP=${metric.lcpMs.toFixed(0)}/${metric.lcpBudgetMs}:CLS=${metric.cls.toFixed(3)}/${metric.clsBudget}`),
    ...(inp.pass ? [] : [`${base.origin}:INP_LAB_BUDGET:${inp.inpLabMs}/${inp.inpBudgetMs}`]),
    ...(notFound.status === 404 ? [] : [`${missingRoute}:SOFT_404_HTTP_${notFound.status}`]),
  ];
  if (failures.length) throw new Error(`STAGING_PROOF_BLOCK:${failures.join('|')}`);

  return {
    meta: {
      artifact: 'staging_proof',
      schemaVersion: '6.0-wave2-c2',
      generatedAt: new Date().toISOString(),
      generatorScript: 'scripts/seo/staging-proof.ts',
      confidence: 'strong-lab-not-field',
      partial: false,
      siteId: 'excelarsiv',
      structuralBreaksApplied: ['consent v2 live'],
    },
    stagingUrl: base.origin,
    status: 'PASS',
    renderParity: { checked: live.length, failures: [] },
    lighthouse: { reports: metricProofs, inpLabMs: inp.inpLabMs, inpBudgetMs: inp.inpBudgetMs, inpEventCount: inp.inpEventCount, inpMeasurementMode: inp.inpMeasurementMode, fieldDataClaimed: false },
    sitemap: { rootType: 'sitemapindex', children: childLocs.length, urls: sitemapRoutes.size, registryUrls: registryRoutes.size, failures: [] },
    notFound: { route: missingRoute, status: notFound.status, soft404: false },
  };
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  try {
    const url = arg('--url');
    if (!url) {
      console.log('STAGING PROOF SKIP_NO_DATA — --url yok');
      process.exit(EXIT.MISSING_DATA);
    }
    const lighthouseDir = arg('--lighthouse-dir');
    const inpJson = arg('--inp-json');
    if (!lighthouseDir || !inpJson) throw new Error('STAGING_PROOF_INPUTS_MISSING');
    const proof = await runStagingProof(url, resolve(ROOT, lighthouseDir), resolve(ROOT, inpJson));
    console.log(`RENDER PARITY PASS — ${proof.renderParity.checked} route`);
    for (const metric of proof.lighthouse.reports) console.log(`LIGHTHOUSE [Güçlü/lab] ${metric.url} LCP=${metric.lcpMs.toFixed(0)}ms/${metric.lcpBudgetMs} CLS=${metric.cls.toFixed(3)}/${metric.clsBudget}`);
    console.log(`INP [Güçlü/sentetik-lab] ${proof.lighthouse.inpLabMs}ms/${proof.lighthouse.inpBudgetMs} events=${proof.lighthouse.inpEventCount} mode=${proof.lighthouse.inpMeasurementMode}`);
    console.log(`SITEMAP DRY-RUN PASS — children=${proof.sitemap.children} urls=${proof.sitemap.urls} registry=${proof.sitemap.registryUrls}`);
    console.log(`404 PASS — ${proof.notFound.route} HTTP ${proof.notFound.status}`);
    const output = arg('--output');
    if (output) writeFileSync(resolve(ROOT, output), `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
    console.log('SEO STAGING PROOF PASS');
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.BLOCK);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();

export { EXIT, evaluateInpLab, evaluateLighthouseReport, extractCanonical, extractTagText, isNoindex, normalizeCanonical, normalizeRoute, parseSitemapLocs, runStagingProof, setDiff };
