import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIST_DIR,
  SITE_ORIGIN,
  discoverBuiltPages,
  extractMeta,
  normalizeCanonical,
} from './lib.mjs';
import {
  xmlValues,
  validateChildXml,
  validateIndexXml,
  validateParity,
} from './validate-gates.mjs';

const failures = [];
const warnings = [];
const requiredArtifacts = ['sitemap.xml', 'robots.txt', 'llms.txt', 'llms-full.txt', 'ai.txt'];

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

function assertSitemapFile(name) {
  const path = join(DIST_DIR, name);
  if (!existsSync(path)) {
    fail(`${name}: sitemap index child dosyası bulunamadı`);
    return { locs: [], lastmods: [] };
  }
  const size = statSync(path).size;
  if (size > 50 * 1024 * 1024) fail(`${name}: 50 MB protokol sınırı aşıldı`);
  const xml = readFileSync(path, 'utf8');
  const { locs, lastmods, errors } = validateChildXml(xml, { label: name });
  for (const error of errors) fail(error);

  for (const raw of locs) {
    const normalized = normalizeCanonical(raw);
    if (!normalized || normalized !== raw) fail(`${name}: canonical dışı veya parametreli loc -> ${raw}`);
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
  if (name === 'sitemap-images.xml') {
    assertSitemapFile(name);
    const imagesXml = readFileSync(join(DIST_DIR, name), 'utf8');
    if (!imagesXml.includes('xmlns:image=')) fail('sitemap-images.xml: image namespace eksik');
    if (!imagesXml.includes('<image:loc>')) fail('sitemap-images.xml: image:loc içermiyor');
    continue;
  }
  const child = assertSitemapFile(name);
  sitemapLocs.push(...child.locs);
}

const { indexLastmods, errors: indexErrors } = validateIndexXml(sitemapIndex);
for (const error of indexErrors) fail(`sitemap.xml: ${error}`);

const manifestPath = join(DIST_DIR, 'seo-artifacts.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const expectedChildren = manifest.children.map((child) => `${SITE_ORIGIN}/${child.file}`).sort();
  const actualChildren = childUrls
    .map((value) => {
      try {
        return new URL(value).toString().replace(/\/+$/, '');
      } catch {
        return value;
      }
    })
    .sort();
  if (JSON.stringify(expectedChildren) !== JSON.stringify(actualChildren)) {
    fail('sitemap.xml: index child listesi seo-artifacts.json manifest ile eşleşmiyor (SSOT ihlali)');
  }
}

const actual = new Set(sitemapLocs);
for (const error of validateParity(expected, sitemapLocs)) fail(error);

const robots = readRequired('robots.txt');
if (!/^User-agent:\s*\*/mi.test(robots)) fail('robots.txt: genel User-agent kuralı yok');
if (/Disallow:\s*\/$/mi.test(robots)) fail('robots.txt: sitewide crawl block tespit edildi');
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail('robots.txt: canonical sitemap.xml bildirimi eksik');

if (!existsSync(join(DIST_DIR, 'katalog.json'))) {
  fail('katalog.json: dosya yok');
} else {
  const katalog = JSON.parse(readFileSync(join(DIST_DIR, 'katalog.json'), 'utf8'));
  if (!katalog.eeat?.author?.name) fail('katalog.json: eeat.author eksik');
  if (katalog.eeat?.seller?.taxID !== '25403091318') fail('katalog.json: eeat.seller.taxID VKN eşleşmiyor');
  if (!katalog.eeat?.discovery?.aiTxt) fail('katalog.json: eeat.discovery.aiTxt eksik');
}

for (const name of ['humans.txt', '.well-known/security.txt']) {
  if (!existsSync(join(DIST_DIR, name))) fail(`${name}: dosya yok`);
}

for (const llmName of ['llms.txt', 'llms-full.txt', 'ai.txt']) {
  const content = readRequired(llmName);
  if (!content.includes(`${SITE_ORIGIN}/sitemap.xml`)) fail(`${llmName}: sitemap referansı eksik`);
  if (!content.includes('E-E-A-T') && !content.includes('E-E-A-T varlığı')) fail(`${llmName}: E-E-A-T bölümü eksik`);
  if (!content.includes('25403091318')) fail(`${llmName}: satıcı VKN eksik`);
  if (!content.includes(`${SITE_ORIGIN}/hakkinda`)) fail(`${llmName}: uzman profili /hakkinda eksik`);
  const urls = [...content.matchAll(/https:\/\/excelarsiv\.com[^\s)\]>]*/g)].map((m) => m[0].replace(/[.,;:]$/, ''));
  for (const url of urls) {
    if ([
      `${SITE_ORIGIN}/sitemap.xml`,
      `${SITE_ORIGIN}/robots.txt`,
      `${SITE_ORIGIN}/llms.txt`,
      `${SITE_ORIGIN}/llms-full.txt`,
      `${SITE_ORIGIN}/ai.txt`,
      `${SITE_ORIGIN}/katalog.json`,
      `${SITE_ORIGIN}/humans.txt`,
      `${SITE_ORIGIN}/.well-known/security.txt`,
      SITE_ORIGIN,
      `${SITE_ORIGIN}/`,
      `${SITE_ORIGIN}/images/baris-bagirlar.jpg`,
    ].includes(url)) continue;
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
