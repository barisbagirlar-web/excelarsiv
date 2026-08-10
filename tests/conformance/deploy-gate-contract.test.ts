import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const workflow = readFileSync(resolve(ROOT, '.github/workflows/deploy-firebase.yml'), 'utf8');
const classifier = workflow.match(/- name: Detect runtime changes([\s\S]*?)- name: Use Node\.js 22/)?.[1] ?? '';

test('deploy gate — production önce merged PR + required green CI provenance ister', () => {
  assert.match(workflow, /Verify merged PR provenance and required green CI/);
  assert.match(workflow, /scripts\/ci\/release-provenance\.ts/);
  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /pull-requests:\s*read/);
});

test('deploy classifier — package.json runtime girdisi, workflow dosyası runtime girdisi değildir', () => {
  assert.ok(classifier.length > 0, 'runtime classifier bulunamadı');
  assert.match(classifier, /package\.json/);
  assert.doesNotMatch(classifier, /\.github\/workflows\/deploy-firebase\.yml/);
});

test('deploy classifier — paid delivery ayrı runtime sınıfıdır', () => {
  assert.match(classifier, /delivery_changed=false/);
  assert.match(classifier, /delivery\/paid-products\//);
  assert.match(classifier, /scripts\/sync-paid-products\.mjs/);
  assert.match(classifier, /scripts\/check-paid-products\.mjs/);
  assert.match(classifier, /delivery_changed.*runtime_changed|runtime_changed.*delivery_changed/s);
});

test('paid delivery — sync apply sonrası exact repo-storage parity gate zorunlu', () => {
  assert.match(workflow, /node scripts\/sync-paid-products\.mjs --apply/);
  assert.match(workflow, /node scripts\/check-paid-products\.mjs --strict --verify-local-parity/);
  const syncIndex = workflow.indexOf('node scripts/sync-paid-products.mjs --apply');
  const parityIndex = workflow.indexOf('node scripts/check-paid-products.mjs --strict --verify-local-parity');
  const hostingIndex = workflow.indexOf('firebase deploy --project "$FIREBASE_PROJECT_ID" --only "hosting:$FIREBASE_HOSTING_SITE"');
  assert.ok(syncIndex >= 0 && parityIndex > syncIndex, 'parity sync sonrasında çalışmalı');
  assert.ok(hostingIndex < 0 || parityIndex < hostingIndex, 'parity Hosting release öncesinde çalışmalı');
});

test('manual dispatch — varsayılan olarak backend/hosting/delivery force etmez', () => {
  for (const input of ['force_backend', 'force_hosting', 'force_delivery']) {
    const block = workflow.match(new RegExp(`${input}:[\\s\\S]*?default:\\s*false`));
    assert.ok(block, `${input}: default false eksik`);
  }
});
