# MIGRATION RUNBOOK — ExcelArsiv

Durum: [Kesin] Hazır; aktif domain/platform migrasyonu yok.

## GATE
- Registry export ve canonical URL envanteri alınır.
- Redirect ledger taslağı hazırlanır; zincir ve loop testi PASS olmadan icra yok.
- Sitemap/robots/canonical/header sözleşmesi izole build üzerinde doğrulanır.
- Domain değişimi, HSTS preload, toplu 410 ve canlı redirect icrası ayrı A3 karar kaydı olmadan yapılamaz.

## CANLI GEÇİŞ
1. Son başarılı build + registry + redirect ledger SHA'ları mühürlenir.
2. Değişiklik tek PR/merge ile uygulanır; paralel SEO değişikliği yapılmaz.
3. İlk dört saatte canonical, robots, sitemap, checkout, ana ürün URL'leri ve 404/redirect zinciri kontrol edilir.
4. İzleme penceresi 72 saat. GSC/GA4 bağlıysa coverage/traffic; değilse canlı HTTP + sitemap + SEO live-contract kanıtı kullanılır.

## ROLLBACK
- Kabul kriteri bozulursa aynı değişiklik seti revert edilir.
- Eski host/route sözleşmesi geri yüklenir; redirect ledger kapanış kaydı alır.
- Rollback sonrası build, smoke, sitemap ve live-contract tekrar PASS olmalıdır.

## KABUL KRİTERİ
- Kritik ürün/checkout URL'lerinde beklenmeyen 4xx/5xx yok.
- Redirect loop/zincir yok.
- Sitemap yalnız canonical/indexlenebilir URL içerir.
- Robots public satış/rehber yüzeyini yanlışlıkla bloklamaz.
- Schema/canonical render paritesi bozulmaz.
