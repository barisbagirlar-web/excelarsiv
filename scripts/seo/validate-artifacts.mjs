import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIST_DIR,
  SITE_ORIGIN,
  discoverBuiltPages,
  extractMeta,
  normalizeCanonical,
} from './lib.mjs';

const failures = [];
const warnings = [];
const requiredArtifacts = ['sitemap.xml', 'robots.txt', 'llms.txt', 'llms-full.txt'];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readRequired(name) {
  const path = join(DIST_DIR, name);
  if (!existsSync(path)) {
    fail(`${name}: dosya yok`);
    return '';
  }
  const content = readFileSync(path, 'utf8');
  if (!content.trim()) fail(`${name}: dosya boş`);
  return content;
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

function assertSitemapFile(name) {
  const path = join(DIST_DIR, name);
  if (!existsSync(path)) {
    fail(`${name}: sitemap index child dosyası bulunamadı`);
    return { locs: [], lastmods: [] };
  }
  const size = statSync(path).size;
  if (size > 50 * 1024 * 1024) fail(`${name}: 50 MB protokol sınırı aşıldı`);
  const xml = readFileSync(path, 'utf8');
  if (!/^<\?xml[^>]*>\s*<urlset\b/i.test(xml)) fail(`${name}: geçerli urlset değil`);
  if (/<priority>|<changefreq>/i.test(xml)) fail(`${name}: priority/changefreq gürültüsü bulundu`);

  const locs = xmlValues(xml, 'loc');
  const lastmods = xmlValues(xml, 'lastmod');
  if (locs.length > 50_000) fail(`${name}: 50.000 URL sınırı aşıldı`);
  if (locs.length === 0) fail(`${name}: URL içermiyor`);

  for (const raw of locs) {
    const normalized = normalizeCanonical(raw);
    if (!normalized || normalized !== raw) fail(`${name}: canonical dışı veya parametreli loc -> ${raw}`);
  }
  for (const raw of lastmods) {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.valueOf())) fail(`${name}: geçersiz lastmod -> ${raw}`);
    else if (parsed.valueOf() > Date.now() + 5 * 60 * 1000) fail(`${name}: gelecek tarihli lastmod -> ${raw}`);
  }

  return { locs, lastmods };
}

for (const file of requiredArtifacts) readRequired(file);

const pages = discoverBuiltPages();
const indexablePages = pages.filter((page) => page.indexable);
const expected = new Set(indexablePages.map((page) => page.canonical));
if (expected.size === 0) fail('Build içinde indexlenebilir canonical sayfa yok');

for (const page of pages) {
  const rel = page.canonical.replace(SITE_ORIGIN, '') || '/';
  if (!page.title) fail(`${rel}: title eksik`);
  if (!page.description && page.indexable) fail(`${rel}: meta description eksik`);
  if (!page.robots) fail(`${rel}: robots meta eksik`);
  if (!page.hasH1) fail(`${rel}: H1 eksik`);
  if (!page.hasJsonLd && page.indexable) fail(`${rel}: JSON-LD eksik`);
  if (page.indexable && normalizeCanonical(page.canonical) !== page.canonical) {
    fail(`${rel}: canonical normalize edilemiyor`);
  }
}

const sitemapIndex = readRequired('sitemap.xml');
if (!/^<\?xml[^>]*>\s*<sitemapindex\b/i.test(sitemapIndex)) fail('sitemap.xml: sitemapindex formatında değil');
if (/<priority>|<changefreq>/i.test(sitemapIndex)) fail('sitemap.xml: priority/changefreq bulunamaz');

const childUrls = xmlValues(sitemapIndex, 'loc');
if (childUrls.length === 0) fail('sitemap.xml: child sitemap yok');
const sitemapLocs = [];
for (const childUrl of childUrls) {
  let url;
  try {
    url = new URL(childUrl);
  } catch {
    fail(`sitemap.xml: geçersiz child URL -> ${childUrl}`);
    continue;
  }
  if (url.origin !== SITE_ORIGIN) {
    fail(`sitemap.xml: dış host child sitemap -> ${childUrl}`);
    continue;
  }
  const name = url.pathname.replace(/^\//, '');
  const child = assertSitemapFile(name);
  sitemapLocs.push(...child.locs);
}

const actual = new Set(sitemapLocs);
if (actual.size !== sitemapLocs.length) fail('Sitemap child dosyalarında duplicate URL var');
for (const canonical of expected) {
  if (!actual.has(canonical)) fail(`SITEMAP_PARITY_MISSING: ${canonical}`);
}
for (const loc of actual) {
  if (!expected.has(loc)) fail(`SITEMAP_PARITY_EXTRA: ${loc}`);
}

const robots = readRequired('robots.txt');
if (!/^User-agent:\s*\*/mi.test(robots)) fail('robots.txt: genel User-agent kuralı yok');
if (/Disallow:\s*\/$/mi.test(robots)) fail('robots.txt: sitewide crawl block tespit edildi');
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail('robots.txt: canonical sitemap.xml bildirimi eksik');

for (const llmName of ['llms.txt', 'llms-full.txt']) {
  const content = readRequired(llmName);
  if (!content.includes(`${SITE_ORIGIN}/sitemap.xml`)) fail(`${llmName}: sitemap referansı eksik`);
  const urls = [...content.matchAll(/https:\/\/excelarsiv\.com[^\s)\]>]*/g)].map((m) => m[0].replace(/[.,;:]$/, ''));
  for (const url of urls) {
    if ([`${SITE_ORIGIN}/sitemap.xml`, `${SITE_ORIGIN}/robots.txt`, `${SITE_ORIGIN}/llms.txt`, `${SITE_ORIGIN}/llms-full.txt`, SITE_ORIGIN].includes(url)) continue;
    const normalized = normalizeCanonical(url);
    if (normalized && !expected.has(normalized)) warn(`${llmName}: sitemap dışı public referans -> ${url}`);
  }
}

if (existsSync(join(DIST_DIR, 'sitemap-index.xml')) || existsSync(join(DIST_DIR, 'sitemap-0.xml'))) {
  fail('Legacy Astro sitemap artığı bulundu; SSOT ihlali');
}

if (warnings.length > 0) {
  console.warn('SEO GATE UYARILARI');
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (failures.length > 0) {
  console.error('SEO QUALITY GATE KALDI');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`SEO QUALITY GATE GEÇTİ — ${expected.size} indexlenebilir URL, ${actual.size} sitemap URL, ${childUrls.length} child sitemap`);
