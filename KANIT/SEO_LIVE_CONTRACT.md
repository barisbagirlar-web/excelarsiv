# SEO CANLI SÖZLEŞME — KANIT

- Tarih: 2026-08-09
- PR: [#26](https://github.com/barisbagirlar-web/excelarsiv/pull/26)
- Merge commit: `2cfaeef`
- Deploy run: [31283236345](https://github.com/barisbagirlar-web/excelarsiv/actions/runs/31283236345) — **SUCCESS**
- Migration deploy: `SEO_SITEMAP_INDEX_MIGRATION=1` (yalnız bu deploy için kuruldu, sonrasında silindi)

## Deploy adım sonuçları (CI, gerçek çıktı)

| Adım | Sonuç |
|---|---|
| Validate commerce, build and smoke test | success (24/24 semantik test PASS) |
| Finalize sitemap index (canlı baseline ile) | success |
| Deploy Firebase Hosting | success |
| Functions deploy | skipped (backend değişmedi) |
| Verify custom domain | success |
| SEO live contract | success |

## Finalizer CI çıktısı

```
BASELINE: 2 child okundu.
SITEMAP INDEX SEMANTIC CONTRACT
  status          : CHANGED
  lastmod_action  : SET_NOW
  lastmod         : 2026-08-08T23:07:56.217Z
  status          : CHANGED
  lastmod_action  : SET_NOW
  lastmod         : 2026-08-08T23:07:56.217Z
SITEMAP INDEX YAZILDI: dist/sitemap.xml
SEO QUALITY GATE GEÇTİ
```

`MIGRATION_BASELINE_RESET`: her iki child da migration timestamp'ine alındı (eski max(URL lastmod) türevli tarihler temizlendi).

## Canlı production doğrulaması (deploy sonrası, 2026-08-09)

### Canlı index

```
https://excelarsiv.com/sitemap.xml
  sitemap-pages.xml    lastmod 2026-08-08T23:07:56.217Z
  sitemap-products.xml  lastmod 2026-08-08T23:07:56.217Z
```

### Old/new index lastmod

| Child | Eski (max-URL türevli) | Yeni (migration) |
|---|---|---|
| sitemap-pages.xml | `2026-08-08T21:50:11.000Z` | `2026-08-08T23:07:56.217Z` |
| sitemap-products.xml | `2026-08-06T00:00:00.000Z` | `2026-08-08T23:07:56.217Z` |

### Canlı child hash (içerik değişmedi, determinant korundu)

| Child | Canlı sha256 | Generated sha256 |
|---|---|---|
| sitemap-pages.xml | `dc99ab32…` | `dc99ab32…` |
| sitemap-products.xml | `48e82b93…` | `48e82b93…` |

## Canlı sözleşme sonucu

CI adımı: `SEO LIVE CONTRACT PASS`
Yerel doğrulama (`node scripts/seo/live-contract.mjs`, production'a karşı):

```
SEO LIVE CONTRACT: 182 kontrol, 0 hata
SEO LIVE CONTRACT PASS
```

Kapsam: robots.txt sitemap bildirimi, sitemap.xml sitemapindex kökü, child ISO lastmod + future değil + duplicate yok, her child HTTP 200 + `<urlset>` + changefreq/priority yok, her URL HTTP 200 + self-canonical + noindex yok + H1 + JSON-LD, homepage explicit.

## Sonraki deploy beklentisi (migration kapalı)

Sonraki deploy'larda `SEO_SITEMAP_INDEX_MIGRATION` yok → çocuklar UNCHANGED oldukça `PRESERVE` uygulanacak; gerçek içerik değişiminde tek `SET_NOW` verilecek. CI'de migration flag'in workflow'a kalıcı yazılması FAIL eder.
