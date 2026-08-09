# SEO MANDATE ERRATA — ExcelArsiv

Bu dosya yalnız yürütmeyi kıran sözleşme kusurlarını ve kalıcı çözümünü kaydeder. Sessiz düzeltme yapılmaz.

| Kod | Durum | Kusur | Kalıcı çözüm |
|---|---|---|---|
| E-18 | [Kesin] | Bölüm X, Faz 0'dan önce repo dosyası üretmek zorunda; AIP-01 ise sadece faz branch/PR tanımlıyor. Bootstrap için yasal yazma/branch yolu yoktu. | Tek kullanımlık `seo/bootstrap-v6` branch/PR istisnası tanımlandı. Bootstrap merge sonrası istisna kapanır. |
| E-19 | [Kesin] | X.2 manifest; `package.json`, `seo.config.schema.json`, `PHASE_CONTRACTS.json`, `PROGRESS.md`, raporlar, redirect/SLO/calibration/KAC dosyaları gibi belgenin kendisinin zorunlu kıldığı yolları içermiyordu. AIP-03 ilerleyen fazları bloke ederdi. | Manifest tüm zorunlu yönetişim/artefakt yollarıyla genişletildi; faz yazma kilidi `PHASE_CONTRACTS.json` ile daraltılmaya devam eder. |
| E-20 | [Kesin] | Draft-07 JSON Schema'da string `dataWindowStart` için `minimum: "2025-09-11"` tarih alt sınırını zorlamaz. E-04'ün sözde düzeltmesi makine açısından etkisizdi. | Şema yalnız `format: date`; gerçek alt sınır `preflight` P-08'de UTC tarih karşılaştırmasıyla exit 4. Negatif fixture zorunlu. |
| E-21 | [Kesin] | C-09 tüm 75 BLOCK negatif testini Faz 0 öncesi isterse eklemeli-CI ile çelişir; henüz yazılmamış Faz 18 scriptinin testi bootstrap'ı kilitler. | C-09 kapsamı `PROGRESS.md` içindeki active/completed fazlarla sınırlandı. Bir faz GATE-OUT almadan o fazın tüm BLOCK negatif testleri zorunludur. |
| E-22 | [Kesin] | Deployment enum Firebase Hosting'i tanımıyordu; ExcelArsiv'i `static_host` diye sınıflamak header/rewrites/functions gerçekliğini kaybettirirdi. | `firebase_hosting` proje enum'una eklendi. |
| E-23 | [Kesin] | X.2 yalnız `scripts/seo/*.ts` diyordu; production'da kanıtlı çalışan sitemap/finalizer/live-contract zinciri `.mjs`. AIP-03 mevcut koruma sistemini yasa dışı hale getirirdi. | `scripts/seo/*.mjs` manifestte korunan legacy/production SEO motoru olarak izinli; yeni V6 motorları `.ts`. |
| E-24 | [Kesin] | Faz 3 `sitemap_index.xml` öneriyor; ExcelArsiv'in onaylı canlı sözleşmesi `/sitemap.xml` sitemapindex → child sitemap'ler. İsim değişimi gereksiz kırıcı migrasyon olurdu. | `/sitemap.xml` root index kilitlendi; semantic lastmod, SHA-256 baseline, finalizer, validator ve live-contract korunur. |
| E-25 | [Kesin] | Governance-only merge'lerin production deploy tetiklemesi çalışan sistemi gereksiz riske atar. | Mevcut runtime classifier korunur; governance-only değişiklikte deploy skip, runtime değişiklikte yalnız merge edilmiş `main` deploy adayıdır. |
| E-26 | [Kesin] | Tam checkout olmayan ajan ortamında "build PASS" iddiası üretmek AIP-07'yi ihlal eder. | Yerel full build yoksa açıkça belirtilir; merge kapısı GitHub PR CI `npm test + seo:preflight + seo:conformance` ham sonucu olur. |
| E-27 | [Kesin] | INV-X.5 kodda sabit eşik yasağı koyarken cold-start, deney, kalibrasyon, kriz ve portföy fazlarında config karşılığı olmayan çok sayıda sayısal eşik bulunuyordu. Gelecek scriptler bu değerleri hardcode etmek zorunda kalırdı. | ExcelArsiv `thresholds` sözlüğü yürütme eşikleriyle genişletildi; yeni faz scriptleri yalnız config referansı kullanır. |
| E-28 | [Kesin] | AIP-26 ham `garanti` regexi “garanti yok”, “garanti-dili taraması PASS” gibi uyum cümlelerini de BLOCK eder; yönetim raporu şablonu kendi kendini ihlal ederdi. | Tarayıcı yalnız olumlu vaat bağlamını BLOCK eder; açık negasyon/uyum ifadeleri ve politika/test kaynakları false-positive kapsamı dışıdır. |

## Karar

Bu errata, kullanıcının 2026-08-09 tarihli “kusurları kalıcı çözüm üreterek düzelt ve faz faz uygula” talimatı kapsamında bağlayıcıdır. Mevcut çalışan sitemap/deploy mimarisi korunur.
