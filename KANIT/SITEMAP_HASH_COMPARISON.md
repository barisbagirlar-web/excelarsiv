# SITEMAP HASH KARŞILAŞTIRMASI — KANIT

- Tarih: 2026-08-09
- Branch: `hardening/sitemap-index-lastmod-semantics`
- Commit: `42ba95f`
- PR: [#26](https://github.com/barisbagirlar-web/excelarsiv/pull/26)
- Metot: generated hash `dist/seo-artifacts.json` (SHA-256, UTF-8 exact child XML bytes); live hash canlı production'dan (`curl` + `sha256sum`) okundu.

## Üretilen (dist) — 2026-08-09 build

Kaynak: `dist/seo-artifacts.json` (33 canonical URL, 2 child sitemap).

| Child | URL sayısı | generated_sha256 |
|---|---|---|
| sitemap-pages.xml | 21 | `dc99ab32d0a7a1de75588339651d934f882dd26b557964833b40d41e505f6d79` |
| sitemap-products.xml | 12 | `48e82b93d1cd0d7a7bfe2b609638f48bfe99b4464587c48322d8739bb24b53f5` |

## Canlı production baseline — 2026-08-09 (fetch)

Kaynak: `https://excelarsiv.com/sitemap.xml` + child'lar.

| Child | live_sha256 | Canlı index lastmod |
|---|---|---|
| sitemap-pages.xml | `dc99ab32d0a7a1de75588339651d934f882dd26b557964833b40d41e505f6d79` | `2026-08-08T21:50:11.000Z` |
| sitemap-products.xml | `48e82b93d1cd0d7a7bfe2b609638f48bfe99b4464587c48322d8739bb24b53f5` | `2026-08-06T00:00:00.000Z` |

## Karşılaştırma kararı

| Child | live == generated | Durum | LASTMOD_ACTION |
|---|---|---|---|
| sitemap-pages.xml | EVET | UNCHANGED | PRESERVE |
| sitemap-products.xml | EVET | UNCHANGED | PRESERVE |

## Kritik tespit: canlı index lastmod eski yasak mantıktan geliyor

Canlı index lastmod'ları ile üretilen child'lardaki max(URL lastmod) birebir eşleşiyor:

| Child | Canlı index lastmod | max(URL lastmod) |
|---|---|---|
| sitemap-pages.xml | `2026-08-08T21:50:11.000Z` | `2026-08-08T21:50:11.000Z` |
| sitemap-products.xml | `2026-08-06T00:00:00.000Z` | `2026-08-06T00:00:00.000Z` |

Bu, production index tarihlerinin yasaklanan `index lastmod = MAX(URL lastmod)` mantığıyla üretildiğinin kanıtıdır. Mandate madde 10 gereği bu tarihler **güvenilir baseline sayılamaz**; ilk geçişte explicit `SEO_SITEMAP_INDEX_MIGRATION=1` ile tüm child index lastmod'ları migration timestamp'ine alınır (`MIGRATION_BASELINE_RESET`).

## İlk migration deploy kararı

- Env: `SEO_SITEMAP_INDEX_MIGRATION=1` (yalnız ilk deploy için, sonra kapatılır; CI kalıcı açık flag'i FAIL eder)
- Beklenen sonuç: her child `status=CHANGED, lastmodAction=SET_NOW, lastmod=migration_timestamp`
- Sonraki deploy'lar: flag kapalı → UNCHANGED → PRESERVE

## Old/new index lastmod özeti

| Child | Eski (canlı, max-URL türevli) | Yeni (migration sonrası) |
|---|---|---|
| sitemap-pages.xml | `2026-08-08T21:50:11.000Z` | migration timestamp (SET_NOW) |
| sitemap-products.xml | `2026-08-06T00:00:00.000Z` | migration timestamp (SET_NOW) |

## Yöntem tekrarlanabilirliği

- Deterministik üretim: aynı girdi → aynı byte → aynı SHA-256 (test 1, 8; `npm run seo:test` 24/24 PASS).
- Hash yalnız karşılaştırma/kanıt içindir; sitemap XML içine hash yazılmaz.
