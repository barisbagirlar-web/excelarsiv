#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""13 yeni ürün için MDX ürün sayfası üretir.

Her ürün için src/content/templates/<slug>.mdx dosyasını; sheetMap metadata'sını
delivery/paid-products/<slug>/current.xlsx gerçek dosyasından ve ürün bilgilerini
aşağıdaki ÜRÜNLER sözlüğünden alarak üretir. Bu script elle çalıştırılır ve
çıktıları git ile sürümlenir.
"""
import json
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESLIM = os.path.join(KOK, "delivery", "paid-products")
MDX_KONUM = os.path.join(KOK, "src", "content", "templates")

# slug -> (ad, kategori, özet, girdiler, çıktılar, uygun, uygun_degil, faq, iliskili)
URUNLER = {
    "amortisman-ve-sabit-kiymet-satis-zamanlama-stratejisti": {
        "ad": "Amortisman & Sabit Kıymet Satış Zamanlama Stratejisti",
        "kategori": "muhasebe-ve-vergi",
        "ozet": "Normal ve azalan bakiyeli amortismanı, kıst amortismanı ve dört çeyrek satış senaryosunda vergi etkisini hesaplayın; en uygun satış dönemini bulun.",
        "girdi": ["Sabit kıymet listesi (edinim, tutar, ömür, yöntem)", "Satış senaryoları (çeyrek, satış bedeli)", "Vergi oranı ve iskonto parametreleri"],
        "cikti": ["Normal ve azalan bakiyeli amortisman", "Çeyrek bazlı kıst amortisman ve satış kârı/zararı", "Net nakit ve bugünkü değer karşılaştırması"],
        "uygun": ["Sabit kıymet satışı planlayan işletmeler", "Amortisman yöntemi karşılaştırması yapan muhasebeciler", "Satış zamanlamasını vergi etkisiyle optimize etmek isteyenler"],
        "uygun_degil": ["Amortisman hesabını mevcut muhasebe paketinde yapanlar", "Tek dönemlik basit amortisman ihtiyacı"],
        "faq": [
            ("Normal ve azalan bakiyeli amortisman farkı nedir?", "Normal yöntem eşit pay, azalan bakiyeli yöntem ilk yıllarda yüksek pay ayırır. Dosya iki yöntemi birlikte hesaplar ve karşılaştırır."),
            ("Kıst amortisman nedir?", "Sabit kıymet edinilen veya satılan yılda ay bazında orantılı amortisman ayrılmasıdır. Dosya yıl içindeki dört çeyrek satış senaryosunda kıst hesabı otomatik üretir."),
            ("Satış için en uygun dönem nasıl bulunur?", "Her çeyrekteki satış kârı/zararı, kurumlar vergisi etkisi ve elde edilen net nakit bugünkü değere indirgenir; en yüksek net bugünkü değeri veren dönem önerilir."),
            ("Verilerim yoksa çalışır mı?", "Dosyada örnek veri seti vardır; kendi kıymetlerinizi girerek gerçek senaryonuzu hesaplayabilirsiniz."),
            ("Mevzuat değişirse ne olur?", "Vergi oranı ve amortisman parametreleri AYARLAR sayfasındadır; güncel oranlarla yeniden çalışır."),
            ("Sonuç raporu yöneticiye sunulabilir mi?", "Evet; RAPOR sayfası yazdırılabilir yönetici özeti olarak PDF için uygundur, grafik ve karar kapısıyla birlikte çıktı alınır."),
        ],
        "iliskili": ["yeniden-degerleme-yapmali-miyim-vergi-tasarruf-analizi", "kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici"],
    },
    "doviz-acik-pozisyonu-ve-kur-riski-stres-testi": {
        "ad": "Döviz Açık Pozisyonu ve Kur Riski Stres Testi",
        "kategori": "finansal-analiz",
        "ozet": "Döviz cinsinden varlık ve borçlarınızın net açık pozisyonunu hesaplayın; kur şoku senaryolarında kâr/zarar etkisini ve pozisyon kararını görün.",
        "girdi": ["Dövizli varlıklar (cari, kasa, mevduat)", "Dövizli borçlar (kredi, borç, tedarikçi)", "Kur şoku senaryo oranları"],
        "cikti": ["Net açık pozisyon (USD/EUR bazında)", "Kur şokunda oluşan kur farkı etkisi", "UYGUN/İNCELE/DURDUR pozisyon kararı"],
        "uygun": ["Dövizli alacak/borcu olan işletmeler", "İthalat/ihracat yapan firmalar", "Kur riskini ölçmek isteyen finans yöneticileri"],
        "uygun_degil": ["Döviz işlemi olmayan tamamen TL çalışanlar", "Türev ve hedging işlemlerini yönetenler (portföy yönetimi gerektirir)"],
        "faq": [
            ("Net açık pozisyon nasıl hesaplanır?", "Dövizli varlıklar ile dövizli borçların aynı döviz cinsinde farkı alınır; pozisyon açık veya fazla olarak işaretlenir."),
            ("Kur şokunda etki nasıl hesaplanır?", "Dosya iyimser/baz/kötümser/kritik kur senaryolarını AYARLAR'daki oranlarla kurar ve her senaryoda kur farkı kâr/zararını üretir."),
            ("Karar nasıl üretilir?", "Net pozisyon ve kur şokundaki olası zarar eşiklerle karşılaştırılır; zarar eşiği aşarsa DURDUR, aşmıyorsa İNCELE/UYGUN kararı verilir."),
            ("TCMB kuru hangi tarihten alınır?", "AYARLAR sayfasındaki rapor tarihi ve kur değerleri giriş olarak kullanılır; kullanıcı kendi tarihini girer."),
            ("Risk yönetimi önerisi üretir mi?", "Evet; pozisyon ve senaryo sonucuna göre korunma ve dengeleme aksiyonları önerilir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası yönetici özeti olarak PDF için uygun düzenlenir, pozisyon ve senaryo sonuçları tek sayfada özetlenir."),
        ],
        "iliskili": ["vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi", "aylik-patron-finans-paneli"],
    },
    "kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici": {
        "ad": "KDV İadesi Azami Alacak Hesabı & Dosya Hazırlayıcı",
        "kategori": "muhasebe-ve-vergi",
        "ozet": "Devreden KDV ve ihracat iadesi sınırlarına göre azami KDV iade alacağınızı hesaplayın; iade dosyasını destekleyen belge takibini kurun.",
        "girdi": ["KDV belgeleri (fatura, gider pusulası, ihracat)", "Devreden KDV ve tahakkuk bilgileri", "İade sınırı parametreleri"],
        "cikti": ["Azami KDV iade alacağı tutarı", "İade sınırına göre iade edilebilir tutar", "UYGUN/İNCELE/DURDUR dosya kararı"],
        "uygun": ["İhracat yapan ve KDV iadesi alan firmalar", "Devreden KDV takibi yapan muhasebeciler", "İade dosyası hazırlayan mali müşavirler"],
        "uygun_degil": ["KDV iadesi hakkı olmayan mükellefler", "İndirimli orana tabi iade süreçleri (özel düzenleme gerektirir)"],
        "faq": [
            ("Azami iade alacağı nasıl belirlenir?", "Devreden KDV ile iade hakkı doğuran işlemlerin (ör. ihracat) iade sınırı karşılaştırılır; azami iade alacağı hesaplanır."),
            ("Hangi belgeler gerekiyor?", "İhracat faturaları, gümrük beyannameleri ve satış belgeleri KDV_BELGELERI sayfasına girilir; dosya tutarları otomatik toplar."),
            ("Karar nasıl üretilir?", "Hesaplanan azami iade, belge toplamı ve sınır eşikleriyle karşılaştırılır; eksik belge varsa İNCELE, hata varsa DURDUR kararı verilir."),
            ("Mevzuat dayanağı nedir?", "KDV Kanunu iade hükümleri çerçevesinde parametreler AYARLAR sayfasındadır; güncel oranlarla çalışır."),
            ("Beyanname yerine geçer mi?", "Hayır. Dosya iade hesabı ve dosya hazırlığını destekler; beyanname mali müşavir tarafından verilir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası yazdırılabilir yönetici özeti olarak düzenlenir ve PDF için uygun çıktı verir."),
        ],
        "iliskili": ["kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti", "vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi"],
    },
    "kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti": {
        "ad": "KKEG ve Finansman Gider Kısıtlaması Vergi Savunma Seti",
        "kategori": "muhasebe-ve-vergi",
        "ozet": "Yabancı kaynak/öz kaynak farkını ve finansman giderlerinin kısıtlama kapsamını hesaplayın; KKEG tutarı, kurumlar vergisi etkisi ve savunma aksiyonunu üretin.",
        "girdi": ["Dönem bilançosu (yabancı ve öz kaynak)", "Finansman giderleri (faiz, kur farkı, komisyon)", "Kısıtlama oranı parametreleri"],
        "cikti": ["Yabancı kaynak/öz kaynak farkı", "Kısıtlamaya tabi finansman gideri ve KKEG tutarı", "Kurumlar vergisi etkisi ve savunma aksiyonu"],
        "uygun": ["Yabancı kaynak kullanan işletmeler", "KKEG riskini ölçmek isteyen vergi mükellefleri", "Denetim savunması hazırlayan mali müşavirler"],
        "uygun_degil": ["Öz kaynağıyla tamamen finanse edilen işletmeler", "Yatırım teşviki kapsamındaki özel istisnalar"],
        "faq": [
            ("Kısıtlama kapsamı nasıl belirlenir?", "Yabancı kaynakların öz kaynakları aşan kısmı hesaplanır; aşan kısmın finansman giderleri kısıtlama kapsamına girer."),
            ("KKEG tutarı neyi ifade eder?", "Vergi kanunlarına göre kanunen kabul edilmeyen gider tutarıdır; kurumlar vergisi matrahına eklenir."),
            ("Vergi etkisi nasıl hesaplanır?", "KKEG tutarı güncel kurumlar vergisi oranıyla çarpılarak ek vergi yükü bulunur."),
            ("Savunma aksiyonu nedir?", "Karar kapısı, kısıtlama riskine göre belge toplama, hesaplama düzeltme ve beyan savunması aksiyonlarını önerir."),
            ("Mevzuat dayanağı nedir?", "Kurumlar Vergisi Kanunu'nun finansman gider kısıtlaması hükümleri AYARLAR'daki parametrelerle yansıtılır."),
            ("Denetimde sunulabilir mi?", "Evet; KARAR ve RAPOR sayfaları gerekçe ve aksiyonlarla denetim sunumuna uygun yönetici çıktısı üretir."),
        ],
        "iliskili": ["kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici", "vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi"],
    },
    "mutfak-kayip-kacak-hesaplayici": {
        "ad": "Mutfak Kayıp/Kaçak Tespiti & Menü Kârlılık Analizi",
        "kategori": "stok-ve-uretim",
        "ozet": "Reçete bazlı teorik hammadde tüketimini fiili stok tüketimiyle karşılaştırın; mutfaktaki kayıp ve kaçağı tutar ve oran olarak tespit edin.",
        "girdi": ["Ürün reçeteleri (hammadde, miktar)", "Dönem başı/alış/dönem sonu stokları", "Satış adetleri ve birim maliyetler"],
        "cikti": ["Teorik ve fiili tüketim farkı", "Hammadde bazında kayıp tutarı ve oranı", "KONTROL ALTINDA/İNCELE/KRİTİK KAYIP kararı"],
        "uygun": ["Restoran, kafe ve otel mutfakları", "Hammadde kaybını ölçmek isteyen gıda işletmeleri", "Stok mutabakatı yapan operasyon yöneticileri"],
        "uygun_degil": ["Reçete bilgisi olmayan işletmeler", "Paketli gıda üreticileri (üretim fire reçetesi farklıdır)"],
        "faq": [
            ("Teorik tüketim nasıl bulunur?", "Her ürünün satış adedi, reçetesindeki hammadde miktarıyla çarpılır; tüm ürünler toplanarak teorik tüketim üretilir."),
            ("Fiili tüketim nasıl bulunur?", "Dönem başı stok + alışlar − dönem sonu stok formülüyle fiili tüketim hesaplanır."),
            ("Kayıp oranı ne anlama gelir?", "Fiili tüketim eksi teorik tüketimin fiili tüketime bölümüdür; eşiklerin üzeri inceleme/kritik işareti alır."),
            ("Karar nasıl üretilir?", "Toplam kayıp oranı AYARLAR'daki eşiklerle karşılaştırılır; kayıp yoğunlaşması ve senaryo analizi karar gerekçesine eklenir."),
            ("Hammadde bazında takip yapabilir miyim?", "Evet; dosya hammadde bazında kayıp tutarı ve oranı listesi üretir, en yüksek kayıp kalemini işaretler."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası kayıp yoğunlaşması ve kararla birlikte yazdırılabilir yönetici özeti sunar."),
        ],
        "iliskili": ["uretim-recetesi-ve-zam-yansitma-hesaplayici", "stok-satis-ve-nakit-baglanma-sistemi"],
    },
    "nakliye-maliyeti-hesaplayici": {
        "ad": "Sefer Başına Nakliye Maliyeti & Fiyatlandırma Cetveli",
        "kategori": "satis-ve-fiyatlama",
        "ozet": "Araç filosu ve sefer kayıtlarından yakıt, bakım, sürücü ve amortisman maliyetlerini sefer bazında hesaplayın; km ve ton-km başına birim maliyeti görün.",
        "girdi": ["Araç listesi (yakıt, bakım, amortisman)", "Sefer kayıtları (km, ton, gelir)", "Maliyet parametreleri (yakıt fiyatı, tüketim)"],
        "cikti": ["Sefer bazında toplam maliyet ve net kâr", "Km ve ton-km başına birim maliyet", "KARLI/İNCELE/ZARARLI kararı ve aksiyonlar"],
        "uygun": ["Kendi filosu olan nakliye firmaları", "Sefer maliyetini ölçmek isteyen lojistik şirketleri", "Araç kiralama ve nakliye hizmeti verenler"],
        "uygun_degil": ["Tek araçlık tek seferlik maliyet hesabı (basit hesap yeterli)", "Kurumsal filo yönetim yazılımı kullananlar"],
        "faq": [
            ("Birim maliyet nasıl hesaplanır?", "Sefer toplam maliyeti kat edilen km ve taşınan tonla bölünerek km ve ton-km başına maliyet üretilir."),
            ("Yakıt maliyeti nasıl bulunur?", "Aracın km başına tüketimi güncel yakıt fiyatıyla çarpılır; AYARLAR'daki parametrelerle çalışır."),
            ("Amortisman dahil mi?", "Evet; araç edinim bedeli ve ekonomik ömürden aylık amortisman hesaplanıp sefer maliyetine dağıtılır."),
            ("Karar nasıl üretilir?", "Sefer kâr marjı eşiklerle karşılaştırılır; zararlı seferler, yakıt ve bakım yoğunlaşması aksiyon önerisine dönüştürülür."),
            ("Çok araçlı mı?", "Evet; filo araç listesi ve seferler tek dosyada toplanır, araç bazında kârlılık karşılaştırılır."),
            ("Filo karşılaştırma raporu üretir mi?", "Evet; RAPOR sayfası araç bazında kârlılık ve birim maliyetleri yönetici özeti olarak çıktı verir."),
        ],
        "iliskili": ["gunluk-gelir-gider-ve-gercek-karlilik-sistemi", "proje-ve-is-bazinda-gercek-karlilik-sistemi"],
    },
    "ortaklar-cari-ve-kasa-adat-faiz-faturasi-hesaplayici": {
        "ad": "Ortaklar Cari & Kasa Adat Faiz Faturası Hesaplayıcı",
        "kategori": "muhasebe-ve-vergi",
        "ozet": "Ortak cari bakiyeleri ve kasa adatları üzerinden dönem faizini hesaplayın; fatura tutarını mevzuata uygun şekilde üretin.",
        "girdi": ["Ortak cari hareketleri (borç/alacak)", "Kasa adat dönemleri ve bakiyeler", "Faiz oranı ve vade parametreleri"],
        "cikti": ["Ortak cari ve kasa adat faizi", "Fatura tutarı ve KDV etkisi", "UYGUN/İNCELE/DURDUR kararı"],
        "uygun": ["Ortaklarına borç veren/alan şirketler", "Kasadaki ortak paralarını düzenleyen işletmeler", "Adat faizi faturası kesen muhasebeciler"],
        "uygun_degil": ["Transfer fiyatlandırması süreçleri (özel belgeleme gerektirir)", "Banka kredisi dışı finansal araçlar"],
        "faq": [
            ("Adat faizi nasıl hesaplanır?", "Cari bakiyenin gün bazında taşındığı süre ve günlük faiz oranı çarpılarak adat faizi üretilir."),
            ("Fatura tutarı ne olur?", "Hesaplanan faiz tutarı KDV oranıyla büyütülerek faturaya esas tutar bulunur."),
            ("Karar nasıl üretilir?", "Faiz tutarı ve dönem uygunluğu eşiklerle karşılaştırılır; eksik belge veya dönem hatası İNCELE/DURDUR işareti alır."),
            ("Mevzuat dayanağı nedir?", "VUK'nın adat faizi düzenlemeleri çerçevesinde oran ve süre parametreleri AYARLAR sayfasındadır."),
            ("Çok ortağım var, çalışır mı?", "Evet; her ortak için ayrı cari takip ve adat hesabı dosyada desteklenir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası ortak bazında faiz ve fatura özetini PDF için uygun yönetici çıktısı olarak sunar."),
        ],
        "iliskili": ["vergi-sgk-ve-maas-karsilik-ayirma-sistemi", "kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici"],
    },
    "pazaryeri-net-kar-ve-eksik-hakedis-yakalayici": {
        "ad": "Pazaryeri Net Kâr & Eksik Hakediş Yakalayıcı",
        "kategori": "satis-ve-fiyatlama",
        "ozet": "Komisyon, kargo, reklam ve iade sonrası net kârı hesaplayın; beklenen ile gerçek hakedişi karşılaştırıp eksik tahsilatı yakalayın.",
        "girdi": ["Kalem listesi (satış fiyatı, maliyet)", "Pazaryeri giderleri (komisyon, kargo, reklam)", "Gerçekleşen hakediş tutarları"],
        "cikti": ["Kalem bazında net kâr ve kâr marjı", "Beklenen vs gerçek hakediş farkı", "GÜÇLÜ/NORMAL/İNCELE kararı"],
        "uygun": ["Trendyol, Hepsiburada, Amazon'da satanlar", "Pazaryeri komisyon ve giderlerini ölçmek isteyenler", "Eksik hakediş tahsilatını yakalamak isteyen e-ticaret firmaları"],
        "uygun_degil": ["Kendi mağazasında satanlar (pazaryeri komisyonu yok)", "Kurumsal e-ticaret yazılımı kullananlar"],
        "faq": [
            ("Net kâr nasıl hesaplanır?", "Satış tutarından maliyet, komisyon, kargo, reklam ve iade giderleri düşülür; kalem bazında net kâr ve marj üretilir."),
            ("Eksik hakediş nasıl yakalanır?", "Kalem bazında beklenen hakediş ile pazaryerinden gelen gerçek hakediş karşılaştırılır; fark eşik üzerindeyse kalem işaretlenir."),
            ("Karar nasıl üretilir?", "Satış hacmi, net marj ve eksik hakediş oranı birlikte değerlendirilir; GÜÇLÜ/NORMAL/İNCELE kararı verilir."),
            ("Reklam giderleri dahil mi?", "Evet; reklam ve kampanya giderleri kalem bazında dağıtılarak gerçek kârlılık gösterilir."),
            ("Yoğunlaşma analizi ne işe yarar?", "Satış ve kârın hangi pazaryeri/kalemde yoğunlaştığını gösterir; tek kanal bağımlılığı riskini işaretler."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası kalem bazında net kâr ve eksik hakedişi yönetici özeti olarak PDF için uygun çıktı verir."),
        ],
        "iliskili": ["gunluk-gelir-gider-ve-gercek-karlilik-sistemi", "aylik-patron-finans-paneli"],
    },
    "sirket-oz-kaynagi-eridi-mi-ttk-376-sermaye-tamamlama-cetveli": {
        "ad": "Şirket Öz Kaynağı Eridi Mi? (TTK 376 Sermaye Tamamlama Cetveli)",
        "kategori": "finansal-analiz",
        "ozet": "Bilanço bileşenlerinden öz kaynağı ve sermaye kaybını hesaplayın; TTK 376'daki 1/3 ve 2/3 eşikleriyle borca batıklığı izleyin.",
        "girdi": ["Dönem bilançosu (varlıklar, borçlar, öz kaynak)", "Sermaye ve yedekler", "TTK 376 eşik parametreleri"],
        "cikti": ["Öz kaynak ve sermaye kaybı tutarı", "TTK 376 1/3, 2/3 ve borca batıklık durumu", "UYGUN/İNCELE/DURDUR kararı"],
        "uygun": ["Sermaye kaybı riski yaşayan şirketler", "TTK 376 yükümlülüğünü değerlendiren yönetim kurulları", "Genel kurul bilgilendirmesi hazırlayan mali müşavirler"],
        "uygun_degil": ["Sermaye yapısı sağlam şirketler", "Halka açık şirketler (SPK düzenlemeleri geçerlidir)"],
        "faq": [
            ("Sermaye kaybı nasıl hesaplanır?", "Toplam öz kaynak, çıkarılmış sermayeyle karşılaştırılır; kayıp tutarı ve oranı bulunur."),
            ("TTK 376 eşikleri nedir?", "Öz kaynağın sermayenin 2/3'ünün altına düşmesi genel kurul çağrısı, 1/2'nin altı veya borca batıklık ise daha sıkı yükümlülük doğurur; dosya eşikleri AYARLAR'dan izler."),
            ("Borca batıklık nasıl belirlenir?", "Öz kaynağın negatife dönmesi veya varlıkların borçları karşılayamaması durumu tespit edilir."),
            ("Karar nasıl üretilir?", "Kayıp oranı eşiklerle karşılaştırılır; 1/3 aşıldıysa İNCELE, 2/3 aşıldıysa veya borca batıksa DURDUR kararı verilir."),
            ("Yasal yükümlülük bildirimi midir?", "Hayır. Dosya hesaplamayı gösterir; genel kurul kararı ve kayıt düzeltmeleri için profesyonel danışmanlık gerekir."),
            ("Yönetim kurulu sunumu üretir mi?", "Evet; RAPOR sayfası sermaye kaybı ve TTK 376 durumunu yönetici sunumuna uygun özetler."),
        ],
        "iliskili": ["vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi", "vergi-sgk-ve-maas-karsilik-ayirma-sistemi"],
    },
    "sube-karlilik-ve-nakit-hesaplayici": {
        "ad": "Bu Şubeyi Kapatmalı Mıyım? (Şube Kârlılık & Nakit Yakış Analizi)",
        "kategori": "finansal-analiz",
        "ozet": "Şube bazında gelir, gider ve nakit akışını toplayın; şube kârlılığını, kâr marjını ve nakit pozisyonunu hesaplayıp şube kararını gerekçesiyle üretin.",
        "girdi": ["Şube listesi (açılış nakit, hedef marj)", "Gelir/gider kayıtları (tarih, şube, kalem, tür)", "Tahsilat/ödeme kayıtları"],
        "cikti": ["Şube bazında net kâr ve kâr marjı", "Dönem nakit akışı ve nakit pozisyonu", "KARLI/İNCELE/ZARARLI kararı ve aksiyonlar"],
        "uygun": ["Birden çok şubesi olan perakende/hizmet firmaları", "Şube kârlılığını karşılaştıran yöneticiler", "Nakit pozisyonunu şube bazında izleyen finans ekipleri"],
        "uygun_degil": ["Tek iş yeri (şube karşılaştırması gerekmez)", "Kurumsal muhasebe sisteminde şube raporu olanlar"],
        "faq": [
            ("Şube kârlılığı nasıl hesaplanır?", "Şube bazında gelir ve gider kayıtları toplanır; net kâr ve kâr marjı formülle üretilir."),
            ("Nakit pozisyonu nasıl bulunur?", "Açılış nakitine tahsilatlar eklenir, ödemeler çıkarılır; dönem sonu pozisyonu ve açık fazlası gösterilir."),
            ("Karar nasıl üretilir?", "Kâr marjı hedef marjla karşılaştırılır; negatif marjda ZARARLI, hedef altında İNCELE, üzerinde KARLI kararı gerekçesiyle üretilir."),
            ("Gelecek nakit tahmini var mı?", "Evet; ciro senaryo bandı ve zaman serisi projeksiyonu ile gelecek dönem nakit tahmini ve güven aralığı üretilir."),
            ("Kalem ve şube listesi düzenlenebilir mi?", "Evet; LISTELER sayfasına yeni şube ve gider/gelir kalemleri eklenebilir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası şube bazında kârlılık ve nakit özetini PDF için uygun yönetici çıktısı olarak sunar."),
        ],
        "iliskili": ["aylik-patron-finans-paneli", "gunluk-gelir-gider-ve-gercek-karlilik-sistemi"],
    },
    "uretim-recetesi-ve-zam-yansitma-hesaplayici": {
        "ad": "Üretim Reçetesi & Zam Yansıtma Hesaplayıcı",
        "kategori": "stok-ve-uretim",
        "ozet": "Reçetedeki hammadde miktar, birim fiyat, fire ve zam oranlarıyla eski/yeni reçete maliyetini üretin; hedef kâr marjını koruyan satış fiyatını hesaplayın.",
        "girdi": ["Ürün reçeteleri (hammadde, miktar, fire)", "Zam oranları (hammadde bazında)", "Hedef kâr marjı"],
        "cikti": ["Eski ve yeni reçete maliyeti", "Ürün bazında maliyet artışı", "ZAM YANSIT/KISMİ YANSIT/FİYATI KORU kararı"],
        "uygun": ["Gıda, imalat ve üretim işletmeleri", "Hammadde zamlarını fiyata yansıtmak isteyenler", "Reçete maliyetini ürün bazında izleyen üretim yöneticileri"],
        "uygun_degil": ["Reçetesi olmayan hizmet işletmeleri", "Kurumsal ERP reçete modülü kullananlar"],
        "faq": [
            ("Reçete maliyeti nasıl hesaplanır?", "Her hammaddenin miktarı birim fiyat ve fire oranıyla çarpılır; toplam ürün maliyeti bulunur."),
            ("Zam etkisi nasıl yansır?", "Hammadde bazında zam oranı uygulanarak yeni reçete maliyeti üretilir; maliyet artışı ürün bazında gösterilir."),
            ("Karar nasıl üretilir?", "Maliyet artışı genel eşiklerle karşılaştırılır; artış hedef marjı aşındırıyorsa ZAM YANSIT, sınırda ise KISMİ YANSIT, ihmal edilebilirse FİYATI KORU kararı verilir."),
            ("Hedef marj nasıl korunur?", "Yeni maliyet üzerinden hedef marjı sağlayan önerilen satış fiyatı hesaplanır ve mevcut fiyatla karşılaştırılır."),
            ("Fire oranı nedir?", "Üretim sırasında kaybolan/yitirilen hammadde payıdır; maliyet hesabına dahil edilir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası ürün bazında maliyet artışı ve önerilen fiyatı yönetici özeti olarak çıktı verir."),
        ],
        "iliskili": ["mutfak-kayip-kacak-hesaplayici", "asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli"],
    },
    "vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi": {
        "ad": "Vergi/SGK Borcunu Tecil Etmeli Miyim? (Kredi mi Tecil mi?)",
        "kategori": "butce-ve-planlama",
        "ozet": "Borç aslı ve gecikme zammını toplayın; tecil, kredi ve peşin ödeme seçeneklerinin maliyetini bugünkü değerle karşılaştırıp en uygun yolu önerin.",
        "girdi": ["Borç listesi (asıl, gecikme zammı, vade)", "Tecil taksit parametreleri", "Kredi faiz oranı ve onay durumu"],
        "cikti": ["Toplam borç ve seçenek maliyetleri", "Seçeneklerin bugünkü değer (NBD) karşılaştırması", "En düşük maliyetli yol kararı ve gerekçe"],
        "uygun": ["Vergi ve SGK borcu olan işletmeler", "Tecil veya kredi kararı veren finans yöneticileri", "Borç yapılandırmasını değerlendirenler"],
        "uygun_degil": ["Yapılandırma kanunları kapsamındaki indirimli ödemeler (özel düzenleme)", "İcra takibine düşmüş borçlar"],
        "faq": [
            ("Tecil maliyeti nasıl hesaplanır?", "Borç aslına gecikme zammı eklenir; tecil taksit sayısı ve dönem faizi üzerinden toplam ödeme tutarı bulunur."),
            ("Krediyle nasıl karşılaştırılır?", "Kredi anapara+faiz ödemeleri aynı döneme yayılır; iki seçeneğin bugünkü değeri iskonto edilerek karşılaştırılır."),
            ("Karar nasıl üretilir?", "Kredi onayı varsa en düşük bugünkü değerli seçenek; onay yoksa tecil ile peşin ödeme arasında karar verilir."),
            ("Mevzuat dayanağı nedir?", "6183 sayılı Kanun'un 48. maddesindeki tecil düzenlemesi parametreleri AYARLAR sayfasındadır."),
            ("Kredi faizi nereden alınır?", "Güncel kredi faiz oranı kullanıcı tarafından AYARLAR sayfasına girilir."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası seçenek karşılaştırmasını ve önerilen yolu PDF için uygun yönetici özeti olarak sunar."),
        ],
        "iliskili": ["vergi-sgk-ve-maas-karsilik-ayirma-sistemi", "sirket-oz-kaynagi-eridi-mi-ttk-376-sermaye-tamamlama-cetveli"],
    },
    "yeniden-degerleme-yapmali-miyim-vergi-tasarruf-analizi": {
        "ad": "Yeniden Değerleme Yapmalı Mıyım? (Vergi Tasarruf Analizi)",
        "kategori": "muhasebe-ve-vergi",
        "ozet": "Kıymet bazında yeniden değerleme katsayısı, değer artışı ve %2 fon vergisi ile ek amortismanın vergi tasarrufunu karşılaştırın; net fayda kararı üretin.",
        "girdi": ["Kıymet listesi (edinim tarihi, maliyet, ömür)", "Yeniden değerleme oranı ve fon vergisi", "Kurumlar vergisi oranı"],
        "cikti": ["Yeniden değerleme katsayısı ve değer artışı", "Fon vergisi ve ek amortisman", "Net vergi tasarrufu ve UYGUN/İNCELE/DURDUR kararı"],
        "uygun": ["Taşınmaz ve makine sahibi işletmeler", "Vergi tasarrufu analizi yapan mali müşavirler", "Enflasyon düzeltmesi ve değerleme kararı alanlar"],
        "uygun_degil": ["Hizmet şirketleri (kıymet stoğu yoksa)", "Enflasyon düzeltmesi uygulanan mükellefler (özel düzenleme)"],
        "faq": [
            ("Yeniden değerleme katsayısı nasıl hesaplanır?", "Kıymetin edinim tarihinden rapor tarihine geçen süre ve ilgili endeks/katsayı kullanılarak değer artışı üretilir."),
            ("Fon vergisi nedir?", "Değer artışı tutarı üzerinden hesaplanan %2 oranındaki vergidir; dosya bu tutarı otomatik hesaplar."),
            ("Vergi tasarrufu nasıl oluşur?", "Değerlenen kıymet üzerinden kalan ömür boyunca ek amortisman ayrılır; ek amortismanın vergi etkisi tasarruf olarak hesaplanır."),
            ("Karar nasıl üretilir?", "Net fayda (tasarruf − fon vergisi) pozitifse UYGUN, sıfıra yakınsa İNCELE, negatifse DURDUR kararı verilir."),
            ("Mevzuat dayanağı nedir?", "VUK'nın yeniden değerleme düzenlemeleri kapsamında katsayı ve oran parametreleri AYARLAR sayfasındadır."),
            ("Rapor çıktısı alabilir miyim?", "Evet; RAPOR sayfası kıymet bazında tasarruf ve kararı yönetici özeti olarak PDF için uygun çıktı verir."),
        ],
        "iliskili": ["amortisman-ve-sabit-kiymet-satis-zamanlama-stratejisti", "kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti"],
    },
}


def metadata(slug):
    """delivery/paid-products/<slug>/current.xlsx gerçek dosyasından metadata okur."""
    import zipfile
    import re
    dosya = os.path.join(TESLIM, slug, "current.xlsx")
    with zipfile.ZipFile(dosya) as z:
        wb = z.read("xl/workbook.xml").decode("utf-8")
    sayfalar = re.findall(r'<sheet name="([^"]+)"', wb)
    boyut = os.path.getsize(dosya) / 1024 / 1024
    return {
        "sayfa_adlari": sayfalar,
        "sheetCount": len(sayfalar),
        "sizeMB": round(boyut, 2),
        "fileFormat": "xlsx",
        "hasMacros": False,
    }


def sayfa_amaci(ad, slug):
    """Sayfa adına göre purpose ve kind üretir."""
    amaclar = {
        "KAPAK": ("Ürün kapak sayfası ve dosya kimliği", "output"),
        "HIZLI_BASLANGIC": ("Hızlı başlangıç rehberi", "output"),
        "HESAP": ("Tüm ara hesap adımları ve motor katmanı", "calculation"),
        "ANALITIK_MOTOR": ("Analitik modüller (anomali, yoğunlaşma, tahmin, duyarlılık)", "calculation"),
        "KONTROLLER": ("Girdi tutarlılık ve veri kalitesi kontrolleri", "calculation"),
        "KARAR": ("Karar kapısı, gerekçe ve aksiyon önerileri", "calculation"),
        "PANO": ("Canlı KPI ve yönetici panosu", "output"),
        "SENARYO_DUYARLILIK": ("Senaryo ve duyarlılık (tornado) analizi", "calculation"),
        "RAPOR": ("Yazdırılabilir yönetici raporu", "output"),
        "ORNEK_VERI": ("Örnek veri seti", "input"),
        "DEGISIKLIK_KAYDI": ("Sürüm değişiklik kaydı", "output"),
        "LISTELER": ("Veri doğrulama listeleri", "input"),
        "AYARLAR": ("Parametre ve eşik ayarları", "input"),
        "KILAVUZ": ("Kullanım kılavuzu", "output"),
    }
    ozel = {
        "amortisman-ve-sabit-kiymet-satis-zamanlama-stratejisti": {
            "KIYMET_LISTESI": ("Sabit kıymet listesi ve satış senaryoları girişi", "input"),
        },
        "doviz-acik-pozisyonu-ve-kur-riski-stres-testi": {
            "DOVIZ_POZISYONLARI": ("Dövizli varlık ve borç pozisyonları girişi", "input"),
        },
        "kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici": {
            "KDV_BELGELERI": ("KDV belgeleri ve iade sınırı girişi", "input"),
        },
        "kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti": {
            "DONEM_KAYNAK": ("Dönem yabancı/öz kaynak girişi", "input"),
            "KREDI_LISTESI": ("Finansman gideri ve kredi kayıtları girişi", "input"),
        },
        "mutfak-kayip-kacak-hesaplayici": {
            "URUN_LISTESI": ("Ürün listesi girişi", "input"),
            "RECETE": ("Ürün reçeteleri girişi", "input"),
            "STOK": ("Dönem başı/alış/dönem sonu stok girişi", "input"),
        },
        "nakliye-maliyeti-hesaplayici": {
            "ARAC_LISTESI": ("Araç listesi ve maliyet parametreleri girişi", "input"),
            "SEFERLER": ("Sefer kayıtları girişi", "input"),
        },
        "ortaklar-cari-ve-kasa-adat-faiz-faturasi-hesaplayici": {
            "ORTAK_CARI": ("Ortak cari hareketleri girişi", "input"),
            "KASA_ADAT": ("Kasa adat dönemleri girişi", "input"),
        },
        "pazaryeri-net-kar-ve-eksik-hakedis-yakalayici": {
            "KALEM_LISTESI": ("Kalem satış ve gider girişi", "input"),
        },
        "sirket-oz-kaynagi-eridi-mi-ttk-376-sermaye-tamamlama-cetveli": {
            "DONEM_BILANCO": ("Dönem bilanço bileşenleri girişi", "input"),
            "BORC_LISTESI": ("Borç ve sermaye kalemleri girişi", "input"),
        },
        "sube-karlilik-ve-nakit-hesaplayici": {
            "SUBE_LISTESI": ("Şube listesi ve hedef marj girişi", "input"),
            "GELIR_GIDER": ("Gelir ve gider kayıtları girişi", "input"),
            "NAKIT_AKISI": ("Tahsilat ve ödeme kayıtları girişi", "input"),
        },
        "uretim-recetesi-ve-zam-yansitma-hesaplayici": {
            "RECETE_LISTESI": ("Ürün reçeteleri ve zam oranları girişi", "input"),
        },
        "vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi": {
            "BORC_LISTESI": ("Vergi/SGK borç listesi girişi", "input"),
        },
        "yeniden-degerleme-yapmali-miyim-vergi-tasarruf-analizi": {
            "KIYMET_LISTESI": ("Kıymet listesi ve değerleme girişi", "input"),
        },
    }
    ozel_map = ozel.get(slug, {})
    if ad in ozel_map:
        return ozel_map[ad]
    if ad in amaclar:
        return amaclar[ad]
    return (f"{ad} sayfası", "input")


def yaml_deger(s):
    """YAML tek tırnaklı scalar için apostrof kaçışı ('' çiftlenir)."""
    return s.replace("'", "''")


def mdx_uret(slug, bilgi, meta):
    satirlar = []
    satirlar.append("---")
    satirlar.append(f"name: '{yaml_deger(bilgi['ad'])}'")
    satirlar.append(f"summary: '{yaml_deger(bilgi['ozet'])}'")
    satirlar.append(f"category: '{yaml_deger(bilgi['kategori'])}'")
    fiyat = {"PRO": 990, "PREMIUM": 1490, "ENTERPRISE": 2490, "EXCLUSIVE": 7900}
    import json as _json
    katalog = _json.load(open(os.path.join(KOK, "commerce/catalog.json")))
    tier = katalog["products"][slug]["tier"]
    satirlar.append(f"priceTL: {fiyat[tier]}")
    satirlar.append("vatIncluded: true")
    satirlar.append(f"fileFormat: {meta['fileFormat']}")
    satirlar.append(f"sizeMB: {meta['sizeMB']}")
    satirlar.append(f"sheetCount: {meta['sheetCount']}")
    satirlar.append(f"hasMacros: {str(meta['hasMacros']).lower()}")
    satirlar.append("minExcelVersion: 'Excel 2016 ve üzeri'")
    satirlar.append("macCompatible: true")
    satirlar.append("sheetsCompatibility: full")
    satirlar.append("version: '1.0.0'")
    satirlar.append("updatedAt: '2026-08-10'")
    satirlar.append("sheetMap: ")
    for ad in meta["sayfa_adlari"]:
        amac, kind = sayfa_amaci(ad, slug)
        satirlar.append(f"  - name: '{yaml_deger(ad)}'")
        satirlar.append(f"    purpose: '{yaml_deger(amac)}'")
        satirlar.append(f"    kind: '{yaml_deger(kind)}'")
    satirlar.append("inputs: ")
    for g in bilgi["girdi"]:
        satirlar.append(f"  - '{yaml_deger(g)}'")
    satirlar.append("outputs: ")
    for c in bilgi["cikti"]:
        satirlar.append(f"  - '{yaml_deger(c)}'")
    satirlar.append("suitableFor: ")
    for s in bilgi["uygun"]:
        satirlar.append(f"  - '{yaml_deger(s)}'")
    satirlar.append("notSuitableFor: ")
    for s in bilgi["uygun_degil"]:
        satirlar.append(f"  - '{yaml_deger(s)}'")
    satirlar.append("requirements: ")
    satirlar.append("  - 'Excel 2016 veya üzeri'")
    satirlar.append("updatePolicy: 'Yapı değişmediği sürece güncel sürüm aynıdır; mevzuat veya Excel davranışı değişirse güncel sürüm satın alma döneminden itibaren 12 ay ücretsiz sunulur.'")
    satirlar.append("faq: ")
    for soru, cevap in bilgi["faq"]:
        satirlar.append(f"  - question: '{yaml_deger(soru)}'")
        satirlar.append(f"    answer: '{yaml_deger(cevap)}'")
    # ekran görüntüleri: giriş sayfası, KARAR, PANO
    giris_sayfasi = [ad for ad in meta["sayfa_adlari"] if ad not in
                     {"KAPAK", "HIZLI_BASLANGIC", "HESAP", "ANALITIK_MOTOR", "KONTROLLER",
                      "KARAR", "PANO", "SENARYO_DUYARLILIK", "RAPOR", "ORNEK_VERI",
                      "DEGISIKLIK_KAYDI", "LISTELER", "AYARLAR", "KILAVUZ"}][0]
    ad_gorunur = bilgi["ad"].replace("'", "")
    satirlar.append("screenshots: ")
    giris_amac = sayfa_amaci(giris_sayfasi, slug)[0]
    satirlar.append(f"  - src: '/screenshots/{slug}-1.png'")
    satirlar.append(f"    alt: '{yaml_deger(ad_gorunur)} dosyasının {yaml_deger(giris_sayfasi)} sayfası — {yaml_deger(giris_amac)}'")
    satirlar.append(f"  - src: '/screenshots/{slug}-2.png'")
    satirlar.append(f"    alt: '{yaml_deger(ad_gorunur)} dosyasının KARAR sayfası — Karar kapısı, gerekçe ve aksiyonlar'")
    satirlar.append(f"  - src: '/screenshots/{slug}-3.png'")
    satirlar.append(f"    alt: '{yaml_deger(ad_gorunur)} dosyasının PANO sayfası — Canlı KPI ve yönetici panosu'")
    satirlar.append("related: ")
    for r in bilgi["iliskili"]:
        satirlar.append(f"  - '{yaml_deger(r)}'")
    satirlar.append("---")
    satirlar.append("")
    satirlar.append("Satın almadan önce demo dosyasıyla inceleyin. Ödeme Shopier altyapısıyla güvenli şekilde işlenir, teslimat e-posta ile yapılır.")
    satirlar.append("")
    return "\n".join(satirlar)


def main():
    os.makedirs(MDX_KONUM, exist_ok=True)
    for slug, bilgi in URUNLER.items():
        meta = metadata(slug)
        icerik = mdx_uret(slug, bilgi, meta)
        yol = os.path.join(MDX_KONUM, f"{slug}.mdx")
        with open(yol, "w", encoding="utf-8") as f:
            f.write(icerik)
        print(f"yazıldı: {slug}.mdx ({meta['sheetCount']} sayfa, {meta['sizeMB']} MB)")


if __name__ == "__main__":
    main()
