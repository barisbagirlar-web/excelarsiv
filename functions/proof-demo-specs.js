'use strict';

/**
 * Proof Demo sözleşmeleri.
 * Bu dosya yalnızca demo değerini göstermek için kullanılan basitleştirilmiş hesapları içerir.
 * Premium MOTOR / AYARLAR / eşik seti / analitik formüller burada bulunmaz.
 */

const SPECS = Object.freeze({
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': {
    karar: 'Kasadaki kullanılabilir para, açık riski ve ödeme baskısını gösterir.',
    girisBasliklari: ['Tarih', 'Açıklama', 'Gelir (₺)', 'Gider (₺)', 'Yakın ödeme (₺)'],
    ornek: [
      ['01.08.2026', 'Günlük satış', 18500, 0, 0],
      ['02.08.2026', 'Tedarikçi ödemesi', 0, 7200, 0],
      ['03.08.2026', 'Müşteri tahsilatı', 9600, 0, 0],
      ['04.08.2026', 'Kira', 0, 5200, 0],
      ['05.08.2026', 'Yaklaşan vergi', 0, 0, 12000],
    ],
    metrikler: [
      ['Toplam gelir', '=SUM(DEMO_GIRIS!C6:C25)', 'para'],
      ['Toplam gider', '=SUM(DEMO_GIRIS!D6:D25)', 'para'],
      ['Yakın ödeme', '=SUM(DEMO_GIRIS!E6:E25)', 'para'],
      ['Kullanılabilir nakit', '=B6-B7-B8', 'para'],
      ['Demo karar', '=IF(B9<0,"DURDUR",IF(B9<5000,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Negatif kullanılabilir nakitte yeni ödeme taahhüdü verme.', 'Yakın ödemeleri tahsilat tarihleriyle eşleştir.', 'Tam sürümde kasa farkı, anomali ve ödeme önerisi birlikte çalışır.'],
  },
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': {
    karar: 'Hangi haftada nakit açığı oluşacağını ve ne kadar önlem gerektiğini gösterir.',
    girisBasliklari: ['Hafta', 'Açılış (₺)', 'Gelen (₺)', 'Giden (₺)', 'Kapanış (₺)'],
    ornek: [
      ['Hafta 1', 25000, 42000, 38500, '=B6+C6-D6'],
      ['Hafta 2', '=E6', 38000, 51000, '=B7+C7-D7'],
      ['Hafta 3', '=E7', 45000, 36000, '=B8+C8-D8'],
      ['Hafta 4', '=E8', 30000, 44000, '=B9+C9-D9'],
      ['Hafta 5', '=E9', 52000, 39000, '=B10+C10-D10'],
      ['Hafta 6', '=E10', 34000, 47000, '=B11+C11-D11'],
    ],
    metrikler: [
      ['En düşük kapanış', '=MIN(DEMO_GIRIS!E6:E25)', 'para'],
      ['Negatif hafta sayısı', '=COUNTIF(DEMO_GIRIS!E6:E25,"<0")', 'sayi'],
      ['Dönem net nakit', '=SUM(DEMO_GIRIS!C6:C25)-SUM(DEMO_GIRIS!D6:D25)', 'para'],
      ['Gerekli asgari önlem', '=MAX(0,-B6)', 'para'],
      ['Demo karar', '=IF(B7>0,"DURDUR",IF(B6<10000,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Negatif haftanın ödemelerini önceki haftalara yay.', 'Tahsilatı öne çekebileceğin müşterileri ayır.', 'Tam sürümde 13 hafta, senaryo, duyarlılık ve aksiyon motoru birlikte çalışır.'],
  },
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': {
    karar: 'Kime satış durdurulmalı ve kimden tahsilat hızlandırılmalı sorusunu yanıtlar.',
    girisBasliklari: ['Müşteri', 'Bakiye (₺)', 'Gecikme (gün)', 'Teminat (₺)', 'Planlanan tahsilat (₺)'],
    ornek: [
      ['Alfa Yapı', 85000, 42, 10000, 15000],
      ['Beta Tekstil', 32000, 7, 0, 12000],
      ['Gama Gıda', 120000, 65, 25000, 10000],
      ['Delta İnşaat', 18000, 0, 0, 18000],
      ['Epsilon Ltd.', 54000, 28, 15000, 8000],
    ],
    metrikler: [
      ['Toplam açık bakiye', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['30+ gün geciken müşteri', '=COUNTIF(DEMO_GIRIS!C6:C25,">30")', 'sayi'],
      ['Teminat açığı', '=MAX(0,SUM(DEMO_GIRIS!B6:B25)-SUM(DEMO_GIRIS!D6:D25)-SUM(DEMO_GIRIS!E6:E25))', 'para'],
      ['En yüksek gecikme', '=MAX(DEMO_GIRIS!C6:C25)', 'sayi'],
      ['Demo karar', '=IF(B7>=2,"DURDUR",IF(B8>50000,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['30+ gün geciken müşterilerde yeni vadeli satışı incele.', 'Teminat ve planlanan tahsilatı bakiye ile karşılaştır.', 'Tam sürümde müşteri bazlı risk sıralaması ve dinamik tahsilat aksiyonu açılır.'],
  },
  'banka-kredi-ve-taksit-takip-sistemi': {
    karar: 'Borç yükünü, yaklaşan taksit baskısını ve refinansman ihtiyacını gösterir.',
    girisBasliklari: ['Banka / kredi', 'Kalan borç (₺)', 'Aylık taksit (₺)', 'Vade gün', 'Aylık serbest nakit (₺)'],
    ornek: [
      ['Banka A - İşletme', 420000, 38000, 5, 80000],
      ['Banka B - Spot', 260000, 27000, 12, 80000],
      ['Banka C - Taşıt', 145000, 16000, 20, 80000],
      ['Finansman - Ekipman', 98000, 12000, 8, 80000],
    ],
    metrikler: [
      ['Toplam kalan borç', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Aylık toplam taksit', '=SUM(DEMO_GIRIS!C6:C25)', 'para'],
      ['15 gün içindeki taksit sayısı', '=COUNTIF(DEMO_GIRIS!D6:D25,"<=15")', 'sayi'],
      ['Taksit / serbest nakit', '=IFERROR(B7/MAX(DEMO_GIRIS!E6:E25),0)', 'yuzde'],
      ['Demo karar', '=IF(B9>1,"DURDUR",IF(B9>0.75,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Taksit yükü serbest nakdi aşıyorsa yeni borçlanmayı durdur.', '15 gün içindeki taksitleri tahsilat planıyla eşleştir.', 'Tam sürümde banka/kredi yoğunlaşması, takvim ve refinansman sinyali detaylanır.'],
  },
  'cek-senet-ve-vade-risk-sistemi': {
    karar: 'Ödeme yoğunlaşmasının hangi tarihte oluştuğunu ve karşılıksız kalma riskini gösterir.',
    girisBasliklari: ['Vade', 'Belge', 'Tutar (₺)', 'Hazır karşılık (₺)', 'Durum'],
    ornek: [
      ['12.08.2026', 'Çek-001', 48000, 30000, 'Bekliyor'],
      ['14.08.2026', 'Çek-002', 72000, 25000, 'Bekliyor'],
      ['14.08.2026', 'Senet-003', 55000, 15000, 'Bekliyor'],
      ['28.08.2026', 'Çek-004', 32000, 32000, 'Hazır'],
      ['02.09.2026', 'Senet-005', 64000, 20000, 'Bekliyor'],
    ],
    metrikler: [
      ['Toplam vade yükü', '=SUM(DEMO_GIRIS!C6:C25)', 'para'],
      ['Toplam hazır karşılık', '=SUM(DEMO_GIRIS!D6:D25)', 'para'],
      ['Karşılık açığı', '=MAX(0,B6-B7)', 'para'],
      ['En büyük tek belge', '=MAX(DEMO_GIRIS!C6:C25)', 'para'],
      ['Demo karar', '=IF(B8>75000,"DURDUR",IF(B8>25000,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Aynı haftaya yığılan vadeleri yeniden planla.', 'Karşılığı ayrılmamış büyük belgeleri önceliklendir.', 'Tam sürümde tarih yoğunluğu, senaryo ve kök-neden risk analizi açılır.'],
  },
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': {
    karar: 'Ciro ile gerçek nakit kazancı arasındaki farkı gösterir.',
    girisBasliklari: ['Gün', 'Ciro (₺)', 'Direkt gider (₺)', 'Sabit/nakit gider (₺)', 'Tahsil edilen (₺)'],
    ornek: [
      ['Pazartesi', 42000, 21000, 8500, 36000],
      ['Salı', 38000, 20500, 8500, 25000],
      ['Çarşamba', 51000, 26000, 8500, 47000],
      ['Perşembe', 33000, 19000, 8500, 28000],
      ['Cuma', 62000, 31500, 8500, 50000],
    ],
    metrikler: [
      ['Toplam ciro', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Gerçek nakit gider', '=SUM(DEMO_GIRIS!C6:C25)+SUM(DEMO_GIRIS!D6:D25)', 'para'],
      ['Hesaplanan kâr', '=B6-B7', 'para'],
      ['Tahsilat-kâr farkı', '=SUM(DEMO_GIRIS!E6:E25)-B7', 'para'],
      ['Demo karar', '=IF(B8<0,"DURDUR",IF(B9<B8*0.5,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Ciro yüksek olsa da nakit gideri aşmıyorsa büyümeyi sorgula.', 'Tahsilat ile hesaplanan kâr arasındaki farkı izle.', 'Tam sürümde gerçek kârlılık, nakit bağlanması ve senaryo analizi ayrıştırılır.'],
  },
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': {
    karar: 'Bugünkü paranın ne kadarının gerçekte harcanabilir olmadığını gösterir.',
    girisBasliklari: ['Dönem', 'Mevcut nakit (₺)', 'Vergi karşılığı (₺)', 'SGK+maaş (₺)', 'Diğer zorunlu (₺)'],
    ornek: [
      ['Ağustos', 280000, 62000, 118000, 18000],
      ['Eylül', 210000, 51000, 112000, 15000],
    ],
    metrikler: [
      ['Toplam görünen nakit', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Toplam zorunlu karşılık', '=SUM(DEMO_GIRIS!C6:E25)', 'para'],
      ['Gerçek harcanabilir nakit', '=B6-B7', 'para'],
      ['Karşılık / nakit', '=IFERROR(B7/B6,0)', 'yuzde'],
      ['Demo karar', '=IF(B8<0,"DURDUR",IF(B9>0.8,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Vergi, SGK ve maaş karşılıklarını ayrı tut.', 'Harcanabilir nakit negatifse discretionary ödemeyi durdur.', 'Tam sürümde dönemsel tahakkuk ve ödeme takvimi detaylanır.'],
  },
  'stok-satis-ve-nakit-baglanma-sistemi': {
    karar: 'Hangi stokun para tükettiğini ve hangisinin yeniden alınması gerektiğini gösterir.',
    girisBasliklari: ['Ürün', 'Stok maliyeti (₺)', '30 gün satış (₺)', 'Brüt marj %', 'Tedarik süresi (gün)'],
    ornek: [
      ['Ürün A', 95000, 18000, 0.28, 12],
      ['Ürün B', 42000, 68000, 0.34, 8],
      ['Ürün C', 120000, 7000, 0.22, 25],
      ['Ürün D', 28000, 51000, 0.31, 5],
      ['Ürün E', 76000, 11000, 0.18, 18],
    ],
    metrikler: [
      ['Toplam stok maliyeti', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['30 gün satış', '=SUM(DEMO_GIRIS!C6:C25)', 'para'],
      ['Stok / satış oranı', '=IFERROR(B6/B7,0)', 'oran'],
      ['Satışı çok düşük ürün', '=COUNTIF(DEMO_GIRIS!C6:C25,"<15000")', 'sayi'],
      ['Demo karar', '=IF(B8>2,"DURDUR",IF(B9>=2,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Satışı düşük ve stok maliyeti yüksek ürünlerde yeniden alımı durdur.', 'Hızlı dönen ürünlerde tedarik süresini ayrıca izle.', 'Tam sürümde stok gün sayısı, yeniden sipariş ve nakit bağlanma motoru açılır.'],
  },
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': {
    karar: 'Bankanın eksik yatırdığı veya komisyona giden tutarı gösterir.',
    girisBasliklari: ['Gün', 'Brüt POS (₺)', 'Komisyon %', 'Beklenen net (₺)', 'Banka yatan (₺)'],
    ornek: [
      ['01.08.2026', 35000, 0.025, '=B6*(1-C6)', 34050],
      ['02.08.2026', 42000, 0.027, '=B7*(1-C7)', 40700],
      ['03.08.2026', 28000, 0.025, '=B8*(1-C8)', 27250],
      ['04.08.2026', 51000, 0.030, '=B9*(1-C9)', 48900],
    ],
    metrikler: [
      ['Toplam brüt POS', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Beklenen net', '=SUM(DEMO_GIRIS!D6:D25)', 'para'],
      ['Banka yatan', '=SUM(DEMO_GIRIS!E6:E25)', 'para'],
      ['Mutabakat farkı', '=B8-B7', 'para'],
      ['Demo karar', '=IF(ABS(B9)>2500,"DURDUR",IF(ABS(B9)>500,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Banka yatan ile beklenen neti günlük karşılaştır.', 'Fark büyüyorsa komisyon/valör/kesinti belgesini kontrol et.', 'Tam sürümde banka bazlı mutabakat ve kök-neden ayrıştırması açılır.'],
  },
  'aylik-patron-finans-paneli': {
    karar: 'İşletmenin finansal durumunu tek ekranda yorumlar.',
    girisBasliklari: ['Gösterge', 'Tutar (₺)', 'Not', 'Dönem', 'Kaynak'],
    ornek: [
      ['Nakit', 185000, '', 'Ağustos', 'Kasa+Banka'],
      ['Alacak', 420000, '', 'Ağustos', 'Cari'],
      ['Stok', 310000, '', 'Ağustos', 'Stok'],
      ['Kısa borç', 560000, '', 'Ağustos', 'Borç'],
      ['Aylık gelir', 740000, '', 'Ağustos', 'Satış'],
      ['Aylık gider', 675000, '', 'Ağustos', 'Muhasebe'],
    ],
    metrikler: [
      ['Toplam likit varlık', '=SUM(DEMO_GIRIS!B6:B8)', 'para'],
      ['Kısa borç', '=DEMO_GIRIS!B9', 'para'],
      ['Aylık net', '=DEMO_GIRIS!B10-DEMO_GIRIS!B11', 'para'],
      ['Likidite tamponu', '=B6-B7', 'para'],
      ['Demo karar', '=IF(B9<0,"DURDUR",IF(B8<0,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Likidite tamponunu kısa borçla birlikte değerlendir.', 'Aylık net ile nakit değişimini aynı şey kabul etme.', 'Tam sürümde yönetici KPI, trend, senaryo ve aksiyonlar tek sayfada birleşir.'],
  },
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': {
    karar: 'Hangi işin para kazandırdığını ve hangisinin nakit tükettiğini gösterir.',
    girisBasliklari: ['Proje / iş', 'Gelir (₺)', 'Direkt maliyet (₺)', 'Personel (₺)', 'Finansman/nakit (₺)'],
    ornek: [
      ['Proje A', 320000, 165000, 72000, 18000],
      ['Proje B', 210000, 138000, 54000, 24000],
      ['Proje C', 480000, 255000, 98000, 32000],
      ['Proje D', 145000, 97000, 41000, 15000],
    ],
    metrikler: [
      ['Toplam proje geliri', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Toplam gerçek maliyet', '=SUM(DEMO_GIRIS!C6:E25)', 'para'],
      ['Gerçek proje kârı', '=B6-B7', 'para'],
      ['Gerçek marj', '=IFERROR(B8/B6,0)', 'yuzde'],
      ['Demo karar', '=IF(B8<0,"DURDUR",IF(B9<0.10,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Gelir yerine gerçek proje marjını yönetin.', 'Finansman ve işletme sermayesi etkisini maliyetten ayırmayın.', 'Tam sürümde iş bazlı nakit tüketimi, senaryo ve teklif eşiği açılır.'],
  },
  'kobi-finans-yonetim-paketi': {
    karar: 'Günlük finans operasyonunun ana risklerini tek dosyada birleştirir.',
    girisBasliklari: ['Gösterge', 'Tutar (₺)', 'Kritik eşik (₺)', 'Durum notu', 'Kaynak'],
    ornek: [
      ['Kullanılabilir nakit', 135000, 100000, '', 'Kasa'],
      ['30 gün tahsilat', 260000, 220000, '', 'Cari'],
      ['30 gün ödeme', 315000, 250000, '', 'Ödeme'],
      ['Aylık taksit', 92000, 85000, '', 'Kredi'],
      ['Vergi+SGK+maaş', 168000, 160000, '', 'Karşılık'],
      ['Stok bağlanması', 240000, 200000, '', 'Stok'],
    ],
    metrikler: [
      ['Toplam izlenen finansal yük', '=SUM(DEMO_GIRIS!B6:B11)', 'para'],
      ['Eşik toplamı', '=SUM(DEMO_GIRIS!C6:C11)', 'para'],
      ['Eşiği aşan gösterge', '=SUMPRODUCT(--(DEMO_GIRIS!B6:B11>DEMO_GIRIS!C6:C11))', 'sayi'],
      ['Genel baskı oranı', '=IFERROR(B6/B7,0)', 'oran'],
      ['Demo karar', '=IF(B8>=3,"DURDUR",IF(B8>=1,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Kasa, cari, borç, karşılık ve stok baskısını birlikte okuyun.', 'Tek bir göstergenin iyi olması genel finans sağlığını garanti etmez.', 'Tam sürüm diğer finans motorlarını ortak yönetim ve karar katmanında birleştirir.'],
  },
});

function getProofDemoSpec(slug) {
  return SPECS[slug] ?? null;
}

module.exports = { SPECS, getProofDemoSpec };
