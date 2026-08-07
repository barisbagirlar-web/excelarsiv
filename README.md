# Excel Arşiv — excelarsiv.com

Türkiye'deki ticari işletmelere finans, muhasebe ve operasyon amaçlı Excel çalışma tabloları satan dijital ürün mağazası. Ödeme Shopier'de, ürün eşleştirme ve güvenli dijital teslimat ExcelArşiv/Firebase tarafında yürütülür.

## Teknoloji

- **Astro** — statik mağaza arayüzü, düşük JS yükü ve Core Web Vitals odağı
- **Tailwind v4 + token katmanı** — renk/tipografi token'ları `src/styles/global.css` içinde
- **Content Collections + zod** — `src/content.config.ts`; eksik ürün alanı build'i durdurur
- **Firebase Hosting + Functions + Firestore + Storage** — ödeme doğrulama, Proof Demo ve private satış teslimatı
- **Shopier API (PAT)** — Shopier siparişini sunucu tarafında doğrulama
- **MDX** — her ürün 1 dosya (`src/content/templates/`)
- **Sitemap** — `@astrojs/sitemap` ile otomatik `sitemap-index.xml`

## Yerel geliştirme

```sh
npm install
npm install --prefix functions
npm run dev
```

## Ticaret mimarisi

Shopier'de her Excel için ayrı ürün açılmaz. Dört sabit ödeme ürünü vardır:

- PRO — 990 TL
- PREMIUM — 1.490 TL
- ENTERPRISE — 2.490 TL
- EXCLUSIVE — 7.900 TL

Tek gerçek ticaret kaynağı `commerce/catalog.json` dosyasıdır. Burada Excel ürün slug'ı → fiyat seviyesi → Shopier ürün ID → private Storage yolu eşleştirilir.

Satın alma akışı:

1. Ürün sayfası `/api/checkout` üzerinden ürün+e-posta için tekil checkout oluşturur.
2. Kullanıcı ilgili sabit Shopier ödeme ürününe gider.
3. `/api/checkout-status`, `SHOPIER_ACCESS_TOKEN` secret'ını kullanarak Shopier siparişini sunucu tarafında doğrular.
4. E-posta, fiyat seviyesi, Shopier ürün ID, miktar, tutar ve para birimi eşleşirse checkout `paid` olur.
5. Kullanıcı `/api/download-token` ile 5 dakika geçerli tek kullanımlık token alır.
6. `/api/download` private Firebase Storage nesnesini kullanıcıya attachment olarak stream eder.

Aynı e-posta + aynı fiyat seviyesi için aynı anda yalnızca tek bekleyen checkout bulunabilir. Bu kural, dört ortak Shopier ödeme ürününün kullanıldığı modelde yanlış Excel'in açılmasını önleyen kritik emniyet kapısıdır.

## Proof Demo mimarisi

Demo dosyaları statik olarak `public/` altında tutulmaz. Ürün sayfasındaki Proof Demo akışı:

1. Kullanıcı e-posta adresini girer ve Demo Kullanım Koşulları'nı açıkça kabul eder.
2. `/api/demo-request` IP/e-posta hız sınırlarını uygular ve 10 dakika geçerli tek kullanımlık token üretir.
3. `/api/demo-download` token'ı atomik olarak tüketir ve `.xlsx` dosyasını talep anında üretir.
4. Her dosyaya benzersiz `Demo ID` ve ham e-posta yerine SHA-256'dan türetilmiş kısa e-posta parmak izi yazılır.
5. Proof Demo en fazla 20 değerlendirme satırı içerir.
6. Premium `MOTOR`, tam `AYARLAR`, tam eşik seti, senaryo/duyarlılık/anomali/tahmin motorları demo dosyasına fiziksel olarak yazılmaz.
7. Demo yalnız değerlendirme amaçlıdır; ticari kullanım, yeniden satış ve toplu dağıtım kullanım koşulları kapsamı dışındadır.

Bu tasarımın ana güvenlik prensibi şudur: Excel sayfa şifresi fikri mülkiyet güvenliği değildir. Premium algoritmayı koruyan katman, premium motorun Proof Demo dosyasında hiç bulunmamasıdır.

## Secret

Shopier erişim anahtarı source code'a, `.env` dosyasına veya GitHub'a yazılmaz. Firebase Secret Manager'da şu isimle bulunmalıdır:

```text
SHOPIER_ACCESS_TOKEN
```

Functions yalnızca bu secret'ı runtime'da okur.

## Ürün ekleme

`src/content/templates/` altına ürün MDX'i eklenirken aynı slug `commerce/catalog.json` içinde ve `functions/proof-demo-specs.js` Proof Demo sözleşmesinde de tanımlanmalıdır.

`scripts/validate-commerce.mjs` build kapısı olarak şunları doğrular:

- ürün fiyatı Shopier'deki dört fiyat seviyesinden biri mi,
- ürün tier'ı ve Shopier ürün ID'si doğru mu,
- MDX ürün adı/fiyatı commerce kataloğuyla eşleşiyor mu,
- private Storage yolu doğru ürün slug'ına mı ait,
- ödeme ve Proof Demo güvenli API rewrite'ları mevcut mu,
- 12 ürünün tamamında Proof Demo sözleşmesi var mı,
- `public/` altında herhangi bir `.xlsx` veya `.xlsm` sızıntısı var mı.

Eski `product-data.mjs` tabanlı demo/MDX/sentetik önizleme üreticileri premium ürünlerle ayrışma riski nedeniyle devre dışıdır. `npm run generate` artık içerik üretmez; güvenlik/ticaret doğrulaması çalıştırır.

## Private satış dosyaları

Satış dosyaları `public/` altında tutulmaz. Her ürün için private Firebase Storage yolu:

```text
paid-products/<urun-slug>/current.xlsx
```

veya ürün makroluysa `current.xlsm` biçimindedir.

Proof Demo dosyaları da `public/` altında tutulmaz; runtime'da oluşturulur ve kısa ömürlü tek kullanımlık token ile indirilir.

## Test

```sh
npm --prefix functions test
npm test
```

GitHub Actions:

- Functions testlerini,
- commerce/Proof Demo güvenlik kapısını,
- Astro build ve smoke testlerini,
- 12 Proof Demo workbook üretimini,
- LibreOffice ile 12/12 dosyanın açılıp yeniden kaydedilebilmesini

PR ve ilgili branch/main pushlarında çalıştırır.

## Yayınlama

```sh
npm run build
firebase login
firebase use carbon-web-1265b
firebase deploy --only functions,hosting
```

Yayın öncesi iki ayrı sevk kapısı vardır:

1. Proof Demo CI tamamen yeşil olmalı.
2. Private Storage altındaki ücretli satış workbook'ları doğrulanmış üretim sürümleriyle eşleşmeli ve gerçek Shopier ödeme → İndir E2E testi geçmelidir.

Satış dosyası yoksa ödeme kaydı korunur fakat indirme API'si güvenli biçimde `FILE_NOT_READY` döndürür; yanlış veya demo dosya teslim edilmez.

## Yapı

```text
commerce/catalog.json             # 4 Shopier tier + 12 gerçek Excel ürün eşlemesi
functions/proof-demo-specs.js      # 12 ayrı Proof Demo sözleşmesi
functions/proof-demo.js            # kişiselleştirme + token + runtime XLSX üretimi
functions/                         # ödeme doğrulama + güvenli indirme API'leri
src/pages/demo-kullanim-kosullari.astro
src/components/DemoDownloadBox.astro
src/content.config.ts
src/content/templates/
scripts/validate-commerce.mjs
firebase.json
```
