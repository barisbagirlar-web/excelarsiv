// Offline sitemap-index semantik testleri (madde 11 zorunlu matris).
// Production ağına bağımlı değildir; fixture/mock baseline kullanır.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { renderUrlset } from './generate-artifacts.mjs';
import {
  decideIndex,
  fetchLiveBaseline,
  parseSitemapIndex,
  parseUrlset,
  renderIndex,
  sha256,
} from './finalize-sitemap-index.mjs';
import { runAllGates, validateChild, validateIndex, isFuture, isValidLastmod } from './validate-artifacts.mjs';

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

function buildChild(file, lastmods = {}) {
  const entries = Object.entries(lastmods).map(([path, lastmod]) => ({
    loc: `${SITE}${path}`,
    lastmod,
  }));
  return renderUrlset(entries);
}

function baselineFor(children) {
  return {
    index: {
      children: children.map((child) => ({
        loc: child.loc,
        lastmod: '2026-08-01T00:00:00.000Z',
        sha256: child.sha256,
      })),
    },
  };
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

// 1-2. Aynı build / deploy tekrarı -> hash ve index lastmod sabit.
{
  const xml = buildChild('', { '/': NOW, '/sss': NOW });
  const children = makeChildren('sitemap-pages.xml', xml);
  const baseline = baselineFor(children);

  test('1. Aynı build iki kez -> hash aynı, index lastmod aynı', () => {
    const again = buildChild('', { '/': NOW, '/sss': NOW });
    if (hashOf(xml) !== hashOf(again)) throw new Error('hash farklı');
    const first = decideIndex(children, new Map(baseline.index.children.map((c) => [c.loc, c])), {
      nowIso: NOW,
    });
    const second = decideIndex(children, new Map(baseline.index.children.map((c) => [c.loc, c])), {
      nowIso: '2026-08-09T13:00:00.000Z',
    });
    if (first.indexXml !== second.indexXml) throw new Error('index lastmod değişti');
  });

  test('2. Yalnız deploy tekrarı -> lastmod değişmez (PRESERVE)', () => {
    const result = decideIndex(children, new Map(baseline.index.children.map((c) => [c.loc, c])), {
      nowIso: '2026-08-09T14:00:00.000Z',
    });
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
  const xmlBase = buildChild('', baseMods);
  const baseChildren = makeChildren('sitemap-pages.xml', xmlBase);
  const liveMap = (children) => new Map(baselineFor(children).index.children.map((c) => [c.loc, c]));

  const expectChanged = (label, newXml) => {
    const children = makeChildren('sitemap-pages.xml', newXml);
    const result = decideIndex(children, liveMap(baseChildren), { nowIso: NOW });
    const decision = result.decisions[0];
    if (hashOf(newXml) === hashOf(xmlBase)) throw new Error(`${label}: hash değişmedi`);
    if (decision.status !== 'CHANGED') throw new Error(`${label}: beklenen CHANGED, gelen ${decision.status}`);
    if (decision.lastmod !== NOW) throw new Error(`${label}: lastmod SET_NOW değil`);
  };

  test('3. Yeni URL eklendi -> hash + lastmod değişir', () => {
    expectChanged('url eklendi', buildChild('', { ...baseMods, '/yeni-sayfa': NOW }));
  });

  test('4. URL silindi -> hash + lastmod değişir', () => {
    expectChanged('url silindi', buildChild('', { '/': NOW, '/sss': NOW }));
  });

  test('5. URL canonical değişti -> hash + lastmod değişir', () => {
    expectChanged('canonical', buildChild('', { '/': NOW, '/sss-yeni': NOW, '/paketler': NOW }));
  });

  test('6. URL semantic lastmod değişti -> hash + lastmod değişir', () => {
    expectChanged('semantic lastmod', buildChild('', { '/': NOW, '/sss': '2026-08-07', '/paketler': NOW }));
  });

  test('7. İlgisiz değişiklik -> sitemap hash değişmez', () => {
    const unchanged = buildChild('', baseMods);
    if (hashOf(unchanged) !== hashOf(xmlBase)) throw new Error('hash değişti');
    const result = decideIndex(makeChildren('sitemap-pages.xml', unchanged), liveMap(baseChildren), {
      nowIso: NOW,
    });
    if (result.decisions[0].status !== 'UNCHANGED') throw new Error('UNCHANGED değil');
  });
}

// 8. Sıralama determinizmi.
{
  test('8. Child sıralama aynı inputta byte-identical', () => {
    const entries = [
      { loc: `${SITE}/zzz`, lastmod: NOW },
      { loc: `${SITE}/aaa`, lastmod: NOW },
      { loc: `${SITE}/mmm`, lastmod: NOW },
    ];
    const a = renderUrlset([...entries].sort((x, y) => x.loc.localeCompare(y.loc, 'en')));
    const b = renderUrlset([...entries].sort((x, y) => x.loc.localeCompare(y.loc, 'en')));
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
    const { errors } = validateChild(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('duplicate URL'))) throw new Error('duplicate yakalanmadı');
  });

  test('10. noindex URL sitemap içinde -> FAIL', () => {
    const tmp = join(resolve(import.meta.dirname, '..', '..', '..'), '.astro', 'seo-test-noindex');
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(join(tmp, 'gizli'), { recursive: true });
    const noindexUrl = `${SITE}/gizli`;
    writeFileSync(
      join(tmp, 'seo-artifacts.json'),
      JSON.stringify({
        site: SITE,
        children: [{ file: 'sitemap-pages.xml', urlCount: 1, sha256: 'x' }],
      }),
    );
    writeFileSync(
      join(tmp, 'sitemap-pages.xml'),
      renderUrlset([{ loc: noindexUrl, lastmod: NOW }]),
    );
    writeFileSync(join(tmp, 'gizli', 'index.html'), '<meta name="robots" content="noindex,follow">');
    writeFileSync(join(tmp, 'llms.txt'), 'llms');
    writeFileSync(join(tmp, 'llms-full.txt'), 'llms-full');
    const { errors } = runAllGates({ dist: tmp, nowIso: NOW });
    rmSync(tmp, { recursive: true, force: true });
    if (!errors.some((e) => e.includes('noindex'))) throw new Error('noindex sızıntısı yakalanmadı');
  });

  test('11. Query parametreli canonical -> FAIL', () => {
    const xml = renderUrlset([{ loc: `${SITE}/?utm=x`, lastmod: NOW }]);
    const { errors } = validateChild(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('query param'))) throw new Error('query param yakalanmadı');
  });

  test('12. Future URL lastmod -> FAIL', () => {
    const xml = renderUrlset([{ loc: `${SITE}/`, lastmod: '2099-01-01T00:00:00.000Z' }]);
    const { errors } = validateChild(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('future'))) throw new Error('future lastmod yakalanmadı');
  });

  test('13. Future child index lastmod -> FAIL', () => {
    const xml = renderIndex([{ loc: `${SITE}/sitemap-pages.xml`, lastmod: '2099-01-01T00:00:00.000Z' }]);
    const { errors } = validateIndex(xml, [`${SITE}/sitemap-pages.xml`], { nowIso: NOW });
    if (!errors.some((e) => e.includes('future'))) throw new Error('index future yakalanmadı');
  });
}

