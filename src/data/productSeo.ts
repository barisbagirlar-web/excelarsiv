export interface ProductSeoEntry {
  title: string;
  description: string;
  primaryQuery: string;
  guideSlug?: string;
  guideLinkLabel?: string;
}

export const productSeo: Record<string, ProductSeoEntry> = {
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': { title:'13 Haftalık Nakit Akışı Excel | Ödeme Planlama', description:'13 haftalık nakit akış tablosunda tahsilat ve ödemeleri haftalık planlayın; nakit açığını, ödeme baskısını ve kasa dengesini önceden görün.', primaryQuery:'13 haftalık nakit akışı excel', guideSlug:'13-haftalik-nakit-akisi-excel', guideLinkLabel:'13 haftalık nakit akışı Excel rehberini okuyun' },
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': { title:'Kasa Defteri Excel | Gelir Gider ve Nakit Takibi', description:'Kasa defteri Excel sistemiyle günlük nakit giriş çıkışını, açılış-kapanış bakiyesini ve gelir gider hareketlerini düzenli takip edin.', primaryQuery:'kasa defteri excel', guideSlug:'kasa-defteri-excel', guideLinkLabel:'Kasa defteri Excel rehberini okuyun' },
  'aylik-patron-finans-paneli': { title:'Finans Dashboard Excel | Aylık Patron Paneli', description:'Nakit, borç, tahsilat ve kârlılık göstergelerini tek yönetici ekranında birleştiren aylık finans dashboard Excel sistemini inceleyin.', primaryQuery:'finans dashboard excel' },
  'banka-kredi-ve-taksit-takip-sistemi': { title:'Kredi Takip Excel | Banka Kredisi ve Taksit Takibi', description:'Banka kredilerini, taksit tarihlerini, kalan borcu ve ödeme yükünü tek Excel sisteminde izleyerek kredi ödeme takviminizi yönetin.', primaryQuery:'kredi takip excel' },
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': { title:'Cari Hesap Takip Excel | Tahsilat ve Risk', description:'Cari hesap takip Excel sistemiyle tahsilatları, geciken alacakları ve müşteri riskini izleyin; kimin ne kadar borçlu olduğunu net görün.', primaryQuery:'cari hesap takip excel', guideSlug:'cari-hesap-takip-excel', guideLinkLabel:'Cari hesap takip Excel rehberini okuyun' },
  'cek-senet-ve-vade-risk-sistemi': { title:'Çek Senet Takip Excel | Vade ve Risk Kontrolü', description:'Çek ve senetleri vade, tutar, taraf ve tahsilat durumuyla tek Excel sisteminde izleyin; yaklaşan ödeme ve tahsilat yoğunluğunu görün.', primaryQuery:'çek senet takip excel' },
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': { title:'Gelir Gider Tablosu Excel | Gerçek Kârlılık', description:'Günlük gelir gider tablosunu Excel üzerinde yönetin; hareketlerin gerçek kârlılığa etkisini dönem ve kategori bazında takip edin.', primaryQuery:'gelir gider tablosu excel' },
  'kobi-finans-yonetim-paketi': { title:'KOBİ Finans Takip Excel | Nakit, Borç ve Kârlılık', description:'KOBİ nakit akışı, cari hesap, borç, stok ve kârlılık takibini tek pakette birleştiren Excel finans yönetim sistemini inceleyin.', primaryQuery:'kobi finans takip excel' },
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': { title:'POS Komisyon Hesaplama Excel | Net Tahsilat', description:'POS satışlarını, banka komisyonlarını ve hesaba geçecek net tahsilatı Excel üzerinde karşılaştırın; kesinti ve vade farkını görün.', primaryQuery:'pos komisyon hesaplama excel' },
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': { title:'Proje Maliyet Takip Excel | Gerçek Kârlılık', description:'Proje gelirini, doğrudan giderleri ve iş bazında gerçek kârlılığı Excel üzerinde takip ederek hangi işin ne kadar kazandırdığını görün.', primaryQuery:'proje maliyet takip excel' },
  'stok-satis-ve-nakit-baglanma-sistemi': { title:'Stok Takip Excel Şablonu | Satış ve Nakit', description:'Stok takip Excel şablonuyla giriş çıkışı, satışları, ürün bazlı kârlılığı ve stokta bağlı nakdi tek sistem üzerinden izleyin.', primaryQuery:'stok takip excel şablonu', guideSlug:'stok-takip-excel', guideLinkLabel:'Stok takip Excel rehberini okuyun' },
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': { title:'Vergi SGK Takip Excel | Maaş ve Ödeme Planı', description:'Vergi, SGK ve maaş yükümlülükleri için dönemsel karşılık ayırın; yaklaşan ödeme ihtiyacını tek Excel planında görün ve takip edin.', primaryQuery:'vergi sgk takip excel' },
  'asiri-dusuk-teklif-savunma-robotu': { title:'Aşırı Düşük Teklif Açıklaması Excel | İhale Analizi', description:'Aşırı düşük teklif açıklaması için maliyet kalemlerini, teklif dayanaklarını ve savunma hesaplarını düzenli bir Excel çalışma yapısında hazırlayın.', primaryQuery:'aşırı düşük teklif açıklaması excel' },
  'ihaleye-kac-tl-teklif-vermeliyim': { title:'İhale Teklif Hesaplama Excel | Sınır Değer', description:'İhale teklif tutarını maliyet, marj ve sınır değer yaklaşımıyla değerlendirmek için karar destekli Excel hesaplama sistemini kullanın.', primaryQuery:'ihale teklif hesaplama excel' },
  'hakedis-fiyat-farki-hak-kaybi-cetveli': { title:'Hakediş Fiyat Farkı Hesaplama Excel | Hak Kaybı', description:'Hakediş dönemlerini ve fiyat farkını Excel üzerinde hesaplayıp karşılaştırın; eksik hesaplanan tutarları ve olası hak kaybını görün.', primaryQuery:'hakediş fiyat farkı hesaplama excel' },
  'yillara-sari-insaat-stopaj-nakit-akis-planlayici': { title:'Yıllara Sari İnşaat Stopaj Excel | Nakit Akışı', description:'Yıllara sari inşaat işlerinde stopaj etkisini ve dönemsel nakit akışını Excel üzerinde birlikte planlayın ve ödeme baskısını görün.', primaryQuery:'yıllara sari inşaat stopaj excel' },
  'taseron-hakedis-kesinti-mutabakati': { title:'Taşeron Hakediş Takip Excel | Kesinti Mutabakatı', description:'Taşeron ve alt yüklenici hakedişlerini, kesintileri ve mutabakat farklarını tek Excel çalışma yapısında takip edip kontrol edin.', primaryQuery:'taşeron hakediş takip excel' },
  'kacirilan-sgk-tesvikleri-ve-gercek-iscilik-maliyeti-analizi': { title:'SGK Teşvik Hesaplama Excel | İşçilik Maliyeti', description:'SGK teşvik hesaplama ve gerçek işçilik maliyetini Excel üzerinde karşılaştırın; kullanılmayan teşvikleri ve maliyet farklarını görün.', primaryQuery:'sgk teşvik hesaplama excel' },
  'kidem-ihbar-yuku-ve-personel-cikarma-maliyeti-hesaplayici': { title:'Kıdem İhbar Hesaplama Excel | Personel Maliyeti', description:'Kıdem, ihbar ve personel çıkarma maliyetini çalışan bazında Excel üzerinde hesaplayın ve toplam yükümlülüğü görün.', primaryQuery:'kıdem ihbar hesaplama excel' },
  'fazla-mesai-ve-isci-dava-riski-tespit-dosyasi': { title:'Fazla Mesai Hesaplama Excel | İşçi Dava Riski', description:'Fazla mesai kayıtlarını ve olası işçi alacak riskini Excel üzerinde analiz ederek dönemsel dava riskini ve mali yükü görün.', primaryQuery:'fazla mesai hesaplama excel' },
  'asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli': { title:'Asgari Ücret Zam Etkisi Excel | Fiyat Ayarlama', description:'Asgari ücret artışının işçilik maliyeti ve satış fiyatı üzerindeki etkisini Excel üzerinde hesaplayarak fiyat ayarlama ihtiyacını görün.', primaryQuery:'asgari ücret zam etkisi excel' },
  'ithalat-depo-teslim-rafa-gelen-net-birim-maliyet': { title:'İthalat Maliyet Hesaplama Excel | Net Birim Maliyet', description:'Ürün bedeli, kur, navlun, vergi ve diğer ithalat giderlerini Excel üzerinde birleştirerek depoya gelen net birim maliyeti hesaplayın.', primaryQuery:'ithalat maliyet hesaplama excel' },
};

export function getProductSeoByPath(pathname: string): ProductSeoEntry | null {
  const match = pathname.match(/^\/sablon\/([^/]+)\/?$/);
  return match?.[1] ? productSeo[match[1]] ?? null : null;
}
