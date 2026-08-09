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
type GraphRow = {
  route: string;
  type: string;
  pageId: string | null;
  registryRegistered: boolean;
  internalLinksIn: number;
  internalLinksOut: number;
  linkedFrom: string[];
  linksTo: string[];
};
type LinkSuggestion = { targetRoute: string; suggestedSource: string; reason: string };
type GraphResult = {
  threshold: number;
  rows: GraphRow[];
  orphans: GraphRow[];
  suggestions: LinkSuggestion[];
  edges: number;
  registeredPages: number;
  unregisteredRoutes: string[];
};

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

function isIndexableHtml(route: string, html: string): boolean {
  if (normalizeRoute(route) === '/404') return false;
  const robots = html.match(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*\bcontent\s*=\s*["']([^"']*)["'][^>]*>/i)
    ?? html.match(/<meta\b[^>]*\bcontent\s*=\s*["']([^"']*)["'][^>]*\bname\s*=\s*["']robots["'][^>]*>/i);
  return !robots?.[1]?.toLocaleLowerCase('en-US').split(/[\s,]+/).includes('noindex');
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

function inferType(route: string): string {
  if (route === '/') return 'home';
  if (route === '/sablonlar' || route.startsWith('/sablonlar/')) return 'category';
  if (route.startsWith('/sablon/')) return 'product';
  if (route === '/rehber' || route.startsWith('/rehber/')) return 'guide';
  return 'other';
}

function suggestionFor(route: string, type: string): LinkSuggestion {
  if (type === 'product') return { targetRoute: route, suggestedSource: '/sablonlar', reason: 'Ürün katalog merkezinden ikinci bağımsız giriş bağlantısı almalı.' };
  if (type === 'category') return { targetRoute: route, suggestedSource: '/', reason: 'Kategori ana keşif yüzeyinden desteklenmeli.' };
  if (type === 'guide') return { targetRoute: route, suggestedSource: '/rehber', reason: 'Rehber hub sayfasından desteklenmeli.' };
  return { targetRoute: route, suggestedSource: '/', reason: 'Düşük iç-link alan sayfa ana bilgi mimarisinden desteklenmeli.' };
}

function analyzeLinkGraph(pages: GraphPage[], registry: Registry, threshold: number): GraphResult {
  if (!Number.isInteger(threshold) || threshold < 1) throw new Error('INVALID_INTERNAL_LINK_THRESHOLD');
  const indexablePages = pages
    .map((page) => ({ ...page, route: normalizeRoute(page.route) }))
    .filter((page) => isIndexableHtml(page.route, page.html));
  const targetRoutes = new Set(indexablePages.map((page) => page.route));
  const registryByRoute = new Map(
    registry.records
      .filter((record) => record.status === 'live')
      .map((record) => [normalizeRoute(record.route), record] as const),
  );
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  let edges = 0;

  for (const page of indexablePages) {
    const source = page.route;
    const links = extractInternalRoutes(page.html).filter((route) => targetRoutes.has(route) && route !== source);
    const uniqueLinks = new Set(links);
    outgoing.set(source, uniqueLinks);
    for (const target of uniqueLinks) {
      if (!incoming.has(target)) incoming.set(target, new Set());
      incoming.get(target)?.add(source);
      edges += 1;
    }
  }

  const rows: GraphRow[] = indexablePages.map((page) => {
    const record = registryByRoute.get(page.route);
    return {
      route: page.route,
      type: record?.type ?? inferType(page.route),
      pageId: record?.pageId ?? null,
      registryRegistered: Boolean(record),
      internalLinksIn: incoming.get(page.route)?.size ?? 0,
      internalLinksOut: outgoing.get(page.route)?.size ?? 0,
      linkedFrom: [...(incoming.get(page.route) ?? new Set<string>())].sort(),
      linksTo: [...(outgoing.get(page.route) ?? new Set<string>())].sort(),
    };
  }).sort((a, b) => a.route.localeCompare(b.route));
  const orphans = rows.filter((row) => row.internalLinksIn < threshold);
  const suggestions = orphans.map((row) => suggestionFor(row.route, row.type));
  const unregisteredRoutes = rows.filter((row) => !row.registryRegistered).map((row) => row.route);
  return {
    threshold,
    rows,
    orphans,
    suggestions,
    edges,
    registeredPages: rows.length - unregisteredRoutes.length,
    unregisteredRoutes,
  };
}

function main(): void {
  try {
    const defaults = JSON.parse(readFileSync(resolve(ROOT, 'seo.config.defaults.json'), 'utf8')) as { thresholds: { internalLinksInMin: number } };
    const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
    const result = analyzeLinkGraph(loadBuiltPages(), registry, defaults.thresholds.internalLinksInMin);
    console.log(`LINK GRAPH pages=${result.rows.length} edges=${result.edges} threshold=${result.threshold} orphans=${result.orphans.length}`);
    console.log(`REGISTRY COVERAGE registered=${result.registeredPages} unregistered=${result.unregisteredRoutes.length}`);
    for (const route of result.unregisteredRoutes) console.log(`UNREGISTERED ${route}`);
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

export { EXIT, analyzeLinkGraph, extractInternalRoutes, inferType, isIndexableHtml, normalizeRoute, routeFromHtmlPath };
