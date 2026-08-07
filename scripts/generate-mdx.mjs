// ESKİ PRODUCT-DATA TABANLI MDX ÜRETİCİSİ DEVRE DIŞI.
// Bu betik eski demo/ürün modelini yeni ticaret kataloğu üzerine yeniden yazabildiği için
// premium ürün metadatasını geriye götürme riski taşır.
// Ürün sayfası içeriği doğrulanmış premium ürün kaynağıyla senkronize edilmeden otomatik üretilmez.

console.error('HATA: Eski MDX üretimi kapalı. Ürün metadata ve görselleri doğrulanmış premium satış kaynağından senkronize edilmelidir.');
process.exit(1);
