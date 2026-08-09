# İkinci Dalga C2 — Staging Kanıt Koşusu

## VAR/YOK

Başlangıç: **YOK**. Repo build/SEO/smoke/live-contract testlerine sahipti; fakat geçici staging URL üzerinde render parity + Lighthouse lab + sitemap rewrite + true-404 kanıtını tek pakette üreten merge-sonrası hat yoktu.

## Güvenlik kararı

Talimata uygun olarak PR branch'i production veya staging deploy etmez. C2 workflow yalnız **main'e merge edildikten sonra** Firebase Hosting preview channel oluşturur. Preview channel 1 gün içinde otomatik sona erecek şekilde açılır ve production live channel'a yazmaz.

## İlk gerçek preview koşusunda bulunan kusur

Run `31337699628`:
- `npm test` PASS,
- Firebase preview deploy PASS,
- üç Lighthouse mobile lab koşusu PASS,
- sentetik INP adımı FAIL,
- final render/sitemap/404 adımı bu nedenle çalışmadı.

Kök neden Puppeteer paketinin kurulmamış olması değildi. Workflow global `puppeteer-core` paketinin özel iç dosya yolunu (`lib/esm/.../puppeteer-core.js`) varsayıyordu; runner'daki paket yerleşimi bu private yolu taşımıyordu ve `ERR_MODULE_NOT_FOUND` oluştu.

Kalıcı çözüm:
- private iç path tamamen kaldırıldı,
- `NODE_PATH=$(npm root -g)` + `require('puppeteer-core')` public package çözümlemesi kullanılıyor,
- conformance testi private path'in tekrar eklenmesini yasaklıyor.

## Kanıt zinciri

`.github/workflows/seo-staging-proof.yml`:
1. Merge edilmiş `main` checkout.
2. `npm test` — commerce → build → SEO generate/validate/semantic/enterprise guard → smoke → 47-sayfa link graph.
3. Firebase service account ile yalnız Hosting preview channel deploy.
4. Lighthouse 13.4.1 mobile lab raporları:
   - `/`
   - `/sablonlar`
   - ana ücretli ürün örneği.
5. Chrome/Puppeteer Event Timing ile consent-reject etkileşiminden sentetik INP lab ölçümü.
6. Aynı gerçek preview browser koşusunda Consent Mode network kapısı:
   - seçim öncesi Google Analytics/gtag network isteği = 0,
   - `Yalnızca Gerekli` sonrası Analytics isteği = 0,
   - `analytics_storage=denied` update zorunlu,
   - ayrı temiz kabul senaryosunda `analytics_storage=granted` update zorunlu,
   - kabul sonrası Google tag request başlamalı; test trafiğini gerçek GA property'ye göndermemek için bu request browser interception ile yakalanıp **abort edilir**.
   - ham sonuç `consent-network.json` içinde saklanır.
7. `staging-proof.ts` ile tüm canlı registry route'larında:
   - HTTP 200,
   - local build ↔ staging H1 parity,
   - local build ↔ staging title parity,
   - production canonical parity,
   - noindex leakage=0.
8. Local generated sitemap index/child sitemap route seti staging origin'e rewrite edilerek:
   - child HTTP 200 + urlset,
   - sitemap route seti == registry live route seti,
   - her sitemap URL staging HTTP 200,
   - canonical doğru,
   - noindex=0.
9. Bilinmeyen route gerçek HTTP 404 olmalı; HTTP 200 soft-404 BLOCK.
10. Ham Firebase logu + 3 Lighthouse JSON + INP JSON + consent network JSON + final staging-proof JSON/log tek Actions artifact olarak 30 gün saklanır.

## Performans bütçesi

Karar eşikleri kodda hardcode edilmez; `seo.config.defaults.json.thresholds` okunur:
- LCP budget = `lcpP75Ms`,
- CLS budget = `clsP75`,
- sentetik INP lab budget = `inpP75Ms`.

Lighthouse ve sentetik INP sonuçları **[Güçlü/lab]** etiketi taşır ve saha p75/CrUX/GA4 verisi olarak yorumlanmaz. INP Event Timing kaydı 16 ms altında ise ölçüm 16 ms üst sınır olarak konservatif raporlanır; bu değer gerçek saha INP iddiası değildir.

## Başlangıç artefaktı

`data/seo/staging_proof.json` merge öncesinde `SKIP_NO_DATA` durumundadır; bunun nedeni staging deploy'un merge öncesi yasak olmasıdır. Merge sonrası workflow gerçek kanıtı Actions artefaktına üretir; repo dosyasını bot commit'iyle değiştirip yeni CI döngüsü yaratmaz.

## Kapanış kriteri

Workflow sonucu PASS olmadan C2 nihai kapanmış sayılmaz. Beklenen final:
- render failures=0,
- seçim öncesi Analytics request=0,
- reject sonrası Analytics request=0,
- accept consent update=granted ve Google tag request başlatılmış/intercept edilmiş,
- Lighthouse LCP/CLS budget failures=0,
- synthetic INP lab <= config budget,
- sitemap failures=0,
- sitemap URL count == registry live count,
- true 404,
- artifact upload success.
