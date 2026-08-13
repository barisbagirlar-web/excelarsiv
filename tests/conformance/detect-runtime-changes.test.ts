import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectRuntimeChanges,
  selectLayerBaselines,
  HOSTING_PATHS,
} from '../../scripts/ci/detect-runtime-changes.ts';

const hostingSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const docsSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

test('HEAD^ docs-only olsa bile son Hosting SHA sonrası src farkı hosting=true', () => {
  const result = detectRuntimeChanges({
    eventName: 'push',
    force: { backend: false, hosting: false, delivery: false },
    baselines: { hosting: hostingSha, backend: hostingSha, delivery: hostingSha },
    pathChangedSince: (base, paths) => base === hostingSha && paths.includes('src/'),
  });
  assert.equal(result.hosting_changed, true);
  assert.equal(result.backend_changed, false);
  assert.equal(result.delivery_changed, false);
  assert.equal(result.runtime_changed, true);
});

test('son Hosting SHA sonrası hosting path yoksa hosting=false — gereksiz deploy yok', () => {
  const result = detectRuntimeChanges({
    eventName: 'push',
    force: { backend: false, hosting: false, delivery: false },
    baselines: { hosting: docsSha, backend: docsSha, delivery: docsSha },
    pathChangedSince: () => false,
  });
  assert.equal(result.hosting_changed, false);
  assert.equal(result.runtime_changed, false);
});

test('hosting baseline yoksa fail-closed hosting=true; functions HEAD^ fallback', () => {
  const result = detectRuntimeChanges({
    eventName: 'push',
    force: { backend: false, hosting: false, delivery: false },
    baselines: { hosting: null, backend: null, delivery: null },
    pathChangedSince: (base) => {
      if (base === 'HEAD^') return false;
      return true;
    },
  });
  assert.equal(result.hosting_changed, true);
  assert.equal(result.reasons.hosting, 'NO_BASELINE_FAIL_CLOSED');
  assert.equal(result.backend_changed, false);
  assert.equal(result.delivery_changed, false);
  assert.match(result.reasons.backend, /^HEAD\^_FALLBACK:/);
});

test('workflow_dispatch force bayraklarını kullanır; git diff yok', () => {
  const result = detectRuntimeChanges({
    eventName: 'workflow_dispatch',
    force: { backend: false, hosting: true, delivery: false },
    baselines: { hosting: null, backend: null, delivery: null },
    pathChangedSince: () => {
      throw new Error('dispatch must not diff');
    },
  });
  assert.equal(result.hosting_changed, true);
  assert.equal(result.backend_changed, false);
  assert.equal(result.runtime_changed, true);
});

test('selectLayerBaselines hosting success step SHA seçer; skipped run atlanır', () => {
  const baselines = selectLayerBaselines(
    [
      { id: 1, head_sha: docsSha, status: 'completed', conclusion: 'success' },
      { id: 2, head_sha: hostingSha, status: 'completed', conclusion: 'success' },
    ],
    {
      1: [{ steps: [{ name: 'Deploy Firebase Hosting', conclusion: 'skipped' }] }],
      2: [{ steps: [{ name: 'Deploy Firebase Hosting', conclusion: 'success' }] }],
    },
    null,
  );
  assert.equal(baselines.hosting, hostingSha);
});

test('HOSTING_PATHS src/ içerir; workflow dosyası hosting tetiklemez', () => {
  assert.equal(HOSTING_PATHS.includes('src/'), true);
  assert.equal(
    (HOSTING_PATHS as readonly string[]).includes('.github/workflows/deploy-firebase.yml'),
    false,
  );
});
