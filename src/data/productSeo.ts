export interface ProductSeoEntry {
  title: string;
  description: string;
  primaryQuery: string;
  guideSlug?: string;
  guideLinkLabel?: string;
}

export const productSeo: Record<string, ProductSeoEntry> = {
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': { title:'13 Haftalık Nakit Akışı Excel | Ödeme Planlama', description:'13 haftalık tahsilat ve ödeme takvimini tek Excel sisteminde izleyin; haftalık nakit açığını, ödeme baskısını ve kasa dengesini görün.', primaryQuery:'13 haftalık nakit akışı excel', guideSlug:'13-haftalik-nakit-akisi-excel', guideLinkLabel:'13 haftalık nakit akışı Excel rehberini okuyun' },
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': { title:'Kasa Defteri Excel | Günlük Nakit Kontrolü', description:'Günlük kasa giriş çıkışlarını, nakit bakiyesini ve gelir gider hareketlerini tek Excel dosyasında düzenli ve kontrol edilebilir izleyin.', primaryQuery:'kasa defteri excel', guideSlug:'kasa-defteri-excel', guideLinkLabel:'Kasa defteri Excel rehberini okuyun' },
  'aylik-patron-finans-paneli': { title:'Finans Dashboard Excel | Aylık Patron Paneli', description:'Nakit, borç, tahsilat ve kârlılık göstergelerini tek yönetici ekranında birleştiren aylık finans dashboard Excel sistemini inceleyin.', primaryQuery:'finans dashboard excel' },
  'banka-kredi-ve-taksit-takip-sistemi': { title:'Kredi Takip Excel | Taksit ve Borç Planlama', description:'Banka kredilerini, taksit tarihlerini, kalan borcu ve ödeme yükünü tek Excel sisteminde takip ederek finansman takviminizi düzenleyin.', primaryQuery:'kredi takip excel' },
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': { title:'Cari Hesap Takip Excel | Tahsilat ve Risk', description:'Cari hesap, tahsilat, geciken alacak ve müşteri riskini tek Excel sisteminde izleyin; kimin ne kadar borçlu olduğunu netleştirin.', primaryQuery:'cari hesap takip excel', guideSlug:'cari-hesap-takip-excel', guideLinkLabel:'Cari hesap takip Excel rehberini okuyun' },
  'cek-senet-ve-vade-risk-sistemi': { title:'Çek Senet Takip Excel | Vade ve Risk Kontrolü', description:'Çek ve senetleri vade, tutar, taraf ve tahsilat durumuyla tek Excel sisteminde izleyin; yaklaşan ödeme ve tahsilat yoğunluğunu görün.', primaryQuery:'çek senet takip excel' },
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': { title:'Gelir Gider Takip Excel | Gerçek Kârlılık', description:'Günlük gelir ve giderleri kaydedin; hareketlerin gerçek kârlılığa etkisini tek Excel sisteminde dönem ve kategori bazında takip edin.', primaryQuery:'gelir gider takip excel' },
  'kobi-finans-yonetim-paketi': { title:'KOBİ Finans Yönetimi Excel | Nakit ve Kârlılık', description:'KOBİ nakit akışı, cari hesap, borç, stok ve kârlılık takibini tek pakette birleştiren Excel finans yönetim sistemini inceleyin.', primaryQuery:'kobi finans yönetim excel' },
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': { title:'POS Komisyon Hesaplama Excel | Net Tahsilat', description:'POS satışlarını, banka komisyonlarını ve hesaba geçecek net tahsilatı Excel üzerinde karşılaştırın; kesinti ve vade farkını görün.', primaryQuery:'pos komisyon hesaplama excel' },
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': { title:'Proje Kârlılık Excel | İş Bazında Maliyet', description:'Proje gelirini, doğrudan giderleri ve iş bazında gerçek kârlılığı Excel üzerinde takip ederek hangi işin ne ürettiğini görün.', primaryQuery:'proje karlılık excel' },
  'stok-satis-ve-nakit-baglanma-sistemi': { title:'Stok Takip Excel | Satış ve Nakit Bağlanma', description:'Stok giriş çıkışını, satışları, ürün bazlı kârlılığı ve stokta bağlı nakdi tek Excel sistemi üzerinden izleyin ve kontrol edin.', primaryQuery:'stok takip excel', guideSlug:'stok-takip-excel', guideLinkLabel:'Stok takip Excel rehberini okuyun' },
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': { title:'Vergi SGK Takip Excel | Maaş Karşılık Planı', description:'Vergi, SGK ve maaş yükümlülükleri için dönemsel karşılık ayırın; yaklaşan ödeme ihtiyacını tek Excel planında görün ve takip edin.', primaryQuery:'vergi sgk takip excel' },
  'asiri-dusuk-teklif-savunma-robotu': { title:'Aşırı Düşük Teklif Savunma Excel | İhale Analizi', description:'Aşırı düşük teklif açıklaması için maliyet kalemlerini, teklif dayanaklarını ve savunma hesaplarını düzenli bir Excel çalışma yapısında hazırlayın.', primaryQuery:'aşırı düşük teklif savunma excel' },
  'ihaleye-kac-tl-teklif-vermeliyim': { title:'İhale Teklif Hesaplama Excel | Sınır Değer', description:'İhale teklif tutarını maliyet, marj ve sınır değer yaklaşımıyla değerlendirmek için karar destekli Excel hesaplama sistemini kullanın.', primaryQuery:'ihale teklif hesaplama excel' },
  'hakedis-fiyat-farki-hak-kaybi-cetveli': { title:'Hakediş Fiyat Farkı Excel | Hak Kaybı Cetveli', description:'Hakediş dönemlerini ve fiyat farklarını Excel üzerinde karşılaştırın; eksik hesaplanan tutarları ve olası hak kaybını görün.', primaryQuery:'hakediş fiyat farkı excel' },
  'yillara-sari-insaat-stopaj-nakit-akis-planlayici': { title:'Yıllara Sari İnşaat Stopaj Excel | Nakit Akışı', description:'Yıllara sari inşaat işlerinde stopaj etkisini ve dönemsel nakit akışını Excel üzerinde birlikte planlayın ve ödeme baskısını görün.', primaryQuery:'yıllara sari inşaat stopaj excel' },
  'taseron-hakedis-kesinti-mutabakati': { title:'Taşeron Hakediş Excel | Kesinti Mutabakatı', description:'Taşeron ve alt yüklenici hakedişlerini, kesintileri ve mutabakat farklarını tek Excel çalışma yapısında kontrol edin.', primaryQuery:'taşeron hakediş excel' },
  'kacirilan-sgk-tesvikleri-ve-gercek-iscilik-maliyeti-analizi': { title:'SGK Teşvik Analizi Excel | İşçilik Maliyeti', description:'Kullanılmayan SGK teşviklerini ve gerçek işçilik maliyetini Excel üzerinde karşılaştırarak maliyet ve teşvik farklarını görün.', primaryQuery:'sgk teşvik analizi excel' },
  'kidem-ihbar-yuku-ve-personel-cikarma-maliyeti-hesaplayici': { title:'Kıdem İhbar Hesaplama Excel | Personel Maliyeti', description:'Kıdem, ihbar ve personel çıkarma maliyetini çalışan bazında Excel üzerinde hesaplayın ve toplam yükümlülüğü görün.', primaryQuery:'kıdem ihbar hesaplama excel' },
  'fazla-mesai-ve-isci-dava-riski-tespit-dosyasi': { title:'Fazla Mesai Hesaplama Excel | İşçi Dava Riski', description:'Fazla mesai kayıtlarını ve olası işçi alacak riskini Excel üzerinde analiz ederek dönemsel dava riskini ve mali yükü görün.', primaryQuery:'fazla mesai hesaplama excel' },
  'asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli': { title:'Asgari Ücret Zam Etkisi Excel | Fiyat Ayarlama', description:'Asgari ücret artışının işçilik maliyeti ve satış fiyatı üzerindeki etkisini Excel üzerinde hesaplayarak fiyat ayarlama ihtiyacını görün.', primaryQuery:'asgari ücret zam etkisi excel' },
  'ithalat-depo-teslim-rafa-gelen-net-birim-maliyet': { title:'İthalat Maliyet Hesaplama Excel | Net Birim Maliyet', description:'Ürün bedeli, kur, navlun, vergi ve diğer ithalat giderlerini Excel üzerinde birleştirerek depoya gelen net birim maliyeti hesaplayın.', primaryQuery:'ithalat maliyet hesaplama excel' },
};

export function getProductSeoByPath(pathname: string): ProductSeoEntry | null {
  const match = pathname.match(/^\/sablon\/([^/]+)\/?$/);
  return match?.[1] ? productSeo[match[1]] ?? null : null;
}
