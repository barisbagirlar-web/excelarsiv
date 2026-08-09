import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkUrls, normalizeChangedUrls, readKey } from '../../../scripts/seo/indexnow.mjs';

test('INV-3.9 IndexNow yalnız temiz aynı-origin HTTPS changed/new URL kabul eder', () => {
  const urls = normalizeChangedUrls([
    'https://excelarsiv.com/sablon/a',
    'https://excelarsiv.com/sablon/a',
    'https://excelarsiv.com/rehber/b',
  ]);
  assert.deepEqual(urls, [
    'https://excelarsiv.com/rehber/b',
    'https://excelarsiv.com/sablon/a',
  ]);
  assert.throws(() => normalizeChangedUrls(['https://example.com/x']), /INDEXNOW_CROSS_ORIGIN/);
  assert.throws(() => normalizeChangedUrls(['https://excelarsiv.com/x?utm_source=test']), /INDEXNOW_DIRTY_URL/);
  assert.throws(() => normalizeChangedUrls(['http://excelarsiv.com/x']), /INDEXNOW_CROSS_ORIGIN|INDEXNOW_NON_HTTPS/);
});

test('INV-3.10 IndexNow batch protokol sınırı 10000 ve ownership key geçerli', () => {
  assert.equal(readKey().length >= 8, true);
  const urls = Array.from({ length: 10001 }, (_, i) => `https://excelarsiv.com/x-${i}`);
  const chunks = chunkUrls(urls);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 10000);
  assert.equal(chunks[1].length, 1);
  assert.throws(() => chunkUrls(urls, 10001), /INDEXNOW_BATCH_INVALID/);
});
