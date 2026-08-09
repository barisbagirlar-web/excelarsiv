# ExcelArsiv SEO Launch Runbook

This runbook is the operational launch sequence. It does not replace authenticated GSC/GA4 evidence gates. Commands are executed from repository root unless stated otherwise.

## T-0 — Release gate

Command:

```bash
SITE_ID=excelarsiv npm run seo:preflight
npm run seo:conformance
npm test
```

Expected result: preflight exits `0`; conformance reports `15/15 PASS` or the current contract-equivalent full PASS; build, SEO guards and smoke tests exit `0`.

On failure: stop release. Route manifest/config failures to the SEO contract owner; build/runtime failures to the application owner. Do not merge or deploy until the failing gate is green.

## T+0 — Crawl surface

Commands:

```bash
curl -fsS https://excelarsiv.com/robots.txt
curl -fsSI https://excelarsiv.com/sitemap.xml
curl -fsS https://excelarsiv.com/sitemap.xml | head
```

Expected result: public crawl paths are allowed except configured `policy.blockedSections`; sitemap responds `200` with XML content and references the current canonical inventory.

Action: submit `https://excelarsiv.com/sitemap.xml` in the verified Search Console property.

On failure: stop sitemap submission. Route robots/sitemap mismatch to SEO technical owner; HTTP/DNS/hosting failures to release/hosting owner.

## T+1 hour — Measurement and verification

GSC verification build input:

```bash
GSC_VERIFICATION_TOKEN='<value-from-GSC>' npm run build
```

Verification check after deployment:

```bash
curl -fsS https://excelarsiv.com/ | grep 'google-site-verification'
```

Expected result: one `google-site-verification` meta element containing the value supplied through `GSC_VERIFICATION_TOKEN`. The token must not be committed to Git.

GA4/Consent checks:

1. Open the site with no stored consent and verify analytics/ad storage are denied.
2. Reject consent and verify the Google tag is not loaded.
3. Accept consent and verify Consent Mode v2 signals update to granted according to the implemented contract.
4. Verify the five funnel events in GA4 DebugView when authenticated property access is available.

Expected result: consent behavior matches the Basic Consent Mode v2 contract; GA4 DebugView receives the approved events only after consent.

On failure: GSC meta failure → release/SEO owner. Consent failure → application/privacy owner. GA4 collection failure → analytics owner. Do not label measurement active until authenticated evidence exists.

## T+24 hours — First crawl signal

Commands/checks:

```text
Search Console > Settings / Crawl stats
Search Console > URL inspection for homepage + representative guide + representative product
```

Expected result: at least one post-launch crawl signal or URL-inspection fetch evidence. Absence is recorded as `SKIP_NO_DATA`; it is not converted into a PASS.

On failure/anomaly: compare live robots, canonical, HTTP status and sitemap membership first. Escalate unresolved crawl blocks to SEO technical owner.

## T+72 hours — Indexing cohort

Check Search Console Page indexing and sitemap reports by cohort: homepage, guide, product, category.

Expected result: index/discovery status is recorded per cohort. No fixed ranking or indexing outcome is promised; unavailable or insufficient data remains `SKIP_NO_DATA`.

On anomaly: inspect excluded reasons, canonical selection, redirects and rendered HTML. Create a corrective PR; do not edit production manually.

## T+28 days — Cold-start exit review

Command:

```bash
SITE_ID=excelarsiv npm run seo:coldstart-check -- --dry-run
```

Expected result when verified GSC coverage after `measurement.dataWindowStart` is at least the configured threshold: the command prints a PR recommendation to set `measurement.coldStart:false`. It must not mutate config automatically.

If coverage is below threshold or authenticated GSC input is unavailable: retain `coldStart:true`, keep confidence at `low`, and record the missing-data state.

On failure: invalid config → SEO contract owner; missing authenticated coverage → analytics/data owner.

## Release discipline

- Every corrective change uses a separate branch and PR.
- Conformance must be green before merge.
- Runtime changes deploy only after merge.
- Documentation, tests and other runtime-neutral changes do not trigger a production deploy.
- GSC verification values, GA4 credentials and provider secrets are environment-managed; never commit them.
