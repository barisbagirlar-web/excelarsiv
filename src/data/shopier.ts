/** Shopier — site/yasal sayfalar için kamuya açık sabitler (token yok). */

export const SHOPIER = {
  marka: 'Shopier',
  site: 'https://www.shopier.com',
  apiBase: 'https://api.shopier.com/v1',
  rol: 'ödeme hizmeti sağlayıcısı / veri işleyen',
  aktarilanVeriler: [
    'Alıcı e-posta adresi (ödeme ve sipariş eşleştirme)',
    'Sipariş numarası, tutar, para birimi, ödeme durumu',
    'Ürün/seviye kimliği (Shopier ürün ID)',
  ],
  aktarilmayan: [
    'Kredi kartı numarası, CVV, kart son kullanma (yalnız Shopier’de işlenir)',
    'Excel dosya içeriği',
  ],
  amac:
    'Ödeme tahsilatı, sipariş doğrulama, dijital teslimat yetkisinin açılması ve destek.',
} as const;