// 14-15. Baseline başarısızlık doktrini.
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
    const xml = buildChild('', { '/': NOW });
    const children = makeChildren('sitemap-pages-2.xml', xml);
    const result = decideIndex(children, new Map(), { nowIso: NOW });
    const decision = result.decisions[0];
    if (decision.status !== 'NEW') throw new Error(`beklenen NEW, gelen ${decision.status}`);
    if (decision.lastmod !== NOW) throw new Error('NEW timestamp set edilmedi');
  });

  test('17. Eski child chunk kayboldu -> index’ten kaldırılır', () => {
    const live = makeChildren('sitemap-products.xml', buildChild('', { '/sablon/x': NOW }));
    const liveMap = new Map(live.map((c) => [c.loc, { ...c, lastmod: NOW }]));
    const current = makeChildren('sitemap-pages.xml', buildChild('', { '/': NOW }));
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
  const tmp = join(resolve(import.meta.dirname, '..', '..', '..'), '.astro', 'seo-test-empty');

  test('18. Homepage eksik -> FAIL', () => {
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    writeFileSync(
      join(tmp, 'seo-artifacts.json'),
      JSON.stringify({ site: SITE, children: [{ file: 'sitemap-pages.xml', urlCount: 1, sha256: 'x' }] }),
    );
    writeFileSync(join(tmp, 'sitemap-pages.xml'), renderUrlset([{ loc: `${SITE}/sss`, lastmod: NOW }]));
    writeFileSync(join(tmp, 'llms.txt'), 'llms');
    writeFileSync(join(tmp, 'llms-full.txt'), 'llms-full');
    const { errors } = runAllGates({ dist: tmp, nowIso: NOW });
    rmSync(tmp, { recursive: true, force: true });
    if (!errors.some((e) => e.includes('homepage'))) throw new Error('homepage kapısı yakalanmadı');
  });

  test('19. 0 URL -> FAIL', () => {
    const xml = renderUrlset([]);
    const { errors } = validateChild(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('0 URL'))) throw new Error('boş child yakalanmadı');
  });

  test('20. 50k URL sınırı -> FAIL', () => {
    const entries = Array.from({ length: 50_001 }, (_, i) => ({ loc: `${SITE}/sablon/sayfa-${i}`, lastmod: NOW }));
    const xml = renderUrlset(entries);
    const { errors } = validateChild(xml, { nowIso: NOW });
    if (!errors.some((e) => e.includes('sınır'))) throw new Error('50k sınırı yakalanmadı');
  });
}

// 21. Yardımcı semantik doğrulamalar.
{
  test('21. Index lastmod ISO-8601 geçerli + future değil', () => {
    const xml = renderIndex([{ loc: `${SITE}/sitemap-pages.xml`, lastmod: NOW }]);
    const entries = parseSitemapIndex(xml);
    if (!entries.every((e) => e.lastmod && isValidLastmod(e.lastmod))) throw new Error('ISO geçersiz');
    if (entries.some((e) => isFuture(e.lastmod, NOW))) throw new Error('future');
  });

  test('22. URL-level ve index-level lastmod kaynakları karışmış olamaz', () => {
    const urlLastmod = buildChild('', { '/': '2026-08-01' });
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
