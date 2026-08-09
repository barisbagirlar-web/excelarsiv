import test from 'node:test';
import assert from 'node:assert/strict';
import { consentSignals, makeConsentRecord, parseConsentRecord } from '../../src/lib/consent.ts';
import { deniedFixture, validateConsentContract } from '../../scripts/seo/consent-contract.ts';

test('A2 consent v2 exposes all four denied/granted signals', () => {
  assert.deepEqual(consentSignals('denied'), {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  assert.deepEqual(consentSignals('granted'), {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
});

test('A2 denied fixture cannot become analytics eligible', () => {
  const fixture = deniedFixture();
  assert.equal(fixture.analyticsAllowed, false);
  assert.equal(Object.values(fixture.signals).every((value) => value === 'denied'), true);
});

test('A2 invalid/stale consent preference fails closed', () => {
  assert.equal(parseConsentRecord(null), null);
  assert.equal(parseConsentRecord('{"version":1,"status":"granted","updatedAt":"x"}'), null);
  assert.equal(parseConsentRecord('{broken'), null);
  const current = makeConsentRecord('granted', new Date('2026-08-09T00:00:00.000Z'));
  assert.equal(parseConsentRecord(JSON.stringify(current))?.status, 'granted');
});

test('A2 layout, CMP, event gate and dynamic tag loader stay contract compliant', () => {
  assert.deepEqual(validateConsentContract(), []);
});
