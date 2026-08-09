# İkinci Dalga B2 — Lansman Katalog Mimarisi

## VAR/YOK

İlk B2 uygulaması registry ürün/kategori kayıtlarını katalog listesine dönüştürmüş ve `data/seo/launch_catalog.json` içine sayfa snapshot'ı yazmıştı. C1 sonrasında yeni ürünler/rehberler paralel olarak registry'ye eklenmeye hazırlanırken bu snapshot'ın eski kalması conformance'ı kırdı.

Bu, test sorunu değil **çift-SSOT mimari kusuru** olarak kabul edildi. Test zayıflatılmadı.

## Kalıcı mimari

`data/seo/launch_catalog.json` artık mutable sayfa listesi değildir; yalnız katalog üretim politikasını taşır:
- `sourceOfTruth = data/seo/registry/excelarsiv_seo_registry.json`
- `selectionMode = all-live-registry`
- `snapshotPolicy = computed-at-runtime`
- demand sıralama kaynağı = KAC
- demand yoksa hacim iddiası yok
- content gap yalnız `draft-only-faz1-delta`
- registry yazarı yalnız Faz 1
- otomatik yayın = false

`pages` veya `counts` alanlarının policy artefaktına yeniden eklenmesi conformance tarafından BLOCK edilir. Böylece ürün/kategori registry'si büyüdüğünde ikinci bir committed katalog listesinin senkron tutulması gerekmez.

## Runtime türetim

`scripts/seo/launch-catalog.ts` her koşuda canlı registry'den güncel kategori ve ürün setini türetir:
- demand varsa yalnız gözlenen imported volume'a göre sıralar,
- demand yoksa tüm canlı kategori+ürünleri deterministic olarak kapsar ve hacim iddiası kurmaz,
- KAC `contentGap:true` kayıtlarını yalnız draft delta olarak önerir,
- `--write` artık mutable katalog snapshot'ı yazmaz; yalnız `registry_delta.json` güncelleyebilir.

Bu sayede registry değişikliği ile katalog snapshot'ı arasında circular dependency kalmaz.

## Kanıt ve yaşam döngüsü

`tests/conformance/wave2-b2-catalog.test.ts`:
1. policy'nin registry tek-kaynak ve runtime-derived olduğunu doğrular,
2. policy içine mutable `pages/counts` snapshot'ı sokulmasını reddeder,
3. güncel kategori/ürün sayılarını doğrudan registry'den hesaplayıp runtime katalogla birebir karşılaştırır,
4. demand status'ünün veri varlığına göre `SKIP_NO_DATA|AVAILABLE` yaşam döngüsünü kabul eder,
5. content gap'in yalnız Faz 1 `draft` delta üretebildiğini doğrular.

## Sonuç

Katalog üyeliğinin otoritesi artık tek yerde, registry'dedir. Launch catalog bir kopya veri deposu değil, registry + KAC üzerinde çalışan deterministik karar görünümüdür. Bu değişiklik runtime/public davranışı değiştirmez ve deploy gerektirmez.
