# Excel Arşiv — excelarsiv.com

Türkiye'deki ticari işletmelere finans, muhasebe ve operasyon amaçlı Excel çalışma tabloları satan dijital ürün mağazası. Ödeme Shopier, barındırma Firebase Hosting (statik).

## Teknoloji

- **Astro** — statik çıktı, sıfır JS, Core Web Vitals hedefi
- **Tailwind v4 + token katmanı** — renk/tipografi token'ları `src/styles/global.css` içinde, ham renk kodu yalnızca orada
- **Content Collections + zod** — `src/content.config.ts`; eksik ürün alanı build'i patlatır
- **MDX** — her ürün 1 dosya (`src/icerik/sablonlar/`)
- **Sitemap** — `@astrojs/sitemap` ile otomatik `sitemap-index.xml`

## Yerel geliştirme

```sh
npm install
npm run dev
```

## Ürün ekleme

`src/content/templates/` altına bir `.mdx` dosyası ekle. Frontmatter'daki **tüm alanlar zorunludur** (`src/content.config.ts` şeması); eksik alanla build başarısız olur — yarım ürün sayfası yayına çıkamaz. Ürün sayfası 10 bloktan oluşur: künye, önizleme, demo indirme, sayfa haritası, girdi–çıktı sözleşmesi, uygunluk, gereksinimler, güncelleme, SSS, ilgili şablonlar.

**URL kuralı:** Ürünün sayfa adresi, ürün adından otomatik türetilir ve ürün adını TAM olarak içerir (örn. adı "Akıllı Kasa Defteri ve Nakit Kontrol Sistemi" olan ürün → `/sablon/akilli-kasa-defteri-ve-nakit-kontrol-sistemi`). Ayrı bir `slug` alanı yoktur; adı değiştirirsen URL de değişir.

Satın alma düğmesi ürünün `shopierUrl` alanına yeni sekmede gider; sitede sepet ve ödeme formu yoktur.

## Yayınlama (Firebase Hosting)

```sh
npm run build
firebase login
firebase deploy --only hosting
```

`firebase.json` zaten `dist/` klasörünü yayınlar, cleanUrls açıktır, statik varlıklar için cache başlıkları tanımlıdır. Gizli değer (Shopier API anahtarı) bu projede kullanılmaz çünkü ödeme Shopier paneli üzerinden `shopierUrl` ile yapılır.

## Yapı

```
src/
├── content.config.ts        # ürün şeması (zod)
├── components/              # 16 bileşen
├── layouts/Layout.astro     # canonical, OG meta, erişilebilirlik
├── pages/                   # rotalar
├── content/templates/       # ürün MDX dosyaları
├── data/productList.ts      # ürün adları (bekleyen ürün aşaması)
├── utils/slug.ts            # Türkçe'den URL slug türetme
└── styles/global.css        # token'lar + font yüzleri
```
