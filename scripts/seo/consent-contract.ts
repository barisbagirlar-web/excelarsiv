import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, consentSignals, hasAnalyticsConsent, makeConsentRecord, parseConsentRecord } from '../../src/lib/consent.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function validateConsentContract(): string[] {
  const errors: string[] = [];
  const layout = source('src/layouts/CommerceLayout.astro');
  const bootstrap = source('src/components/AnalyticsBootstrap.astro');
  const banner = source('src/components/ConsentBanner.astro');
  const analytics = source('src/lib/analytics.ts');
  const breaks = JSON.parse(source('data/seo/structural_breaks.json')) as Array<{ date?: string; type?: string; note?: string }>;

  if (/<script[^>]+src=["'][^"']*googletagmanager\.com\/gtag\/js/i.test(layout)) errors.push('DIRECT_GOOGLE_TAG_IN_LAYOUT');
  if (!layout.includes('<AnalyticsBootstrap')) errors.push('ANALYTICS_BOOTSTRAP_MISSING');
  if (!layout.includes('<ConsentBanner')) errors.push('CONSENT_BANNER_MISSING');

  for (const signal of ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization']) {
    if (!bootstrap.includes(`${signal}: 'denied'`)) errors.push(`DEFAULT_DENIED_MISSING:${signal}`);
    if (!bootstrap.includes(`${signal}: 'granted'`)) errors.push(`GRANTED_SIGNAL_MISSING:${signal}`);
  }

  if (!bootstrap.includes("normalized === 'granted') loadGoogleTag()")) errors.push('GOOGLE_TAG_NOT_GRANT_GATED');
  if (!bootstrap.includes('googletagmanager.com/gtag/js')) errors.push('GOOGLE_TAG_DYNAMIC_LOADER_MISSING');
  if (!banner.includes('Yalnızca Gerekli') || !banner.includes('Tümünü Kabul Et')) errors.push('TR_CMP_ACTIONS_MISSING');
  if (!analytics.includes('if (!hasAnalyticsConsent()) return false;')) errors.push('EVENT_CONSENT_GATE_MISSING');
  if (!breaks.some((item) => item.note === 'consent v2 live')) errors.push('STRUCTURAL_BREAK_MISSING');
  return errors;
}

function deniedFixture(): { stored: string; analyticsAllowed: boolean; signals: ReturnType<typeof consentSignals> } {
  const record = makeConsentRecord('denied', new Date('2026-08-09T00:00:00.000Z'));
  const stored = JSON.stringify(record);
  const storage = { getItem: (key: string) => key === CONSENT_STORAGE_KEY ? stored : null };
  return {
    stored,
    analyticsAllowed: hasAnalyticsConsent(storage),
    signals: consentSignals(parseConsentRecord(stored)?.status ?? 'denied'),
  };
}

function main(): void {
  const fixture = deniedFixture();
  console.log(`CONSENT VERSION ${CONSENT_VERSION}`);
  console.log(`NEGATIVE FIXTURE analyticsAllowed=${fixture.analyticsAllowed}`);
  console.log(`NEGATIVE FIXTURE signals=${JSON.stringify(fixture.signals)}`);
  const errors = validateConsentContract();
  if (fixture.analyticsAllowed) errors.push('DENIED_FIXTURE_ALLOWED_ANALYTICS');
  if (Object.values(fixture.signals).some((value) => value !== 'denied')) errors.push('DENIED_FIXTURE_SIGNAL_LEAK');
  if (errors.length) {
    for (const error of errors) console.error(`FAIL ${error}`);
    process.exit(1);
  }
  console.log('CONSENT V2 CONTRACT PASS — denied fixture=0 analytics eligibility, direct tag load=0');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { deniedFixture, validateConsentContract };
