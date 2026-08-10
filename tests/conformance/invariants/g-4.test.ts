import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));

test('INV-G.4 negatif fixture gerçek exit 1 ve faz/branch bağımsız', () => {
  const env = {
    ...process.env,
    SITE_ID: 'excelarsiv',
    SEO_CHANGED_FILES: 'commerce/catalog.json',
    SEO_REVIEW_TEXT: 'SEO V6 yetki sınırı testi',
    SEO_COMMIT_TEXT: 'seo authority boundary test',
    SEO_CONFORMANCE_TEST: '1',
  };
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      resolve(ROOT, 'scripts/seo/preflight.ts'),
      '--contract-test',
      'governance',
    ],
    { cwd: ROOT, env, encoding: 'utf8' },
  );
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /P-03 FAIL/);
  assert.match(result.stdout, /commerce\/catalog\.json/);
});
