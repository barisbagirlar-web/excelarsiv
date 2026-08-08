// ESKİ ÜRÜN VERİ KAYNAĞI DEVRE DIŞI.
// Bu betik eski demo/MDX üretim modelini besliyordu ve fiyat/metadata değerleri
// commerce/catalog.json + delivery/ gerçek satış dosyalarıyla senkronize değil.
// Tek doğru kaynak: commerce/catalog.json (ticaret) ve delivery/ (gerçek teslimat).
// Yanlışlıkla import edilirse eski değerler yeniden üretilmesin.

console.error(
  'HATA: Eski product-data kaynağı kapalı. Ürün metadata ve fiyatları commerce/catalog.json + delivery/ gerçek satış dosyalarından gelir.',
);
process.exit(1);
