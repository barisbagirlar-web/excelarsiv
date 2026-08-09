import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeShrink, calculateUrlDelta } from '../../../scripts/seo/finalize-sitemap-index.mjs';
import { getTemplateRecords, gitLastModified, semanticLastModified, sourceForPath } from '../../../scripts/seo/lib.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));

test('INV-3.5 sitemap ani URL düşüşü yüzde 20 üzerinde insan onayı olmadan BLOCK', () => {
  assert.throws(
    () => assertSafeShrink({ generatedCount: 79, liveCount: 100 }),
    /SITEMAP_SUDDEN_SHRINK/,
  );
  assert.doesNotThrow(() => assertSafeShrink({ generatedCount: 80, liveCount: 100 }));
  const overridden = assertSafeShrink({ generatedCount: 79, liveCount: 100, allowShrink: true });
  assert.equal(overridden.approved, true);
  assert.ok(overridden.dropRatio > 0.20);
});

test('INV-3.6 sitemap URL delta added changed removed ve changedOrNew ayrımını doğru üretir', () => {
  const live = [
    { loc: 'https://excelarsiv.com/a', lastmod: '2026-08-01' },
    { loc: 'https://excelarsiv.com/b', lastmod: '2026-08-01' },
  ];
  const generated = [
    { loc: 'https://excelarsiv.com/a', lastmod: '2026-08-10' },
    { loc: 'https://excelarsiv.com/c', lastmod: '2026-08-10' },
  ];
  assert.deepEqual(calculateUrlDelta(generated, live), {
    added: ['https://excelarsiv.com/c'],
    changed: ['https://excelarsiv.com/a'],
    removed: ['https://excelarsiv.com/b'],
    changedOrNew: ['https://excelarsiv.com/a', 'https://excelarsiv.com/c'],
  });
});

test('INV-3.7 rehber lastmod kaynağı gerçek guide içerik dosyasıdır', () => {
  const source = sourceForPath('/rehber/stok-takip-excel');
  assert.ok(source);
  assert.ok(source?.endsWith('src/content/guides/stok-takip-excel.mdx'), String(source));
});

test('INV-3.8 ürün semantic lastmod SEO metadata bağımlılığını kapsar', () => {
  const productSeoFile = resolve(ROOT, 'src/data/productSeo.ts');
  const seoChangedAt = gitLastModified(productSeoFile);
  assert.ok(seoChangedAt, 'productSeo.ts git lastmod bulunamadı');
  const page = { pathname: '/sablon/stok-satis-ve-nakit-baglanma-sistemi' };
  const semantic = semanticLastModified(page, getTemplateRecords());
  assert.ok(semantic, 'semantic lastmod bulunamadı');
  assert.ok(semantic!.valueOf() >= seoChangedAt!.valueOf(), `${semantic?.toISOString()} < ${seoChangedAt?.toISOString()}`);
});
