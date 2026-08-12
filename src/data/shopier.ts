/** Shopier — site/yasal sayfalar için kamuya açık sabitler (token yok). */

export const SHOPIER = {
  marka: 'Shopier',
  site: 'https://www.shopier.com',
  magazaUrl: 'https://www.shopier.com/excelarsiv',
  apiBase: 'https://api.shopier.com/v1',
  gelistiriciDokuman: 'https://developer.shopier.com',
  rol: 'ödeme hizmeti sağlayıcısı / veri işleyen',
  aktarilanVeriler: [
    'Alıcı e-posta adresi (ödeme ve sipariş eşleştirme)',
    'Sipariş numarası, tutar, para birimi, ödeme durumu',
    'Ürün/seviye kimliği (Shopier ürün ID)',
  ],
  aktarilmayan: [
    'Kredi kartı numarası, CVV, kart son kullanma (yalnız Shopier’de işlenir)',
    'Excel dosya içeriği',
    'Shopier API erişim token’ı (yalnız sunucu secret’ında)',
  ],
  amac:
    'Ödeme tahsilatı, sipariş doğrulama, dijital teslimat yetkisinin açılması ve destek.',
  /** Kod yalnızca Orders okuma kullanır; ürün listesi yerel katalogdan gelir. */
  kullanilanKapsamlar: ['orders:read'] as const,
} as const;
