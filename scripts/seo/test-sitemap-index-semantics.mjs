// Offline sitemap-index semantik testleri (madde 11 zorunlu matris).
// Production ağına bağımlı değildir; fixture/mock baseline kullanır.
// finalize-sitemap-index.mjs'in saf karar fonksiyonları ve
// validate-gates.mjs'in saf kapıları doğrudan test edilir.
import {
  decideIndex,
  fetchLiveBaseline,
  parseSitemapIndex,
  parseUrlset,
  renderIndex,
  sha256,
} from './finalize-sitemap-index.mjs';
import {
  isValidLastmod,
  isFuture,
  validateChildXml,
  validateIndexXml,
  validateParity,
} from './validate-gates.mjs';

const SITE = 'https://excelarsiv.com';
const NOW = '2026-08-09T12:00:00.000Z';

let passed = 0;
const failures = [];
const tasks = [];

function test(name, fn) {
  tasks.push({ name, fn });
}

function hashOf(xml) {
  return sha256(Buffer.from(xml, 'utf8'));
}

// generate-artifacts.mjs ile byte-uyumlu deterministik fixture render.
function renderUrlset(entries) {
  const nodes = entries.map((entry) => {
    const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
    return `  <url>\n    <loc>${entry.loc}</loc>${lastmod}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join('\n')}\n</urlset>\n`;
}

function buildChild(lastmods = {}) {
  const entries = Object.entries(lastmods)
    .map(([path, lastmod]) => ({ loc: `${SITE}${path}`, lastmod }))
    .sort((a, b) => a.loc.localeCompare(b.loc, 'en'));
  return renderUrlset(entries);
}

function makeChildren(file, xml) {
  return [
    {
      file,
      loc: `${SITE}/${file}`,
      sha256: hashOf(xml),
    },
  ];
}

function liveMapOf(children, lastmod = '2026-08-01T00:00:00.000Z') {
  return new Map(children.map((child) => [child.loc, { ...child, lastmod }]));
}

// 1-2. Aynı build / deploy tekrarı -> hash ve index lastmod sabit.
{
  const xml = buildChild({ '/': NOW, '/sss': NOW });
  const children = makeChildren('sitemap-pages.xml', xml);
  const liveMap = liveMapOf(children);

  test('1. Aynı build iki kez -> hash aynı, index lastmod aynı', () => {
    const again = buildChild({ '/': NOW, '/sss': NOW });
    if (hashOf(xml) !== hashOf(again)) throw new Error('hash farklı');
    const first = decideIndex(children, liveMap, { nowIso: NOW });
    const second = decideIndex(children, liveMap, { nowIso: '2026-08-09T13:00:00.000Z' });
    if (first.indexXml !== second.indexXml) throw new Error('index lastmod değişti');
  });

  test('2. Yalnız deploy tekrarı -> lastmod değişmez (PRESERVE)', () => {
    const result = decideIndex(children, liveMap, { nowIso: '2026-08-09T14:00:00.000Z' });
    const decision = result.decisions[0];
    if (decision.status !== 'UNCHANGED') throw new Error(`beklenen UNCHANGED, gelen ${decision.status}`);
    if (decision.lastmod !== '2026-08-01T00:00:00.000Z') {
      throw new Error(`lastmod korunmadı: ${decision.lastmod}`);
    }
    if (decision.lastmodAction !== 'PRESERVE') throw new Error(`aksiyon ${decision.lastmodAction}`);
  });
}

// 3-7. Değişiklik algılama: hash + index lastmod birlikte değişmeli.
{
  const baseMods = { '/': NOW, '/sss': NOW, '/paketler': NOW };
  const xmlBase = buildChild(baseMods);
  const baseChildren = makeChildren('sitemap-pages.xml', xmlBase);
  const liveMap = liveMapOf(baseChildren);

  const expectChanged = (label, newXml) => {
    const children = makeChildren('sitemap-pages.xml', newXml);
    const result = decideIndex(children, liveMap, { nowIso: NOW });
    const decision = result.decisions[0];
    if (hashOf(newXml) === hashOf(xmlBase)) throw new Error(`${label}: hash değişmedi`);
    if (decision.status !== 'CHANGED') throw new Error(`${label}: beklenen CHANGED, gelen ${decision.status}`);
    if (decision.lastmod !== NOW) throw new Error(`${label}: lastmod SET_NOW değil`);
    if (decision.lastmodAction !== 'SET_NOW') throw new Error(`${label}: aksiyon ${decision.lastmodAction}`);
  };

  test('3. Yeni URL eklendi -> hash + lastmod değişir', () => {
    expectChanged('url eklendi', buildChild({ ...baseMods, '/yeni-sayfa': NOW }));
  });

  test('4. URL silindi -> hash + lastmod değişir', () => {
    expectChanged('url silindi', buildChild({ '/': NOW, '/sss': NOW }));
  });

  test('5. URL canonical değişti -> hash + lastmod değişir', () => {
    expectChanged('canonical', buildChild({ '/': NOW, '/sss-yeni': NOW, '/paketler': NOW }));
  });

  test('6. URL semantic lastmod değişti -> hash + lastmod değişir', () => {
    expectChanged('semantic lastmod', buildChild({ '/': NOW, '/sss': '2026-08-07', '/paketler': NOW }));
  });

  test('7. İlgisiz değişiklik -> sitemap hash değişmez', () => {
    const unchanged = buildChild(baseMods);
    if (hashOf(unchanged) !== hashOf(xmlBase)) throw new Error('hash değişti');
    const result = decideIndex(makeChildren('sitemap-pages.xml', unchanged), liveMap, { nowIso: NOW });
    if (result.decisions[0].status !== 'UNCHANGED') throw new Error('UNCHANGED değil');
  });
}

// 8. Sıralama determinizmi: aynı girdi -> byte-identical.
{
  test('8. Child sıralama aynı inputta byte-identical', () => {
    const mods = { '/zzz': NOW, '/aaa': NOW, '/mmm': NOW };
    const a = buildChild(mods);
    const b = buildChild(mods);
    if (a !== b) throw new Error('byte farkı');
    const children = makeChildren('sitemap-pages.xml', a);
    const result = decideIndex(children, new Map(), { nowIso: NOW });
    if (result.decisions[0].loc !== `${SITE}/sitemap-pages.xml`) throw new Error('loc bozuk');
  });
}

// 9-13. Geçersiz girdi -> FAIL kapıları.
{
  test('9. Duplicate URL -> FAIL', () => {
    const xml = renderUrlset([
      { loc: `${SITE}/`, lastmod: NOW },
      { loc: `${SITE}/`, lastmod: NOW },
    ]);
    const { errors } = validateChildXml(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('duplicate'))) throw new Error('duplicate yakalanmadı');
  });

  test('10. noindex URL sitemap içinde -> FAIL', () => {
    const indexable = [`${SITE}/sss`];
    const sitemapLocs = [`${SITE}/sss`, `${SITE}/gizli-noindex`];
    const errors = validateParity(indexable, sitemapLocs);
    if (!errors.some((e) => e.includes('PARITY_EXTRA'))) throw new Error('noindex sızıntısı yakalanmadı');
  });

  test('11. Query parametreli canonical -> FAIL', () => {
    const xml = renderUrlset([{ loc: `${SITE}/?utm=x`, lastmod: NOW }]);
    const { errors } = validateChildXml(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('query param'))) throw new Error('query param yakalanmadı');
  });

  test('12. Future URL lastmod -> FAIL', () => {
    const xml = renderUrlset([{ loc: `${SITE}/`, lastmod: '2099-01-01T00:00:00.000Z' }]);
    const { errors } = validateChildXml(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('gelecek'))) throw new Error('future lastmod yakalanmadı');
  });

  test('13. Future child index lastmod -> FAIL', () => {
    const xml = renderIndex([{ loc: `${SITE}/sitemap-pages.xml`, lastmod: '2099-01-01T00:00:00.000Z' }]);
    const { errors } = validateIndexXml(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('gelecek'))) throw new Error('index future yakalanmadı');
  });
}

