export interface ProductSeoEntry {
  title: string;
  description: string;
  primaryQuery: string;
  guideSlug?: string;
  guideLinkLabel?: string;
}

export const productSeo: Record<string, ProductSeoEntry> = {
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': {
    title: '13 Haftalık Nakit Akışı Excel | Ödeme Planlama',
    description: '13 haftalık tahsilat ve ödeme takvimini tek Excel sisteminde izleyin; haftalık nakit açığını, ödeme baskısını ve kasa dengesini görün.',
    primaryQuery: '13 haftalık nakit akışı excel',
    guideSlug: '13-haftalik-nakit-akisi-excel',
    guideLinkLabel: '13 haftalık nakit akışı Excel rehberini okuyun',
  },
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': {
    title: 'Kasa Defteri Excel | Günlük Nakit Kontrolü',
    description: 'Günlük kasa giriş çıkışlarını, nakit bakiyesini ve gelir gider hareketlerini tek Excel dosyasında düzenli ve kontrol edilebilir izleyin.',
    primaryQuery: 'kasa defteri excel',
    guideSlug: 'kasa-defteri-excel',
    guideLinkLabel: 'Kasa defteri Excel rehberini okuyun',
  },
  'aylik-patron-finans-paneli': {
    title: 'Finans Dashboard Excel | Aylık Patron Paneli',
    description: 'Nakit, borç, tahsilat ve kârlılık göstergelerini tek yönetici ekranında birleştiren aylık finans dashboard Excel sistemini inceleyin.',
    primaryQuery: 'finans dashboard excel',
  },
  'banka-kredi-ve-taksit-takip-sistemi': {
    title: 'Kredi Takip Excel | Taksit ve Borç Planlama',
    description: 'Banka kredilerini, taksit tarihlerini, kalan borcu ve ödeme yükünü tek Excel sisteminde takip ederek finansman takviminizi düzenleyin.',
    primaryQuery: 'kredi takip excel',
  },
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': {
    title: 'Cari Hesap Takip Excel | Tahsilat ve Risk',
    description: 'Cari hesap, tahsilat, geciken alacak ve müşteri riskini tek Excel sisteminde izleyin; kimin ne kadar borçlu olduğunu netleştirin.',
    primaryQuery: 'cari hesap takip excel',
    guideSlug: 'cari-hesap-takip-excel',
    guideLinkLabel: 'Cari hesap takip Excel rehberini okuyun',
  },
  'cek-senet-ve-vade-risk-sistemi': {
    title: 'Çek Senet Takip Excel | Vade ve Risk Kontrolü',
    description: 'Çek ve senetleri vade, tutar, taraf ve tahsilat durumuyla tek Excel sisteminde izleyin; yaklaşan ödeme ve tahsilat yoğunluğunu görün.',
    primaryQuery: 'çek senet takip excel',
  },
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': {
    title: 'Gelir Gider Takip Excel | Gerçek Kârlılık',
    description: 'Günlük gelir ve giderleri kaydedin; hareketlerin gerçek kârlılığa etkisini tek Excel sisteminde dönem ve kategori bazında takip edin.',
    primaryQuery: 'gelir gider takip excel',
  },
  'kobi-finans-yonetim-paketi': {
    title: 'KOBİ Finans Yönetimi Excel | Nakit ve Kârlılık',
    description: 'KOBİ nakit akışı, cari hesap, borç, stok ve kârlılık takibini tek pakette birleştiren Excel finans yönetim sistemini inceleyin.',
    primaryQuery: 'kobi finans yönetim excel',
  },
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': {
    title: 'POS Komisyon Hesaplama Excel | Net Tahsilat',
    description: 'POS satışlarını, banka komisyonlarını ve hesaba geçecek net tahsilatı Excel üzerinde karşılaştırın; kesinti ve vade farkını görün.',
    primaryQuery: 'pos komisyon hesaplama excel',
  },
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': {
    title: 'Proje Kârlılık Excel | İş Bazında Maliyet',
    description: 'Proje gelirini, doğrudan giderleri ve iş bazında gerçek kârlılığı Excel üzerinde takip ederek hangi işin ne ürettiğini görün.',
    primaryQuery: 'proje karlılık excel',
  },
  'stok-satis-ve-nakit-baglanma-sistemi': {
    title: 'Stok Takip Excel | Satış ve Nakit Bağlanma',
    description: 'Stok giriş çıkışını, satışları, ürün bazlı kârlılığı ve stokta bağlı nakdi tek Excel sistemi üzerinden izleyin ve kontrol edin.',
    primaryQuery: 'stok takip excel',
    guideSlug: 'stok-takip-excel',
    guideLinkLabel: 'Stok takip Excel rehberini okuyun',
  },
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': {
    title: 'Vergi SGK Takip Excel | Maaş Karşılık Planı',
    description: 'Vergi, SGK ve maaş yükümlülükleri için dönemsel karşılık ayırın; yaklaşan ödeme ihtiyacını tek Excel planında görün ve takip edin.',
    primaryQuery: 'vergi sgk takip excel',
  },
};

export function getProductSeoByPath(pathname: string): ProductSeoEntry | null {
  const match = pathname.match(/^\/sablon\/([^/]+)\/?$/);
  return match?.[1] ? productSeo[match[1]] ?? null : null;
}
