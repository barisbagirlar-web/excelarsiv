# Excel Arşiv — excelarsiv.com

Türkiye'deki ticari işletmelere finans, muhasebe ve operasyon amaçlı Excel çalışma tabloları satan dijital ürün mağazası. Ödeme Shopier'de, ürün eşleştirme ve güvenli dijital teslimat ExcelArşiv/Firebase tarafında yürütülür.

## Teknoloji

- **Astro** — statik mağaza arayüzü, düşük JS yükü ve Core Web Vitals odağı
- **Tailwind v4 + token katmanı** — renk/tipografi token'ları `src/styles/global.css` içinde
- **Content Collections + zod** — `src/content.config.ts`; eksik ürün alanı build'i durdurur
- **Firebase Hosting + Functions + Firestore + Storage** — ödeme doğrulama ve private dosya teslimatı
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

## Secret

Shopier erişim anahtarı source code'a, `.env` dosyasına veya GitHub'a yazılmaz. Firebase Secret Manager'da şu isimle bulunmalıdır:

```text
SHOPIER_ACCESS_TOKEN
```

Functions yalnızca bu secret'ı runtime'da okur.

## Ürün ekleme

`src/content/templates/` altına ürün MDX'i eklenirken aynı slug `commerce/catalog.json` içinde de tanımlanmalıdır. `scripts/validate-commerce.mjs` şu kontrolleri build kapısı olarak uygular:

- ürün fiyatı Shopier'deki dört fiyat seviyesinden biri mi,
- ürün tier'ı ve Shopier ürün ID'si doğru mu,
- MDX ürün adı/fiyatı commerce kataloğuyla eşleşiyor mu,
- private Storage yolu doğru ürün slug'ına mı ait,
- güvenli API rewrite'ları mevcut mu.

`npm run generate` çalıştırıldığında MDX fiyatları eski `product-data.mjs` değerlerinden değil, `commerce/catalog.json` fiyat seviyelerinden üretilir; böylece fiyatlar geriye dönmez.

## Private satış dosyaları

Satış dosyaları `public/` altında tutulmaz. Her ürün için private Firebase Storage yolu:

```text
paid-products/<urun-slug>/current.xlsx
```

veya ürün makroluysa `current.xlsm` biçimindedir. Demo dosyaları `public/demo/` altında kalabilir; satış dosyaları kalamaz.

## Test

```sh
npm --prefix functions test
npm test
```

GitHub Actions; Functions testlerini, commerce katalog kapısını, Astro build ve smoke testleri PR ve `main` pushlarında çalıştırır.

## Yayınlama

```sh
npm run build
firebase login
firebase use carbon-web-1265b
firebase deploy --only functions,hosting
```

Yayın öncesi private Storage altında satış sürümlerinin mevcut olduğu doğrulanmalıdır. Dosya yoksa ödeme kaydı korunur fakat indirme API'si güvenli biçimde `FILE_NOT_READY` döndürür; yanlış veya demo dosya teslim edilmez.

## Yapı

```text
commerce/catalog.json       # 4 Shopier tier + gerçek Excel ürün eşlemeleri
functions/                  # ödeme doğrulama + güvenli indirme API'leri
src/content.config.ts       # ürün şeması
src/components/             # mağaza ve checkout bileşenleri
src/pages/                  # ürün, teslimat ve içerik rotaları
src/content/templates/      # ürün MDX dosyaları
scripts/validate-commerce.mjs
firebase.json               # Hosting -> Functions API rewrites
```
