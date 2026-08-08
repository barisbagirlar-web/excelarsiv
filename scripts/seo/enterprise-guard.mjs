import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  DIST_DIR,
  SITE_ORIGIN,
  extractAttr,
  extractCanonical,
  extractMeta,
  normalizeCanonical,
  walkFiles,
} from './lib.mjs';

const MAX_CLICK_DEPTH = 4;
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function xmlValues(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
    .map((match) => decodeXml(match[1].trim()));
}

function builtPathname(file) {
  const rel = relative(DIST_DIR, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  return `/${rel}`;
}

function hasNoindex(robots) {
  return /(^|[\s,])noindex([\s,]|$)/i.test(robots || '');
}

function canonicalFromHref(href, base) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.origin !== SITE_ORIGIN) return null;
  url.hash = '';
  url.search = '';
  if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.replace(/\/+$/, '');
  return new URL(url.pathname, SITE_ORIGIN).toString();
}

const htmlFiles = walkFiles(DIST_DIR, (file) => file.endsWith('.html'));
const pages = [];
const canonicalOwners = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const pathname = builtPathname(file);
  const expectedCanonical = new URL(pathname, SITE_ORIGIN).toString();
  const rawCanonical = extractCanonical(html);
  if (!rawCanonical) {
    fail(`${pathname}: canonical eksik`);
    continue;
  }

  const canonical = normalizeCanonical(rawCanonical);
  if (!canonical) {
    fail(`${pathname}: canonical geçersiz veya canonical host dışı -> ${rawCanonical}`);
    continue;
  }
  if (canonical !== expectedCanonical) {
    fail(`SELF_CANONICAL_DRIFT: ${pathname} -> ${canonical}, beklenen ${expectedCanonical}`);
  }

  const existing = canonicalOwners.get(canonical);
  if (existing) fail(`DUPLICATE_CANONICAL_OWNER: ${canonical} -> ${existing}, ${pathname}`);
  else canonicalOwners.set(canonical, pathname);

  const robots = extractMeta(html, 'robots');
  pages.push({ file, html, pathname, canonical, robots, indexable: !hasNoindex(robots) });
}

const pageByCanonical = new Map(pages.map((page) => [page.canonical, page]));
const graph = new Map(pages.map((page) => [page.canonical, new Set()]));

for (const page of pages) {
  for (const tag of page.html.match(/<a\b[^>]*>/gi) ?? []) {
    const target = canonicalFromHref(extractAttr(tag, 'href'), page.canonical);
    if (target && pageByCanonical.has(target)) graph.get(page.canonical).add(target);
  }
}

const home = `${SITE_ORIGIN}/`;
if (!pageByCanonical.has(home)) {
  fail('ROOT_PAGE_MISSING: ana sayfa build içinde bulunamadı');
} else {
  const depths = new Map([[home, 0]]);
  const queue = [home];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const depth = depths.get(current);
    if (depth >= MAX_CLICK_DEPTH) continue;
    for (const target of graph.get(current) ?? []) {
      if (!depths.has(target)) {
        depths.set(target, depth + 1);
        queue.push(target);
      }
    }
  }

  for (const page of pages.filter((item) => item.indexable)) {
    const depth = depths.get(page.canonical);
    if (depth === undefined) fail(`ORPHAN_INDEXABLE_URL: ${page.canonical}`);
    else if (depth > MAX_CLICK_DEPTH) fail(`CLICK_DEPTH_EXCEEDED: ${page.canonical} depth=${depth}`);
  }
}

const sitemapIndexPath = join(DIST_DIR, 'sitemap.xml');
if (!existsSync(sitemapIndexPath)) {
  fail('sitemap.xml bulunamadı');
} else {
  const sitemapIndex = readFileSync(sitemapIndexPath, 'utf8');
  const childUrls = xmlValues(sitemapIndex, 'loc');
  const allLocs = [];
  const lastmods = [];

  for (const childUrl of childUrls) {
    let child;
    try {
      child = new URL(childUrl);
    } catch {
      fail(`SITEMAP_CHILD_INVALID: ${childUrl}`);
      continue;
    }
    if (child.origin !== SITE_ORIGIN) {
      fail(`SITEMAP_CHILD_EXTERNAL: ${childUrl}`);
      continue;
    }
    const childPath = join(DIST_DIR, child.pathname.replace(/^\//, ''));
    if (!existsSync(childPath)) {
      fail(`SITEMAP_CHILD_MISSING: ${child.pathname}`);
      continue;
    }
    const xml = readFileSync(childPath, 'utf8');
    allLocs.push(...xmlValues(xml, 'loc'));
    lastmods.push(...xmlValues(xml, 'lastmod'));
  }

  const duplicateLocs = allLocs.filter((value, index) => allLocs.indexOf(value) !== index);
  if (duplicateLocs.length > 0) fail(`SITEMAP_DUPLICATE_LOC: ${[...new Set(duplicateLocs)].slice(0, 10).join(', ')}`);

  if (lastmods.length > 0) {
    const counts = new Map();
    for (const value of lastmods) counts.set(value, (counts.get(value) ?? 0) + 1);
    const [dominantTimestamp, dominantCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const ratio = dominantCount / lastmods.length;
    if (ratio > 0.95) {
      fail(`LASTMOD_ENTROPY_FAIL: ${(ratio * 100).toFixed(1)}% aynı timestamp (${dominantTimestamp})`);
    } else if (ratio > 0.80) {
      warn(`LASTMOD_ENTROPY_WARN: ${(ratio * 100).toFixed(1)}% aynı timestamp (${dominantTimestamp})`);
    }
  }
}

if (warnings.length > 0) {
  console.warn('SEO ENTERPRISE GUARD UYARILARI');
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (failures.length > 0) {
  console.error('SEO ENTERPRISE GUARD KALDI');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`SEO ENTERPRISE GUARD GEÇTİ — ${pages.length} HTML, ${pages.filter((page) => page.indexable).length} indexlenebilir sayfa, click-depth ≤ ${MAX_CLICK_DEPTH}.`);
