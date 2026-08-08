import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  DIST_DIR,
  SITE_ORIGIN,
  assertNotFuture,
  discoverBuiltPages,
  getTemplateRecords,
  markdownEscape,
  semanticLastModified,
  xmlEscape,
} from './lib.mjs';

const MAX_URLS_PER_SITEMAP = 40_000;
const MAX_UNCOMPRESSED_BYTES = 45 * 1024 * 1024;
const artifacts = new Set(['sitemap.xml', 'llms.txt', 'llms-full.txt']);

function atomicWrite(name, content) {
  const target = join(DIST_DIR, name);
  const temporary = `${target}.tmp-${process.pid}`;
  writeFileSync(temporary, content, 'utf8');
  renameSync(temporary, target);
  artifacts.add(name);
}

function cleanLegacyArtifacts() {
  const legacy = ['sitemap-index.xml', 'sitemap-0.xml'];
  for (const name of legacy) {
    const path = join(DIST_DIR, name);
    if (existsSync(path)) rmSync(path, { force: true });
  }
}

function sitemapUrlNode(entry) {
  const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
  return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n  </url>`;
}

function sitemapDocument(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(sitemapUrlNode).join('\n')}\n</urlset>\n`;
}

function sitemapIndexDocument(children) {
  const body = children
    .map((child) => {
      const lastmod = child.lastmod ? `\n    <lastmod>${xmlEscape(child.lastmod)}</lastmod>` : '';
      return `  <sitemap>\n    <loc>${xmlEscape(`${SITE_ORIGIN}/${child.name}`)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

function chunkByProtocolLimits(entries) {
  const chunks = [];
  let current = [];
  let estimatedBytes = 0;

  for (const entry of entries) {
    const nodeBytes = Buffer.byteLength(sitemapUrlNode(entry), 'utf8') + 1;
    const wouldOverflow =
      current.length >= MAX_URLS_PER_SITEMAP ||
      (current.length > 0 && estimatedBytes + nodeBytes > MAX_UNCOMPRESSED_BYTES);
    if (wouldOverflow) {
      chunks.push(current);
      current = [];
      estimatedBytes = 0;
    }
    current.push(entry);
    estimatedBytes += nodeBytes;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function maxLastmod(entries) {
  const values = entries.map((entry) => entry.lastmod).filter(Boolean).sort();
  return values.at(-1) ?? null;
}

function writeSitemapGroup(label, entries) {
  if (entries.length === 0) return [];
  const chunks = chunkByProtocolLimits(entries);
  return chunks.map((chunk, index) => {
    const name = chunks.length === 1 ? `sitemap-${label}.xml` : `sitemap-${label}-${index + 1}.xml`;
    const content = sitemapDocument(chunk);
    if (Buffer.byteLength(content, 'utf8') > 50 * 1024 * 1024) {
      throw new Error(`SITEMAP_SIZE_LIMIT: ${name}`);
    }
    atomicWrite(name, content);
    return { name, lastmod: maxLastmod(chunk), count: chunk.length };
  });
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value) + ' TL';
}

function buildLlmsShort(indexablePages, templateRecords) {
  const products = indexablePages.filter((page) => page.pathname.startsWith('/sablon/'));
  const navigation = indexablePages.filter((page) => !page.pathname.startsWith('/sablon/'));
  const lines = [
    '# Excel Arşiv',
    '',
    '> Excel Arşiv, Türkiye’deki işletmeler için finans, muhasebe ve operasyon odaklı Excel çalışma sistemleri sunar. Bu dosya public ve canonical sayfalardan her build sırasında otomatik üretilir.',
    '',
    `- Site: ${SITE_ORIGIN}/`,
    `- Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    `- Tam LLM rehberi: ${SITE_ORIGIN}/llms-full.txt`,
    '- Dil: Türkçe (tr-TR)',
    '- Para birimi: Türk Lirası (TL)',
    '',
    '## Ana kaynaklar',
    '',
  ];

  for (const page of navigation) {
    lines.push(`- [${markdownEscape(page.title)}](${page.canonical})${page.description ? ` — ${markdownEscape(page.description)}` : ''}`);
  }

  lines.push('', '## Ürünler', '');
  for (const page of products) {
    const slug = page.pathname.split('/').at(-1);
    const product = templateRecords.get(slug);
    const price = product?.priceTL ? ` · ${formatPrice(product.priceTL)}` : '';
    lines.push(`- [${markdownEscape(product?.name || page.title)}](${page.canonical})${price}${product?.summary ? ` — ${markdownEscape(product.summary)}` : ''}`);
  }

  lines.push(
    '',
    '## Keşif ve kullanım notu',
    '',
    '- Bu dosya bir indeksleme garantisi veya robots direktifi değildir.',
    '- Canonical, indexlenebilir ve public sayfalar kaynak alınır; noindex sayfalar dahil edilmez.',
    '- Ürün veya sayfa eklendiğinde build pipeline sitemap ve LLM dosyalarını yeniden üretir.',
    ''
  );
  return lines.join('\n');
}

function buildLlmsFull(indexablePages, templateRecords) {
  const products = indexablePages.filter((page) => page.pathname.startsWith('/sablon/'));
  const pages = indexablePages.filter((page) => !page.pathname.startsWith('/sablon/'));
  const lines = [
    '# Excel Arşiv — Tam LLM ve AI Keşif Rehberi',
    '',
    'Bu belge yalnızca canlı build içinde üretilen, indexlenebilir ve canonical public sayfalardan türetilir. Manuel ürün listesi tutulmaz; kaynak içerik değişince dosya otomatik yenilenir.',
    '',
    '## Site kimliği',
    '',
    '- Marka: Excel Arşiv',
    '- Canonical origin: https://excelarsiv.com',
    '- Dil: Türkçe (tr-TR)',
    '- İş modeli: Türkiye’deki işletmeler için hazır Excel çalışma sistemleri',
    '- Dosya türleri: .xlsx / .xlsm (ürüne göre)',
    '- Sitemap: https://excelarsiv.com/sitemap.xml',
    '- Robots: https://excelarsiv.com/robots.txt',
    '',
    '## Public sayfalar',
    '',
  ];

  for (const page of pages) {
    lines.push(`### ${page.title}`);
    lines.push(`- URL: ${page.canonical}`);
    if (page.description) lines.push(`- Açıklama: ${page.description}`);
    lines.push('');
  }

  lines.push('## Ürün kataloğu', '');
  for (const page of products) {
    const slug = page.pathname.split('/').at(-1);
    const product = templateRecords.get(slug);
    lines.push(`### ${product?.name || page.title}`);
    lines.push(`- URL: ${page.canonical}`);
    if (product?.summary) lines.push(`- Açıklama: ${product.summary}`);
    if (product?.category) lines.push(`- Kategori kodu: ${product.category}`);
    if (product?.priceTL) lines.push(`- Fiyat: ${formatPrice(product.priceTL)}${product.vatIncluded ? ' (KDV dahil)' : ''}`);
    if (product?.fileFormat) lines.push(`- Dosya biçimi: ${product.fileFormat}`);
    if (product?.sheetCount) lines.push(`- Çalışma sayfası sayısı: ${product.sheetCount}`);
    if (product?.version) lines.push(`- Sürüm: ${product.version}`);
    if (product?.updatedAt) lines.push(`- İçerik güncelleme tarihi: ${product.updatedAt}`);
    lines.push('');
  }

  lines.push(
    '## Teknik keşif politikası',
    '',
    '- Sitemap yalnız self-canonical, indexlenebilir build sayfalarını içerir.',
    '- priority ve changefreq üretilmez.',
    '- lastmod build zamanı değildir; ürünlerde içerik updatedAt alanı, diğer sayfalarda kaynak dosyanın Git değişiklik tarihi kullanılır.',
    '- Query parametreli, dış host canonical’lı, noindex veya duplicate canonical sayfalar sitemap üretiminde reddedilir.',
    '- llms.txt ve llms-full.txt deneysel keşif yardımcılarıdır; sitemap, canonical veya robots.txt yerine geçmez.',
    ''
  );
  return lines.join('\n');
}

cleanLegacyArtifacts();

const pages = discoverBuiltPages();
const indexablePages = pages.filter((page) => page.indexable);
if (indexablePages.length === 0) {
  throw new Error('FAIL_SAFE_EMPTY_DATASET: indexlenebilir canonical URL bulunamadı; mevcut production deploy korunmalı.');
}

const templates = getTemplateRecords();
const entries = indexablePages.map((page) => {
  const lastModified = semanticLastModified(page, templates);
  assertNotFuture(lastModified, page.canonical);
  return {
    loc: page.canonical,
    lastmod: lastModified ? lastModified.toISOString() : null,
    product: page.pathname.startsWith('/sablon/'),
  };
});

const products = entries.filter((entry) => entry.product);
const generalPages = entries.filter((entry) => !entry.product);
const children = [
  ...writeSitemapGroup('pages', generalPages),
  ...writeSitemapGroup('products', products),
];

if (children.length === 0) throw new Error('FAIL_SAFE_EMPTY_SITEMAP_INDEX');
atomicWrite('sitemap.xml', sitemapIndexDocument(children));
atomicWrite('llms.txt', buildLlmsShort(indexablePages, templates));
atomicWrite('llms-full.txt', buildLlmsFull(indexablePages, templates));

console.log(`SEO ARTIFACTS GENERATED — ${indexablePages.length} canonical URL, ${children.length} child sitemap, ${templates.size} product record`);
console.log(`Generated: ${[...artifacts].sort().join(', ')}`);
