export const categories = [
  {
    slug: 'finansal-analiz',
    name: 'Finansal Analiz',
    description: 'Kârlılık, maliyet ve finansal performansı Excel üzerinde analiz edin.',
    seoTitle: 'Finansal Analiz Excel Şablonları | Kârlılık ve Maliyet',
    seoDescription: 'Finansal analiz, kârlılık, proje maliyeti ve yönetim raporlaması için hazır Excel şablonlarını karşılaştırın; gerçek ürün ekranlarını ve demoları inceleyin.',
    primaryQuery: 'finansal analiz excel',
  },
  {
    slug: 'nakit-akisi',
    name: 'Nakit Akışı',
    description: 'Kasa, tahsilat, ödeme ve haftalık nakit ihtiyacını planlayın.',
    seoTitle: 'Nakit Akış Tablosu Excel Şablonları | Nakit Planlama',
    seoDescription: 'Nakit akış tablosu, 13 haftalık nakit akışı, kasa defteri ve ödeme planlama için hazır Excel şablonlarını karşılaştırın ve demo ile inceleyin.',
    primaryQuery: 'nakit akış tablosu excel',
  },
  {
    slug: 'muhasebe-ve-vergi',
    name: 'Muhasebe ve Vergi',
    description: 'Vergi, SGK, tahsilat ve finansal kayıt kontrollerini düzenli izleyin.',
    seoTitle: 'Muhasebe Excel Şablonları | Vergi, SGK ve Finans Takibi',
    seoDescription: 'Muhasebe, vergi, SGK teşvik, cari hesap ve finansal yükümlülük takibi için hazır Excel sistemlerini karşılaştırın; demo ve gerçek ekranları inceleyin.',
    primaryQuery: 'muhasebe excel şablonları',
  },
  {
    slug: 'butce-ve-planlama',
    name: 'Bütçe ve Planlama',
    description: 'Bütçe, ödeme, teklif ve dönemsel maliyet kararlarını planlayın.',
    seoTitle: 'Bütçe Excel Şablonları | Planlama ve Maliyet Takibi',
    seoDescription: 'Bütçe, ödeme planı, maliyet takibi ve finansal planlama için hazır Excel şablonlarını karşılaştırın; işletmenize uygun sistemi demo ile değerlendirin.',
    primaryQuery: 'bütçe excel şablonu',
  },
  {
    slug: 'stok-ve-uretim',
    name: 'Stok ve Üretim',
    description: 'Stok giriş çıkışı, satış ve stokta bağlı nakdi birlikte kontrol edin.',
    seoTitle: 'Stok Takip Excel Şablonları | Stok ve Üretim Takibi',
    seoDescription: 'Stok takip Excel şablonlarıyla giriş çıkış, satış, stok devir ve stokta bağlı nakdi izleyin; hazır sistemleri karşılaştırıp demo ile inceleyin.',
    primaryQuery: 'stok takip excel şablonu',
  },
  {
    slug: 'satis-ve-fiyatlama',
    name: 'Satış ve Fiyatlama',
    description: 'Fiyat, komisyon, teklif ve gerçek marj kararlarını hesaplayın.',
    seoTitle: 'Fiyat Hesaplama Excel Şablonları | Satış ve Maliyet',
    seoDescription: 'Fiyat hesaplama, POS komisyonu, teklif ve satış maliyeti için hazır Excel sistemlerini karşılaştırın; net tahsilat ve gerçek marjı görün.',
    primaryQuery: 'fiyat hesaplama excel',
  },
  {
    slug: 'personel-ve-bordro',
    name: 'Personel ve Bordro',
    description: 'İşçilik, kıdem, fazla mesai ve personel maliyetini hesaplayın.',
    seoTitle: 'Personel Maliyet Excel Şablonları | Bordro ve İşçilik',
    seoDescription: 'Personel maliyeti, kıdem ihbar, fazla mesai, SGK ve asgari ücret etkisi için hazır Excel hesaplama sistemlerini karşılaştırın.',
    primaryQuery: 'personel maliyet hesaplama excel',
  },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export function getCategoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
