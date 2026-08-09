import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DIST = resolve(ROOT, 'dist');
const SITE_ORIGIN = 'https://excelarsiv.com';
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });

type RegistryRecord = { pageId: string; route: string; status: string; type: string; canonical?: string };
type Registry = { records: RegistryRecord[] };
type GraphPage = { route: string; html: string };
type GraphRow = { route: string; type: string; pageId: string; internalLinksIn: number; internalLinksOut: number; linkedFrom: string[]; linksTo: string[] };
type LinkSuggestion = { targetRoute: string; suggestedSource: string; reason: string };
type GraphResult = { threshold: number; rows: GraphRow[]; orphans: GraphRow[]; suggestions: LinkSuggestion[]; edges: number };

function normalizeRoute(value: string): string {
  let route = value.split('#')[0]?.split('?')[0] ?? '/';
  if (!route.startsWith('/')) route = `/${route}`;
  route = route.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/{2,}/g, '/');
  if (route.length > 1) route = route.replace(/\/$/, '');
  return route || '/';
}

function routeFromHtmlPath(path: string): string {
  const normalized = relative(DIST, path).split(sep).join('/');
  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) return normalizeRoute(`/${normalized.slice(0, -'/index.html'.length)}`);
  return normalizeRoute(`/${normalized}`);
}

function extractInternalRoutes(html: string): string[] {
  const routes = new Set<string>();
  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(hrefPattern)) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
    try {
      const url = new URL(raw, SITE_ORIGIN);
      if (url.origin !== SITE_ORIGIN) continue;
      routes.add(normalizeRoute(url.pathname));
    } catch {
      continue;
    }
  }
  return [...routes].sort();
}

function walkHtml(dir: string): string[] {
  if (!existsSync(dir)) throw new Error('DIST_MISSING');
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walkHtml(path));
    else if (path.endsWith('.html')) files.push(path);
  }
  return files.sort();
}

function loadBuiltPages(): GraphPage[] {
  return walkHtml(DIST).map((path) => ({ route: routeFromHtmlPath(path), html: readFileSync(path, 'utf8') }));
}

function suggestionFor(route: string, type: string): LinkSuggestion {
  if (type === 'product') return { targetRoute: route, suggestedSource: '/sablonlar', reason: 'Ürün katalog merkezinden ikinci bağımsız giriş bağlantısı almalı.' };
  if (type === 'category') return { targetRoute: route, suggestedSource: '/', reason: 'Kategori ana keşif yüzeyinden desteklenmeli.' };
  if (route.startsWith('/rehber/')) return { targetRoute: route, suggestedSource: '/rehber', reason: 'Rehber hub sayfasından desteklenmeli.' };
  return { targetRoute: route, suggestedSource: '/', reason: 'Düşük iç-link alan sayfa ana bilgi mimarisinden desteklenmeli.' };
}

function analyzeLinkGraph(pages: GraphPage[], registry: Registry, threshold: number): GraphResult {
  if (!Number.isInteger(threshold) || threshold < 1) throw new Error('INVALID_INTERNAL_LINK_THRESHOLD');
  const pageByRoute = new Map(pages.map((page) => [normalizeRoute(page.route), page]));
  const targets = registry.records
    .filter((record) => record.status === 'live' && pageByRoute.has(normalizeRoute(record.route)))
    .map((record) => ({ ...record, route: normalizeRoute(record.route) }));
  const targetRoutes = new Set(targets.map((record) => record.route));
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  let edges = 0;

  for (const page of pages) {
    const source = normalizeRoute(page.route);
    const links = extractInternalRoutes(page.html).filter((route) => targetRoutes.has(route) && route !== source);
    const uniqueLinks = new Set(links);
    outgoing.set(source, uniqueLinks);
    for (const target of uniqueLinks) {
      if (!incoming.has(target)) incoming.set(target, new Set());
      incoming.get(target)?.add(source);
      edges += 1;
    }
  }

  const rows: GraphRow[] = targets.map((record) => ({
    route: record.route,
    type: record.type,
    pageId: record.pageId,
    internalLinksIn: incoming.get(record.route)?.size ?? 0,
    internalLinksOut: outgoing.get(record.route)?.size ?? 0,
    linkedFrom: [...(incoming.get(record.route) ?? new Set<string>())].sort(),
    linksTo: [...(outgoing.get(record.route) ?? new Set<string>())].sort(),
  })).sort((a, b) => a.route.localeCompare(b.route));
  const orphans = rows.filter((row) => row.internalLinksIn < threshold);
  const suggestions = orphans.map((row) => suggestionFor(row.route, row.type));
  return { threshold, rows, orphans, suggestions, edges };
}

function main(): void {
  try {
    const defaults = JSON.parse(readFileSync(resolve(ROOT, 'seo.config.defaults.json'), 'utf8')) as { thresholds: { internalLinksInMin: number } };
    const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
    const result = analyzeLinkGraph(loadBuiltPages(), registry, defaults.thresholds.internalLinksInMin);
    console.log(`LINK GRAPH pages=${result.rows.length} edges=${result.edges} threshold=${result.threshold} orphans=${result.orphans.length}`);
    for (const row of result.orphans) console.log(`ORPHAN ${row.route} in=${row.internalLinksIn} type=${row.type}`);
    for (const suggestion of result.suggestions) console.log(`SUGGEST ${suggestion.suggestedSource} -> ${suggestion.targetRoute} | ${suggestion.reason}`);
    if (process.argv.includes('--write')) {
      writeFileSync(resolve(ROOT, 'data/seo/link_graph.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      console.log('LINK GRAPH WRITE PASS');
    }
    if (process.argv.includes('--check') && result.orphans.length > 0) process.exit(EXIT.BLOCK);
    console.log('LINK GRAPH PASS');
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EXIT, analyzeLinkGraph, extractInternalRoutes, normalizeRoute, routeFromHtmlPath };
