# Proof Demo Politikası — Excel Arşiv

Bu klasör artık indirilebilir `.xlsx/.xlsm` demo dosyası barındırmaz.

## Neden

Statik public Excel dosyaları:

- doğrudan URL ile sınırsız paylaşılabilir,
- eski sürümlerin arama motoru/cache üzerinden yaşamaya devam etmesine yol açabilir,
- ürün sayfası ile demo içeriğinin zamanla ayrışmasına neden olabilir,
- satıcının demo erişimini ölçmesini ve kötüye kullanımı sınırlandırmasını zorlaştırır.

## Yürürlükteki model

Proof Demo, Firebase Functions üzerinden talep anında üretilir:

1. Kullanıcı ürün sayfasında e-posta adresini girer.
2. Demo Kullanım Koşulları açık onayla kabul edilir.
3. Sunucu kısa ömürlü, tek kullanımlık indirme token'ı üretir.
4. Dosya runtime'da oluşturulur; benzersiz Demo ID ve geri döndürülemez e-posta parmak izi eklenir.
5. Premium MOTOR / AYARLAR / tam analitik formüller demo dosyasına hiçbir zaman yazılmaz.
6. Token ilk başarılı kullanımda tüketilir.

## Demo sözleşmesi

- en fazla 20 kayıtlık değerlendirme alanı,
- gerçek ürün kararını temsil eden basitleştirilmiş kanıt motoru,
- premium motor fiziksel olarak YOK,
- makrosuz `.xlsx`,
- ticari kullanım için değildir,
- yeniden satış / toplu dağıtım kullanım izni kapsamında değildir,
- tüm çıktı sayfalarında Demo ID / lisans izi,
- ürünün tam sürümünde açılan katmanların açık karşılaştırması.

## Güvenlik kapısı

`scripts/validate-commerce.mjs`, `public/` altında herhangi bir `.xlsx` veya `.xlsm` bulursa build'i başarısız sayar.

Ücretli satış dosyaları da public değildir; yalnız private Firebase Storage altında `paid-products/<slug>/current.xlsx` yolunda tutulur.
