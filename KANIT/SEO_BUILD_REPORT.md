# SEO BUILD REPORT — KANIT

- Tarih: 2026-08-09
- Branch: `hardening/sitemap-index-lastmod-semantics`
- Commit: `42ba95f`
- PR: [#26](https://github.com/barisbagirlar-web/excelarsiv/pull/26)
- Komut: `npm test` (gerçek çıktı aşağıdadır)

## Zincir

```
validate-commerce → guard:source → astro build → seo:generate → seo:validate → seo:test → seo:guard → smoke-test
```

## Gerçek çıktı

```
Commerce validation OK: 12 ürün, 4 Shopier seviyesi, 8 güvenli API rotası, public Excel binary=0.
SOURCE LANGUAGE GUARD GEÇTİ — 107 teknik kaynak dosyası tarandı.
Astro build: 34 page(s) built
SEO ARTIFACTS GENERATED — 33 canonical URL, 2 child sitemap, 12 product record
Generated: llms-full.txt, llms.txt, seo-artifacts.json, sitemap-pages.xml, sitemap-products.xml, sitemap.xml
SEO QUALITY GATE GEÇTİ — 33 indexlenebilir URL, 33 sitemap URL, 2 child sitemap
SITEMAP INDEX SEMANTİK TESTLER: 24 PASS, 0 FAIL
SEO ENTERPRISE GUARD GEÇTİ — 34 HTML, 33 indexlenebilir sayfa, click-depth ≤ 4.
SMOKE TEST GEÇTİ — 34 sayfa render, kırık iç link yok
```

## Kapı durumu

| Kapı | Beklenen | Sonuç |
|---|---|---|
| Branch isolation | PASS | hardening/sitemap-index-lastmod-semantics |
| Unrelated diff | 0 | B grubu (DNA.txt/README.md/cikti/kur/yeni_calisma_ilkeleri) commit'e alınmadı |
| Source language guard | PASS | 107 dosya |
| Deterministic child XML | PASS | test 1, 8 |
| Child SHA-256 | PASS | 2 child, manifest yazıldı |
| URL semantic lastmod | PASS | product updatedAt / git commit time |
| Index semantic lastmod | PASS | finalizer + 24 test |
| No-op build timestamp stability | PASS | test 1, 2 |
| URL addition/deletion/canonical detection | PASS | test 3, 4, 5, 6 |
| Baseline failure fail-safe | PASS | test 14, 15 |
| Duplicate URL | 0 | kapı PASS (test 9) |
| Noindex leakage | 0 | kapı PASS (test 10) |
| Future timestamps | 0 | kapı PASS (test 12, 13, 21) |
| Broken sitemap URL | 0 | smoke + parity GEÇTİ |

## Finalizer simülasyonu (canlıya dokunmadan, baseline dosyasıyla)

- sitemap-pages.xml: `UNCHANGED / PRESERVE / 2026-08-01T10:00:00.000Z`
- sitemap-products.xml: `CHANGED / SET_NOW / 2026-08-08T22:59:57.702Z`
- sitemap-pages-2.xml: `REMOVED`
- Finalize sonrası `seo:validate` GEÇTİ.

## Akış kararı

- PR CI (Validate: build-and-smoke-test, Production dependency audit, Trivy) tamamen GREEN → merge
- Migration deploy (SEO_SITEMAP_INDEX_MIGRATION=1) → hosting deploy → canlı sözleşme