// 14-15. Baseline başarısızlık doktrini: doğrulanamayan baseline -> DEPLOY FAIL.
{
  const quiet = { log: () => {}, error: () => {} };
  const originalFetch = globalThis.fetch;

  test('14. Baseline HTTP 500 -> DEPLOY FAIL', async () => {
    globalThis.fetch = async () => ({ status: 500, text: async () => '' });
    try {
      await fetchLiveBaseline({ baseUrl: SITE, logger: quiet, attempts: 2, delayMs: 0 });
      throw new Error('hata fırlatılmadı');
    } catch (err) {
      if (!err.message.includes('HTTP 500') && !err.message.startsWith('BASELINE_UNKNOWN')) {
        throw err;
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('15. Baseline timeout -> DEPLOY FAIL', async () => {
    globalThis.fetch = async () => {
      throw new Error('fetch failed');
    };
    try {
      await fetchLiveBaseline({ baseUrl: SITE, logger: quiet, attempts: 2, delayMs: 0 });
      throw new Error('hata fırlatılmadı');
    } catch (err) {
      if (!/fetch failed|BASELINE_UNKNOWN/.test(err.message)) throw err;
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

// 16-17. Chunk durumları.
{
  test('16. Yeni child chunk -> NEW + timestamp', () => {
    const xml = buildChild({ '/': NOW });
    const children = makeChildren('sitemap-pages-2.xml', xml);
    const result = decideIndex(children, new Map(), { nowIso: NOW });
    const decision = result.decisions[0];
    if (decision.status !== 'NEW') throw new Error(`beklenen NEW, gelen ${decision.status}`);
    if (decision.lastmod !== NOW) throw new Error('NEW timestamp set edilmedi');
    if (decision.lastmodAction !== 'SET_NOW') throw new Error(`aksiyon ${decision.lastmodAction}`);
  });

  test('17. Eski child chunk kayboldu -> index’ten kaldırılır', () => {
    const live = makeChildren('sitemap-products.xml', buildChild({ '/sablon/x': NOW }));
    const liveMap = liveMapOf(live, NOW);
    const current = makeChildren('sitemap-pages.xml', buildChild({ '/': NOW }));
    const result = decideIndex(current, liveMap, { nowIso: NOW });
    if (!result.removed.includes(`${SITE}/sitemap-products.xml`)) {
      throw new Error('REMOVED child index’te kaldı');
    }
    if (parseSitemapIndex(result.indexXml).some((e) => e.loc.includes('sitemap-products'))) {
      throw new Error('stale child index kaydı bırakıldı');
    }
  });
}

// 18-20. Yapısal kapılar.
{
  test('18. Homepage eksik -> FAIL', () => {
    const indexable = [`${SITE}/`, `${SITE}/sss`];
    const sitemapLocs = [`${SITE}/sss`];
    const errors = validateParity(indexable, sitemapLocs);
    if (!errors.some((e) => e.includes('PARITY_MISSING') && e.includes(SITE))) {
      throw new Error('homepage kapısı yakalanmadı');
    }
  });

  test('19. 0 URL -> FAIL', () => {
    const { errors } = validateChildXml(renderUrlset([]), { nowIso: NOW });
    if (!errors.some((e) => e.includes('URL içermiyor'))) throw new Error('boş child yakalanmadı');
  });

  test('20. 50k URL sınırı -> FAIL', () => {
    const entries = Array.from({ length: 50_001 }, (_, i) => ({ loc: `${SITE}/sablon/sayfa-${i}`, lastmod: NOW }));
    const { errors } = validateChildXml(renderUrlset(entries), { nowIso: NOW });
    if (!errors.some((e) => e.includes('sınır'))) throw new Error('50k sınırı yakalanmadı');
  });
}

// 21-22. Yardımcı semantik doğrulamalar.
{
  test('21. Index lastmod ISO-8601 geçerli + future değil', () => {
    const xml = renderIndex([{ loc: `${SITE}/sitemap-pages.xml`, lastmod: NOW }]);
    const entries = parseSitemapIndex(xml);
    if (!entries.every((e) => e.lastmod && isValidLastmod(e.lastmod))) throw new Error('ISO geçersiz');
    if (entries.some((e) => isFuture(e.lastmod, NOW))) throw new Error('future');
  });

  test('22. URL-level ve index-level lastmod kaynakları karışmış olamaz', () => {
    const urlLastmod = buildChild({ '/': '2026-08-01' });
    const childEntries = parseUrlset(urlLastmod);
    if (!childEntries[0].lastmod) throw new Error('URL lastmod yok');
    if (!isValidLastmod(childEntries[0].lastmod)) throw new Error('URL lastmod geçersiz');
    const index = renderIndex([{ loc: `${SITE}/sitemap-pages.xml`, lastmod: NOW }]);
    const indexEntry = parseSitemapIndex(index)[0];
    if (indexEntry.lastmod === childEntries[0].lastmod) {
      throw new Error('index lastmod URL lastmod ile aynı olamaz');
    }
  });
}

// 23. Çekirdek senaryo: max(URL lastmod) aynı kalsa bile URL silindiğinde index lastmod değişir.
{
  test('23. Max URL lastmod aynı kalsa bile URL silindi -> index lastmod değişir', () => {
    const liveXml = renderUrlset([
      { loc: `${SITE}/a`, lastmod: '2026-08-01' },
      { loc: `${SITE}/b`, lastmod: '2026-07-15' },
      { loc: `${SITE}/c`, lastmod: '2026-06-20' },
    ]);
    const newXml = renderUrlset([
      { loc: `${SITE}/a`, lastmod: '2026-08-01' },
      { loc: `${SITE}/b`, lastmod: '2026-07-15' },
    ]);
    const children = makeChildren('sitemap-pages.xml', newXml);
    const liveMap = liveMapOf(makeChildren('sitemap-pages.xml', liveXml), '2026-08-05T00:00:00.000Z');
    const result = decideIndex(children, liveMap, { nowIso: NOW });
    const decision = result.decisions[0];
    if (decision.status !== 'CHANGED') throw new Error(`beklenen CHANGED, gelen ${decision.status}`);
    if (decision.lastmod !== NOW) throw new Error('lastmod SET_NOW değil');
    const maxUrl = Math.max(...parseUrlset(newXml).map((e) => Date.parse(e.lastmod)));
    if (Date.parse(decision.lastmod) === maxUrl) {
      throw new Error('index lastmod max(URL lastmod) kaynağından türetildi');
    }
  });
}

// 24. Migration modu yalnız explicit flag ile devreye girer; UNCHANGED bile SET_NOW alır.
{
  test('24. Migration modu: tüm mevcut child lastmod migration timestamp’ine alınır', () => {
    const xml = buildChild({ '/': NOW, '/sss': NOW });
    const children = makeChildren('sitemap-pages.xml', xml);
    const liveMap = liveMapOf(children);
    const result = decideIndex(children, liveMap, { nowIso: '2026-08-09T20:00:00.000Z', migration: true });
    const decision = result.decisions[0];
    if (decision.lastmodAction !== 'SET_NOW') throw new Error(`aksiyon ${decision.lastmodAction}`);
    if (decision.lastmod !== '2026-08-09T20:00:00.000Z') throw new Error('migration timestamp uygulanmadı');
  });
}

async function run() {
  for (const task of tasks) {
    try {
      await task.fn();
      passed++;
      console.log(`  PASS ${task.name}`);
    } catch (err) {
      failures.push(`${task.name}: ${err.message}`);
      console.error(`  FAIL ${task.name}: ${err.message}`);
    }
  }
  console.log(`\nSITEMAP INDEX SEMANTİK TESTLER: ${passed} PASS, ${failures.length} FAIL`);
  if (failures.length > 0) {
    console.error('KALDI:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

run();
