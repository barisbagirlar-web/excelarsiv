# İkinci Dalga B2 — Lansman Katalog Mimarisi

## VAR/YOK

Başlangıç: **YOK**. Mevcut registry ürün/kategori kayıtlarını lansman kataloğuna dönüştüren ve içerik boşluklarını registry delta olarak ayıran bir motor yoktu.

## Mevcut lansman bazı

Registry üzerinde canlı satış yüzeyi zaten mevcuttur:
- 8 kategori yüzeyi (`/sablonlar` + 7 alt kategori),
- 12 canlı ürün detay sayfası,
- toplam 20 lansman satış/kategori URL'si.

Gerçek B1 demand CSV'si bulunmadığından hacim sıralaması **SKIP_NO_DATA**. Katalog tüm mevcut canlı kategori+ürün yüzeyini kapsar; “en yüksek hacim” iddiası kurulmaz.

## Uygulama

`scripts/seo/launch-catalog.ts`:
- canlı `category` ve `product` registry kayıtlarını toplar,
- B1 demand hacmi varsa ürünleri gözlenen import hacmine göre sıralar,
- demand yoksa alfabetik/deterministik tam canlı katalog bazını kullanır,
- `--limit` yalnız açık pozitif tam sayıysa uygulanır,
- KAC `contentGap:true` kayıtlarını yalnız `draft-gap` olarak önerir,
- yeni route'u doğrudan registry'ye yazmaz,
- `data/seo/registry_delta.json` yalnız Faz 1 tek-yazar sözleşmesine devredilecek delta üretir.

Şu an registry delta: **NO_CHANGES / 0 kayıt**. Bu nedenle ayrıca `seo/registry-refresh-wave2` PR'ı açmak gereksizdir.

## Otomatik yayın

Yeni içerik gövdesi veya yeni product route otomatik üretilmedi. Gerçek demand verisinden içerik boşluğu çıktığında route yalnız taslak/delta olur; insan onayı olmadan public sayfaya dönüşmez.

## Kanıt

`data/seo/launch_catalog.json`: mevcut 20 canlı lansman URL'sinin kayıtlı listesi.

`tests/conformance/wave2-b2-catalog.test.ts`:
- registry kayıt sayısı > 0,
- kategori ve ürün sayısı > 0,
- committed katalog route/pageId parity,
- mevcut durumda demandPriorityStatus=SKIP_NO_DATA,
- mevcut content gap=0,
- registry delta=NO_CHANGES,
- sentetik bir gap'in yalnız `draft` Faz 1 delta ürettiği negatif/yaşam-döngüsü testi.

`npm run seo:validate-registry` mevcut Faz 1 registry sözleşmesini ayrıca doğrular; B2 registry dosyasını yazamaz.
