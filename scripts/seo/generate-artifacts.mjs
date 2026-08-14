import { existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
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
import { EEAT, buildAiTxt, buildEeatMarkdownSection } from './eeat-ssot.mjs';

const MAX_URLS_PER_SITEMAP = 40_000;
const MAX_UNCOMPRESSED_BYTES = 45 * 1024 * 1024;
const SCREENSHOTS_DIR = resolve(process.cwd(), 'public/screenshots');
const artifacts = new Set(['sitemap.xml', 'llms.txt', 'llms-full.txt', 'ai.txt']);

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

function buildImageSitemapEntries(productEntries) {
  const shots = readdirSync(SCREENSHOTS_DIR).filter((file) => file.endsWith('.png')).sort();
  return productEntries
    .map((entry) => {
      const slug = new URL(entry.loc).pathname.split('/').filter(Boolean).at(-1);
      const images = shots
        .filter((file) => file.startsWith(`${slug}-`))
        .map((file) => `${SITE_ORIGIN}/screenshots/${file}`);
      if (images.length === 0) return null;
      return { loc: entry.loc, lastmod: entry.lastmod, images };
    })
    .filter(Boolean);
}

function imageSitemapDocument(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      const images = entry.images
        .map((src) => `    <image:image>\n      <image:loc>${xmlEscape(src)}</image:loc>\n    </image:image>`)
        .join('\n');
      return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n${images}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
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
    return { name, count: chunk.length };
  });
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value) + ' TL';
}

function llmPageLine(page) {
  return `- [${markdownEscape(page.title)}](${page.canonical})${page.description ? ` — ${markdownEscape(page.description)}` : ''}`;
}

const START_PATHS = new Set(['/nasil-calisir', '/paketler', '/sss']);
const TRUST_PATHS = new Set([
  '/hakkinda',
  '/neden-excel-arsiv',
  '/basari-hikayeleri',
  '/iletisim',
  '/mesafeli-satis-sozlesmesi',
  '/teslimat',
  '/teslimat-ve-iade',
  '/kvkk-aydinlatma',
  '/shopier-veri-aktarimi',
  '/lisans',
  '/kurumsal-lisans',
  '/cerez-politikasi',
  '/pazarlama-acik-riza',
  '/ortaklik-mali-musavir',
  '/demo-kullanim-kosullari',
]);
const KIND_RANK = {
  home: 0,
  baslangic: 1,
  sektor: 2,
  kategori: 3,
  rehber: 4,
  hesaplayici: 5,
  guven: 6,
  diger: 7,
  demo: 8,
  urun: 9,
};

function pageKind(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/sablon/')) return 'urun';
  if (pathname === '/demo' || pathname.startsWith('/demo/')) return 'demo';
  if (pathname.startsWith('/sektor/')) return 'sektor';
  if (pathname === '/sablonlar' || pathname.startsWith('/sablonlar/')) return 'kategori';
  if (pathname === '/rehber' || pathname.startsWith('/rehber/')) return 'rehber';
  if (pathname.startsWith('/hesaplayici/')) return 'hesaplayici';
  if (START_PATHS.has(pathname)) return 'baslangic';
  if (TRUST_PATHS.has(pathname)) return 'guven';
  return 'diger';
}

function pagesOf(indexablePages, kind) {
  return indexablePages
    .filter((page) => pageKind(page.pathname) === kind)
    .sort((a, b) => a.pathname.localeCompare(b.pathname, 'tr'));
}

function pathnameFromLoc(loc) {
  try {
    const path = new URL(loc).pathname;
    return path === '/' ? '/' : path.replace(/\/+$/, '');
  } catch {
    return loc;
  }
}

function byPremiumCrawlOrder(a, b) {
  const aPath = pathnameFromLoc(a.loc);
  const bPath = pathnameFromLoc(b.loc);
  const rank = (KIND_RANK[pageKind(aPath)] ?? 99) - (KIND_RANK[pageKind(bPath)] ?? 99);
  if (rank !== 0) return rank;
  return aPath.localeCompare(bPath, 'tr');
}

