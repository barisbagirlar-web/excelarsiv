import test from 'node:test';
import assert from 'node:assert/strict';
import { analytics } from '../../src/config/analytics.ts';
import { buildEventMap, validateEventContract } from '../../scripts/seo/analytics-event-contract.ts';

test('A1 event names are centralized and exact', () => {
  assert.deepEqual(analytics.events, {
    templateView: 'template_view',
    downloadStart: 'download_start',
    downloadComplete: 'download_complete',
    signup: 'signup',
    checkoutIntent: 'checkout_intent',
  });
});

test('A1 event map covers every required funnel event and payload', () => {
  const rows = buildEventMap();
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((row) => row.name).sort(), [
    'checkout_intent',
    'download_complete',
    'download_start',
    'signup',
    'template_view',
  ]);
  assert.deepEqual(validateEventContract(), []);
});
