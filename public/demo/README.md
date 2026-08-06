# Demo Dosyaları — Excel Arşiv

Bu klasör, ürün sayfalarındaki **ücretsiz demo** dosyalarını barındırır.
Satın alma sonrası teslim edilen ücretli `.xlsx` dosyaları **asla** bu klasöre
veya `public/` altına konmaz — yalnız `/demo/` altındaki ücretsiz sürümler
statik olarak yayınlanır.

## Adlandırma kuralı

Demo dosyaları sürümlü adlanır: `<slug>-demo-v<X.Y>.xlsx` — makro YASAK
(`.xlsm` yok).

Örnek: `akilli-kasa-defteri-demo-v3.2.xlsx`

## İçerik kuralı

- Girdi sheet'leri: açık hücreler (sarı dolgu = kullanıcı girer).
- Hesap / Çıktı sheet'leri: örnek formüller + kilitli sheet koruması.
- Boyut hedefi: < 500 KB.
