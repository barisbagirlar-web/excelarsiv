import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));

test('INV-0.2 negatif fixture: Faz 0 runtime yazımı gerçek exit 1', () => {
  const env = {
    ...process.env,
    SITE_ID: 'excelarsiv',
    SEO_CONFORMANCE_TEST: '1',
    SEO_CHANGED_FILES: 'src/pages/index.astro',
    SEO_REVIEW_TEXT: 'Faz 0 keşif',
    SEO_COMMIT_TEXT: 'seo faz 0 keşif'
  };
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', resolve(ROOT, 'scripts/seo/preflight.ts'), '--contract-test', 'faz-00'],
    { cwd: ROOT, env, encoding: 'utf8' }
  );
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
});
