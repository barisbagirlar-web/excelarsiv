import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrationAuthorizedFromMessage, validateBaselineIndexEntries } from '../../../scripts/seo/finalize-sitemap-index.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const SITE = 'https://excelarsiv.com';

test('S24 Firebase Hosting deploy cannot bypass sitemap finalizer gate', () => {
  const config = JSON.parse(readFileSync(resolve(ROOT, 'firebase.json'), 'utf8'));
  const hosting = Array.isArray(config.hosting)
    ? config.hosting.find((entry: { target?: string }) => entry.target === 'excelarsiv')
    : config.hosting;
  assert.ok(hosting, 'excelarsiv hosting target missing');
  assert.deepEqual(hosting.predeploy, ['node scripts/seo/hosting-predeploy.cjs']);

  const wrapperPath = resolve(ROOT, 'scripts/seo/hosting-predeploy.cjs');
  assert.equal(existsSync(wrapperPath), true, 'hosting-predeploy.cjs wrapper missing');
  const wrapper = readFileSync(wrapperPath, 'utf8');
  assert.match(wrapper, /hosting-predeploy\.mjs/);
  assert.match(wrapper, /PREDEPLOY_NODE/);
  assert.match(wrapper, /\.cache\/firebase\/runtime/);
  assert.match(wrapper, /import\(girilen\)/);
});

test('migration is explicit and single-commit marker based', () => {
  assert.equal(migrationAuthorizedFromMessage('normal seo deploy'), false);
  assert.equal(migrationAuthorizedFromMessage('[sitemap-migration] repair raw index'), true);
});

test('missing index lastmod remains blocked normally but can be read only in explicit migration mode', () => {
  const entries = [{ loc: `${SITE}/sitemap-pages.xml`, lastmod: null }];
  assert.throws(() => validateBaselineIndexEntries(entries, { baseUrl: SITE }), /BASELINE_UNKNOWN/);
  assert.equal(validateBaselineIndexEntries(entries, { baseUrl: SITE, allowMissingLastmod: true }), true);
});
