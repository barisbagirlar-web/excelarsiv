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
  /** Kayıtlı işyeri adresi / VKN / MERSIS kullanıcıdan gelmeden uydurulmaz. */
  adresBeyani:
    'Türkiye. Kayıtlı işyeri adresi, vergi kimlik numarası ve MERSIS numarası fatura üzerinde yer alır; yazılı talep üzerine paylaşılır.',
  ulke: 'TR',
} as const;

/** Dijital içerikte cayma/iade: indirme başladıktan sonra kullanılmaz. */
export const IADE_POLITIKASI = {
  dijitalCayma: false,
  schemaCategory: 'https://schema.org/MerchantReturnNotPermitted' as const,
  ozet:
    'Ürün dijital içeriktir. İndirme bağlantısı alıcıya iletildiği ve/veya indirme başladığı andan itibaren cayma ve koşulsuz iade hakkı kullanılamaz. Vaat edilen işlevi karşılamayan dosyada yalnızca hatalı dosya telafisi uygulanır.',
} as const;