function latestContentDate(indexablePages, templateRecords) {
  let latest = null;
  for (const page of indexablePages) {
    const d = semanticLastModified(page, templateRecords);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

function appendPageSection(lines, title, pages) {
  if (pages.length === 0) return;
  lines.push(`## ${title}`, '', ...pages.map(llmPageLine), '');
}

function appendFullSection(lines, title, pages) {
  if (pages.length === 0) return;
  lines.push(`## ${title}`, '');
  for (const page of pages) {
    lines.push(`### ${page.title}`);
    lines.push(`- URL: ${page.canonical}`);
    if (page.description) lines.push(`- Açıklama: ${page.description}`);
    lines.push('');
  }
}

function buildLlmsShort(indexablePages, templateRecords) {
  const home = pagesOf(indexablePages, 'home');
  const start = pagesOf(indexablePages, 'baslangic');
  const sectors = pagesOf(indexablePages, 'sektor');
  const categories = pagesOf(indexablePages, 'kategori');
  const guides = pagesOf(indexablePages, 'rehber');
  const calculators = pagesOf(indexablePages, 'hesaplayici');
  const trust = pagesOf(indexablePages, 'guven');
  const other = pagesOf(indexablePages, 'diger');
  const products = pagesOf(indexablePages, 'urun');
  const lastUpdated = latestContentDate(indexablePages, templateRecords);

  const lines = [
    '# Excel Arşiv',
    '',
    '> Excel Arşiv, Türkiye’deki işletmeler için finans, muhasebe ve operasyon odaklı Excel çalışma sistemleri sunar. Bu dosya public, indexlenebilir ve canonical build sayfalarından otomatik üretilir.',
    '',
    ...(lastUpdated ? [`- Son güncelleme: ${lastUpdated.toISOString().slice(0, 10)}`] : []),
    `- Site: ${SITE_ORIGIN}/`,
    `- Sitemap index: ${SITE_ORIGIN}/sitemap.xml`,
    `- Tam AI/LLM rehberi: ${SITE_ORIGIN}/llms-full.txt`,
    `- AI kimlik dosyası: ${SITE_ORIGIN}/ai.txt`,
    `- Katalog: ${SITE_ORIGIN}/sablonlar`,
    `- Rehberler: ${SITE_ORIGIN}/rehber`,
    `- Sektör dikeyleri: ${SITE_ORIGIN}/sektor/kafe-restoran-nakit`,
    `- Proof Demo: ${SITE_ORIGIN}/demo`,
    `- Uzman profili (E-E-A-T): ${SITE_ORIGIN}/hakkinda`,
    '- Dil: Türkçe (tr-TR)',
    '- Para birimi: Türk Lirası (TL)',
    '',
    buildEeatMarkdownSection({ headingLevel: 2 }).trimEnd(),
    '',
  ];

  appendPageSection(lines, 'Başlangıç ve satın alma', [...home, ...start]);
  appendPageSection(lines, 'Sektör dikeyleri', sectors);
  appendPageSection(lines, 'Katalog ve kategoriler', categories);
  appendPageSection(lines, 'Uygulama rehberleri', guides);
  appendPageSection(lines, 'Ücretsiz hesaplayıcılar', calculators);
  appendPageSection(lines, 'Güven, yasal ve E-E-A-T', trust);
  appendPageSection(lines, 'Diğer public sayfalar', other);

  lines.push('## Ürünler', '');
  for (const page of products) {
    const slug = page.pathname.split('/').at(-1);
    const product = templateRecords.get(slug);
    const price = product?.priceTL ? ` · ${formatPrice(product.priceTL)}` : '';
    lines.push(`- [${markdownEscape(page.title)}](${page.canonical})${price}${page.description ? ` — ${markdownEscape(page.description)}` : product?.summary ? ` — ${markdownEscape(product.summary)}` : ''}`);
  }

  lines.push(
    '',
    '## Proof Demo kapıları',
    '',
    `- Hub: [${markdownEscape('Proof Demo')}](${SITE_ORIGIN}/demo)`,
    '- Kural: her ücretli ürünün demo kapısı `{SITE}/demo/{slug}` adresindedir; ayrı demo URL’leri burada tekrar edilmez.',
    '',
    '## Keşif ve kullanım notu',
    '',
    '- llms.txt ve llms-full.txt yardımcı keşif dosyalarıdır; robots.txt, canonical veya sitemap direktiflerinin yerine geçmez.',
    '- Yalnız public, canonical ve indexlenebilir sayfalar listelenir; noindex veya duplicate canonical sayfalar dahil edilmez.',
    '- Sitemap child dosyaları: sitemap-pages.xml (hub/sektör/rehber/yasal/demo), sitemap-products.xml, sitemap-images.xml.',
    '- sitemap-images.xml içindeki ürün `<loc>` değerleri canonical URL envanterine ikinci kez sayılmaz.',
    '- Ürün, kategori, sektör, rehber veya SEO metadata değişiklikleri build sırasında yeniden değerlendirilir.',
    '',
  );
  return lines.join('\n');
}

function buildLlmsFull(indexablePages, templateRecords) {
  const products = pagesOf(indexablePages, 'urun');
  const lastUpdated = latestContentDate(indexablePages, templateRecords);
  const lines = [
    '# Excel Arşiv — Tam AI ve LLM Keşif Rehberi',
    '',
    'Bu belge canlı build içindeki indexlenebilir ve canonical public sayfalardan türetilir. Manuel URL envanteri tutulmaz; kaynak içerik veya SEO metadata değiştiğinde build pipeline dosyayı yeniden üretir.',
    '',
    '## Site kimliği',
    '',
    ...(lastUpdated ? [`- Son güncelleme: ${lastUpdated.toISOString().slice(0, 10)}`] : []),
    '- Marka: Excel Arşiv',
    '- Canonical origin: https://excelarsiv.com',
    '- Dil: Türkçe (tr-TR)',
    '- Hedef kullanıcı: KOBİ ve işletmelerde finans, muhasebe ve operasyon kararlarını Excel ile yöneten kullanıcılar',
    '- İş modeli: ücretli Excel çalışma sistemleri ve ücretsiz uygulama rehberleri',
    '- Dosya türleri: .xlsx / .xlsm (ürüne göre)',
    '- Sitemap index: https://excelarsiv.com/sitemap.xml',
    '- Robots: https://excelarsiv.com/robots.txt',
    '- AI kimlik: https://excelarsiv.com/ai.txt',
    '- Katalog: https://excelarsiv.com/sablonlar',
    '- Makine kataloğu (JSON): https://excelarsiv.com/katalog.json',
    '- Rehber: https://excelarsiv.com/rehber',
    '- Sektör dikeyleri: https://excelarsiv.com/sektor/kafe-restoran-nakit · https://excelarsiv.com/sektor/insaat-hakedis · https://excelarsiv.com/sektor/e-ticaret-karlilik',
    '- Proof Demo hub: https://excelarsiv.com/demo',
    '- Satın alma (ürün sayfası #satin-al): her ürün URL’sinde Shopier ödeme başlatma',
    '- Neden Excel Arşiv (moat): https://excelarsiv.com/neden-excel-arsiv',
    '- Uzman profili (E-E-A-T): https://excelarsiv.com/hakkinda',
    '',
    buildEeatMarkdownSection({ headingLevel: 2 }).trimEnd(),
    '',
  ];

  appendFullSection(lines, 'Başlangıç ve satın alma', [...pagesOf(indexablePages, 'home'), ...pagesOf(indexablePages, 'baslangic')]);
  appendFullSection(lines, 'Sektör dikeyleri', pagesOf(indexablePages, 'sektor'));
  appendFullSection(lines, 'Katalog ve kategoriler', pagesOf(indexablePages, 'kategori'));
  appendFullSection(lines, 'Uygulama rehberleri', pagesOf(indexablePages, 'rehber'));
  appendFullSection(lines, 'Ücretsiz hesaplayıcılar', pagesOf(indexablePages, 'hesaplayici'));
  appendFullSection(lines, 'Güven, yasal ve E-E-A-T', pagesOf(indexablePages, 'guven'));
  appendFullSection(lines, 'Diğer public sayfalar', pagesOf(indexablePages, 'diger'));

  lines.push(
    '## Proof Demo kapıları',
    '',
    `- Hub: ${SITE_ORIGIN}/demo`,
    '- Kural: her ücretli ürünün indexlenebilir demo kapısı `{SITE}/demo/{slug}` adresindedir.',
    '- Tam ürün sayfası canonical kaynaktır; demo kapısı satın alma yerine geçmez.',
    '',
    '## Ürün kataloğu',
    '',
  );
  for (const page of products) {
    const slug = page.pathname.split('/').at(-1);
    const product = templateRecords.get(slug);
    lines.push(`### ${page.title}`);
    lines.push(`- URL: ${page.canonical}`);
    if (product?.name && product.name !== page.title) lines.push(`- Ürün adı: ${product.name}`);
    if (page.description) lines.push(`- Arama açıklaması: ${page.description}`);
    if (product?.summary) lines.push(`- Ürün özeti: ${product.summary}`);
    if (product?.category) lines.push(`- Kategori kodu: ${product.category}`);
    if (product?.priceTL) lines.push(`- Fiyat: ${formatPrice(product.priceTL)}${product.vatIncluded ? ' (KDV dahil)' : ''}`);
    if (product?.fileFormat) lines.push(`- Dosya biçimi: ${product.fileFormat}`);
    if (product?.sheetCount) lines.push(`- Çalışma sayfası sayısı: ${product.sheetCount}`);
    if (product?.version) lines.push(`- Sürüm: ${product.version}`);
    if (product?.updatedAt) lines.push(`- Ürün içerik tarihi: ${product.updatedAt}`);
    lines.push(`- Satın alma: ${page.canonical}#satin-al`);
    lines.push(`- Demo açılış: ${SITE_ORIGIN}/demo/${slug}`);
    lines.push('');
  }

  lines.push(
    '## Teknik keşif politikası',
    '',
    '- /sitemap.xml bir sitemap index dosyasıdır; child sitemapler sitemap-pages.xml, sitemap-products.xml ve sitemap-images.xml olarak ayrılır.',
    '- sitemap-pages.xml hub, sektör, kategori, rehber, yasal ve demo kapılarını içerir; ürün canonical’leri sitemap-products.xml’dedir.',
    '- Sitemap yalnız self-canonical, indexlenebilir build sayfalarını içerir; query parametreli, dış-host canonical, noindex ve duplicate canonical sayfalar reddedilir.',
    '- sitemap-images.xml Google image protokolü gereği ürün sayfa `<loc>` değerini tekrarlar; bu loc’lar canonical URL envanterine ikinci kez sayılmaz.',
    '- priority ve changefreq üretilmez.',
    '- URL lastmod build/deploy zamanı değildir; sayfanın gerçek semantik kaynak bağımlılıklarının son değişiklik zamanından türetilir.',
    '- Child sitemap index lastmod değeri SHA-256 içerik değişimine göre PRESERVE veya SET_NOW durum makinesiyle yönetilir.',
    '- llms.txt ve llms-full.txt deneysel keşif yardımcılarıdır; tarama veya sıralama garantisi vermez.',
    '',
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

const products = entries.filter((entry) => entry.product).sort(byPremiumCrawlOrder);
const generalPages = entries.filter((entry) => !entry.product).sort(byPremiumCrawlOrder);
const children = [
  ...writeSitemapGroup('pages', generalPages),
  ...writeSitemapGroup('products', products),
];

const imageEntries = buildImageSitemapEntries(products);
if (imageEntries.length > 0) {
  atomicWrite('sitemap-images.xml', imageSitemapDocument(imageEntries));
  children.push({ name: 'sitemap-images.xml', count: imageEntries.length });
}

if (children.length === 0) throw new Error('FAIL_SAFE_EMPTY_SITEMAP_INDEX');
atomicWrite('sitemap.xml', sitemapIndexDocument(children));
atomicWrite('llms.txt', buildLlmsShort(indexablePages, templates));
atomicWrite('llms-full.txt', buildLlmsFull(indexablePages, templates));
{
  const lastUpdated = latestContentDate(indexablePages, templates);
  atomicWrite(
    'ai.txt',
    buildAiTxt(lastUpdated ? lastUpdated.toISOString().slice(0, 10) : null),
  );
}

const katalog = {
  generatedAt: new Date().toISOString(),
  site: SITE_ORIGIN,
  currency: 'TRY',
  language: 'tr-TR',
  productCount: [...templates.values()].length,
  eeat: {
    brand: EEAT.marka,
    author: {
      name: EEAT.yazar.ad,
      jobTitle: EEAT.yazar.unvan,
      role: EEAT.yazar.rol,
      summary: EEAT.yazar.ozet,
      profileUrl: EEAT.yazar.profil,
      email: EEAT.yazar.eposta,
      image: EEAT.yazar.foto,
      credentials: EEAT.yazar.kimlikler,
      knowsAbout: EEAT.yazar.knowsAbout,
      sameAs: EEAT.yazar.sameAs,
    },
    seller: {
      legalName: EEAT.satici.unvan,
      taxID: EEAT.satici.vkn,
      taxIDNote: EEAT.satici.vknNotu,
      telephone: EEAT.satici.telefon,
      email: EEAT.satici.eposta,
      addressNote: EEAT.satici.adresNotu,
    },
    trustPages: EEAT.guvenSayfalari,
    discovery: {
      aiTxt: `${SITE_ORIGIN}/ai.txt`,
      llmsTxt: `${SITE_ORIGIN}/llms.txt`,
      llmsFullTxt: `${SITE_ORIGIN}/llms-full.txt`,
      humansTxt: `${SITE_ORIGIN}/humans.txt`,
      securityTxt: `${SITE_ORIGIN}/.well-known/security.txt`,
      about: `${SITE_ORIGIN}/hakkinda`,
    },
  },
  products: [...templates.values()]
    .map((product) => ({
      slug: product.slug ?? product.id,
      name: product.name,
      summary: product.summary ?? null,
      category: product.category ?? null,
      priceTL: product.priceTL ?? null,
      vatIncluded: product.vatIncluded ?? true,
      fileFormat: product.fileFormat ?? null,
      sheetCount: product.sheetCount ?? null,
      version: product.version ?? null,
      updatedAt: product.updatedAt ?? null,
      url: `${SITE_ORIGIN}/sablon/${product.slug ?? product.id}`,
      buyUrl: `${SITE_ORIGIN}/sablon/${product.slug ?? product.id}#satin-al`,
      demoUrl: `${SITE_ORIGIN}/demo/${product.slug ?? product.id}`,
    }))
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug), 'tr')),
};
atomicWrite('katalog.json', `${JSON.stringify(katalog, null, 2)}\n`);

const manifestChildren = children.map((child) => ({
  file: child.name,
  urlCount: child.count,
  sha256: sha256(Buffer.from(readFileSync(join(DIST_DIR, child.name), 'utf8'), 'utf8')),
}));
atomicWrite('seo-artifacts.json', JSON.stringify({ site: SITE_ORIGIN, children: manifestChildren }, null, 2));

console.log(`SEO ARTIFACTS GENERATED — ${indexablePages.length} canonical URL, ${children.length} child sitemap, ${templates.size} product record`);
console.log(`Generated: ${[...artifacts].sort().join(', ')}`);
