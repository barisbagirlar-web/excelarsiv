/** Satıcı ve iletişim — yasal sayfalar + schema tek kaynağı. */

export const SATICI = {
  marka: 'Excel Arşiv',
  site: 'https://excelarsiv.com',
  gercekKisi: 'Barış Bağırlar',
  unvan: 'Barış Bağırlar — Excel Arşiv',
  eposta: 'barisbagirlar@gmail.com',
  telefon: '0539 333 33 03',
  telefonE164: '+905393333303',
  telefonTelHref: 'tel:+905393333303',
  /**
   * Gerçek kişi vergi kimliği (11 hane). Kullanıcı VKN olarak iletti;
   * TCKN checksum doğrulandı (kurumsal 10 haneli VKN değil).
   */
  vkn: '25403091318',
  adresBeyani:
    'Türkiye. Vergi kimlik no: 25403091318 (gerçek kişi). Kayıtlı işyeri adresi ve MERSIS numarası fatura üzerinde yer alır; yazılı talep üzerine paylaşılır.',
  ulke: 'TR',
} as const;

/** Dijital içerikte cayma/iade: indirme başladıktan sonra kullanılmaz. */
export const IADE_POLITIKASI = {
  dijitalCayma: false,
  schemaCategory: 'https://schema.org/MerchantReturnNotPermitted' as const,
  ozet:
    'Ürün dijital içeriktir. İndirme bağlantısı alıcıya iletildiği ve/veya indirme başladığı andan itibaren cayma ve koşulsuz iade hakkı kullanılamaz. Vaat edilen işlevi karşılamayan dosyada yalnızca hatalı dosya telafisi uygulanır.',
} as const;
