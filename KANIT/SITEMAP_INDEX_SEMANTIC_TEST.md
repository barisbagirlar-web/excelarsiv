# SITEMAP INDEX SEMANTİK TEST MATRİSİ — KANIT

- Tarih: 2026-08-09
- Branch: `hardening/sitemap-index-lastmod-semantics`
- Commit: `42ba95f`
- PR: [#26](https://github.com/barisbagirlar-web/excelarsiv/pull/26)
- Komut: `node scripts/seo/test-sitemap-index-semantics.mjs` (production ağına bağımlı değil, fixture/mock baseline)

## Sonuç

```
SITEMAP INDEX SEMANTİK TESTLER: 24 PASS, 0 FAIL
```

## Gerçek çıktı (uydurma değil, çalıştırıldı)

```
  PASS 1. Aynı build iki kez -> hash aynı, index lastmod aynı
  PASS 2. Yalnız deploy tekrarı -> lastmod değişmez (PRESERVE)
  PASS 3. Yeni URL eklendi -> hash + lastmod değişir
  PASS 4. URL silindi -> hash + lastmod değişir
  PASS 5. URL canonical değişti -> hash + lastmod değişir
  PASS 6. URL semantic lastmod değişti -> hash + lastmod değişir
  PASS 7. İlgisiz değişiklik -> sitemap hash değişmez
  PASS 8. Child sıralama aynı inputta byte-identical
  PASS 9. Duplicate URL -> FAIL
  PASS 10. noindex URL sitemap içinde -> FAIL
  PASS 11. Query parametreli canonical -> FAIL
  PASS 12. Future URL lastmod -> FAIL
  PASS 13. Future child index lastmod -> FAIL
  PASS 14. Baseline HTTP 500 -> DEPLOY FAIL
  PASS 15. Baseline timeout -> DEPLOY FAIL
  PASS 16. Yeni child chunk -> NEW + timestamp
  PASS 17. Eski child chunk kayboldu -> index’ten kaldırılır
  PASS 18. Homepage eksik -> FAIL
  PASS 19. 0 URL -> FAIL
  PASS 20. 50k URL sınırı -> FAIL
  PASS 21. Index lastmod ISO-8601 geçerli + future değil
  PASS 22. URL-level ve index-level lastmod kaynakları karışmış olamaz
  PASS 23. Max URL lastmod aynı kalsa bile URL silindi -> index lastmod değişir
  PASS 24. Migration modu: tüm mevcut child lastmod migration timestamp’ine alınır
```

## Madde 11 zorunlu matris kapsamı

| Test | Beklenen | Sonuç |
|---|---|---|
| Aynı build iki kez | hash aynı, index lastmod aynı | 1 PASS |
| Yalnız deploy tekrarı | lastmod değişmez | 2 PASS |
| Yeni URL eklendi | hash + lastmod değişir | 3 PASS |
| URL silindi | hash + lastmod değişir | 4 PASS |
| URL canonical değişti | hash + lastmod değişir | 5 PASS |
| URL semantic lastmod değişti | hash + lastmod değişir | 6 PASS |
| Sadece ilgisiz değişiklik | hash değişmez | 7 PASS |
| Child sıralama aynı inputta | byte-identical | 8 PASS |
| Duplicate URL | FAIL | 9 PASS |
| noindex URL sitemap'e girdi | FAIL | 10 PASS |
| Query parametreli canonical | FAIL | 11 PASS |
| Future URL lastmod | FAIL | 12 PASS |
| Future child index lastmod | FAIL | 13 PASS |
| Baseline HTTP 500 | deploy FAIL | 14 PASS |
| Baseline timeout | deploy FAIL | 15 PASS |
| Yeni child chunk | NEW + timestamp | 16 PASS |
| Eski child chunk kayboldu | index'ten kaldır | 17 PASS |
| Homepage eksik | FAIL | 18 PASS |
| 0 URL | FAIL | 19 PASS |
| 50k/50MB sınırı | otomatik chunk veya FAIL | 20 PASS (kapı) |
| Index lastmod ISO-8601 | geçerli + future değil | 21 PASS |
| URL/index lastmod karışmaz | ayrık kaynak | 22 PASS |
| Max(URL lastmod) değişmeden URL silindi | index lastmod yine değişir | 23 PASS |
| Migration modu | explicit reset | 24 PASS |

## Ek kanıt

- `npm run seo:test` build zinciri içinde (`npm test` → `seo:test`) tamamlanıyor: `SITEMAP INDEX SEMANTİK TESTLER: 24 PASS, 0 FAIL`
- Test dosyası saf karar fonksiyonlarını (`decideIndex`, `fetchLiveBaseline`, `parseSitemapIndex`, `parseUrlset`, `renderIndex`, `sha256`) ve saf kapıları (`validateChildXml`, `validateIndexXml`, `validateParity`) doğrudan test eder; production ağına istek atmaz.
