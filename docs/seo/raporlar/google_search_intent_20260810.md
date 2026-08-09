# Google Search Intent Mapping — 2026-08-10

## Amaç

ExcelArsiv ürün, kategori ve rehber sayfalarında kullanıcıların Google'da kullandığı gerçek sorgu dilini; title, description, görünür kategori bağlamı ve iç bağlantı mimarisiyle eşleştirmek.

Bu çalışma arama hacmi uydurmaz. Keyword Planner/Search Console hacim verisi olmadan sayısal hacim beyanı yapılmaz. Öncelik; canlı SERP'te ürün/rehber sonuçlarıyla doğrulanan sorgu niyeti, ürünle doğrudan eşleşme ve ticari yakınlıktır.

## Google doktrini

- Title metni açıklayıcı, özgün ve kısa tutulur; tekrar/keyword stuffing yapılmaz.
- Kullanıcıların aradığı terimlerle ürün/kategori içeriği arasında açık bağ kurulur.
- Site navigasyonu ve iç bağlantılar önemli sayfaların keşfini ve bağlamını güçlendirir.
- Canonical, iç link ve sitemap aynı URL setinde tutarlı kalır.

Kaynaklar: Google Search Central — title links, ecommerce site structure, ecommerce content, sitemap ve URL structure dokümantasyonu (2026-08-10 erişimi).

## SERP ile doğrulanan yüksek-uyumlu sorgu kümeleri

| Sorgu kümesi | Hedef | Uygulama |
|---|---|---|
| stok takip excel / stok takip excel şablonu | Stok ürün + Stok ve Üretim kategori + mevcut rehber | Ürün title/query ve kategori metadata güçlendirildi |
| nakit akış tablosu excel / 13 haftalık nakit akışı excel | 13 haftalık ürün + Nakit Akışı kategori + mevcut rehber | Homepage/category/product niyeti birleştirildi |
| cari hesap takip excel | Cari ürün + mevcut rehber | Product query korunup açıklama netleştirildi |
| kasa defteri excel | Kasa ürünü + mevcut rehber | Title gelir-gider/nakit takibiyle genişletildi |
| SGK teşvik hesaplama / SGK teşvik hesaplama excel | SGK teşvik ürünü + Muhasebe ve Vergi kategori | 'analiz' yerine daha doğrudan 'hesaplama' sorgusu kullanıldı |
| hakediş fiyat farkı / hakediş fiyat farkı hesaplama excel | Hakediş fiyat farkı ürünü | Title/description hesaplama niyetine geçirildi |
| ihale teklif hesaplama excel / sınır değer | İhale teklif ürünü | Mevcut ticari niyet korunup güçlendirildi |
| ithalat maliyet hesaplama excel | İthalat maliyet ürünü | Net birim maliyet sonucu ile eşleştirildi |

## Yerleşim politikası

1. Ana sayfa: geniş ticari kategori niyeti; tek bir ürüne aşırı odaklanmaz.
2. Kategori: birincil kategori sorgusu + kategoriye özgü açıklama; generic 'şablonlar' metni tek başına kullanılmaz.
3. Ürün: tek güçlü primaryQuery; title ve description ürünün gerçek çıktısıyla uyumlu.
4. Rehber: bilgi niyeti; ürün sayfasına doğal köprü. Rehber URL'leri yeni veri/registry borcu üretmeden mevcut dört rehberde korunur.
5. Sitemap/LLM: yalnız canonical ve indexlenebilir gerçek sayfaları taşır; anahtar kelime için sahte URL üretilmez.

## Yasaklar

- meta keywords etiketi eklemek
- görünmez anahtar kelime blokları
- aynı sorguyu title/H1/body içinde mekanik tekrar etmek
- gerçek üründe olmayan sonuç/fayda iddiası eklemek
- yalnız SEO amacıyla ince/thin yeni URL üretmek

## Kapanış ölçütü

Build + source guard + SEO conformance + sitemap parity + internal-link graph PASS olmadan bu mapping production-ready sayılmaz. Arama görünürlüğü Search Console gerçek sorgu verisi geldikçe yeniden kalibre edilir.
