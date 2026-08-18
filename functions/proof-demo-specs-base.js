'use strict';

/**
 * Proof Demo sözleşmeleri.
 * Bu dosya yalnızca demo değerini göstermek için kullanılan basitleştirilmiş hesapları içerir.
 * Premium MOTOR / AYARLAR / eşik seti / analitik formüller burada bulunmaz.
 */

const SPECS = Object.freeze({
  "13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi": {
    "karar": "Hangi haftada nakit açığı oluşacağını ve ne kadar önlem gerektiğini gösterir.",
    "girisBasliklari": [
      "Hafta",
      "Açılış (₺)",
      "Gelen (₺)",
      "Giden (₺)",
      "Kapanış (₺)"
    ],
    "ornek": [
      [
        "Hafta 1",
        25000,
        42000,
        38500,
        "=B6+C6-D6"
      ],
      [
        "Hafta 2",
        "=E6",
        38000,
        51000,
        "=B7+C7-D7"
      ],
      [
        "Hafta 3",
        "=E7",
        45000,
        36000,
        "=B8+C8-D8"
      ],
      [
        "Hafta 4",
        "=E8",
        30000,
        44000,
        "=B9+C9-D9"
      ],
      [
        "Hafta 5",
        "=E9",
        52000,
        39000,
        "=B10+C10-D10"
      ],
      [
        "Hafta 6",
        "=E10",
        34000,
        47000,
        "=B11+C11-D11"
      ]
    ],
    "metrikler": [
      [
        "En düşük kapanış",
        "=MIN(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Negatif hafta sayısı",
        "=COUNTIF(DEMO_GIRIS!E6:E25,\"<0\")",
        "sayi"
      ],
      [
        "Dönem net nakit",
        "=SUM(DEMO_GIRIS!C6:C25)-SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Gerekli asgari önlem",
        "=MAX(0,-B6)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B7>0,\"DURDUR\",IF(B6<10000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Negatif haftanın ödemelerini önceki haftalara yay.",
      "Tahsilatı öne çekebileceğin müşterileri ayır.",
      "Tam sürümde 13 hafta, senaryo, duyarlılık ve aksiyon motoru birlikte çalışır."
    ]
  },
  "akilli-kasa-defteri-ve-nakit-kontrol-sistemi": {
    "karar": "Kasadaki kullanılabilir para, açık riski ve ödeme baskısını gösterir.",
    "girisBasliklari": [
      "Tarih",
      "Açıklama",
      "Gelir (₺)",
      "Gider (₺)",
      "Yakın ödeme (₺)"
    ],
    "ornek": [
      [
        "01.08.2026",
        "Günlük satış",
        18500,
        0,
        0
      ],
      [
        "02.08.2026",
        "Tedarikçi ödemesi",
        0,
        7200,
        0
      ],
      [
        "03.08.2026",
        "Müşteri tahsilatı",
        9600,
        0,
        0
      ],
      [
        "04.08.2026",
        "Kira",
        0,
        5200,
        0
      ],
      [
        "05.08.2026",
        "Yaklaşan vergi",
        0,
        0,
        12000
      ]
    ],
    "metrikler": [
      [
        "Toplam gelir",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam gider",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Yakın ödeme",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Kullanılabilir nakit",
        "=B6-B7-B8",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9<0,\"DURDUR\",IF(B9<5000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Negatif kullanılabilir nakitte yeni ödeme taahhüdü verme.",
      "Yakın ödemeleri tahsilat tarihleriyle eşleştir.",
      "Tam sürümde kasa farkı, anomali ve ödeme önerisi birlikte çalışır."
    ]
  },
  "amortisman-2026-yeniden-degerleme": {
    "karar": "Amortisman tutarı ile 298/Ç ve Geç.32 yeniden değerleme kararını birlikte gösterir.",
    "girisBasliklari": [
      "Kıymet",
      "Maliyet (₺)",
      "Amortisman (₺)",
      "YD artış (₺)",
      "Net etki (₺)"
    ],
    "ornek": [
      [
        "Makine A",
        500000,
        100000,
        80000,
        180000
      ],
      [
        "Bina B",
        2000000,
        40000,
        250000,
        290000
      ],
      [
        "Taşıt C",
        800000,
        160000,
        0,
        160000
      ],
      [
        "Demirbaş",
        120000,
        24000,
        15000,
        39000
      ]
    ],
    "metrikler": [
      [
        "Maliyet toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Amortisman",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "YD artış",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Net etki",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8>200000,\"YAP\",IF(B8>0,\"BEKLE\",\"YAPMA\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "YD artışı yüksek kıymetlerde 298/Ç vs Geç.32 karşılaştırın.",
      "Amortisman cetvelini yıl sonu kapanışına kilitleyin.",
      "Tam sürümde kural yılı ve vaka doğrulaması açılır."
    ]
  },
  "amortisman-ve-sabit-kiymet-satis-zamanlama-stratejisti": {
    "karar": "Normal/azalan bakiyeli amortisman ve çeyrek bazlı satış senaryosunun net nakit etkisini gösterir.",
    "girisBasliklari": [
      "Kıymet",
      "Maliyet (₺)",
      "Ömür (yıl)",
      "Satış bedeli (₺)",
      "Net nakit (₺)"
    ],
    "ornek": [
      [
        "Makine 1",
        1200000,
        8,
        680000,
        512000
      ],
      [
        "Makine 2",
        640000,
        6,
        290000,
        205000
      ],
      [
        "Taşıt 1",
        480000,
        5,
        185000,
        132000
      ],
      [
        "Bina 1",
        3200000,
        25,
        2450000,
        1900000
      ]
    ],
    "metrikler": [
      [
        "Toplam maliyet",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam satış bedeli",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam net nakit",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Kâr oranı",
        "=IFERROR(B7/B6,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B8<=0,\"DURDUR\",IF(B9<0.25,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "En yüksek net nakitli çeyreği satış dönemi olarak değerlendir.",
      "Vergi etkisini güncel oranla doğrula.",
      "Tam sürümde kıst amortisman, NBD ve dönem karşılaştırması açılır."
    ]
  },
  "asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli": {
    "karar": "Asgari ücret zammının işçilik maliyetine ve fiyat ayarlamasına etkisini gösterir.",
    "girisBasliklari": [
      "Ürün",
      "Satış fiyatı (₺)",
      "İşçilik payı (₺)",
      "Zam etkisi %",
      "Yeni fiyat (₺)"
    ],
    "ornek": [
      [
        "Ürün A",
        890,
        310,
        0.1,
        "=B6*(1+D6)"
      ],
      [
        "Ürün B",
        1490,
        520,
        0.1,
        "=B7*(1+D7)"
      ],
      [
        "Ürün C",
        640,
        220,
        0.1,
        "=B8*(1+D8)"
      ],
      [
        "Ürün D",
        1990,
        640,
        0.1,
        "=B9*(1+D9)"
      ]
    ],
    "metrikler": [
      [
        "Toplam işçilik payı",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Zam sonrası işçilik payı",
        "=B6*(1+AVERAGE(DEMO_GIRIS!D6:D25))",
        "para"
      ],
      [
        "Zam kaynaklı maliyet artışı",
        "=B7-B6",
        "para"
      ],
      [
        "Ortalama yeni fiyat",
        "=AVERAGE(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8/B6>0.15,\"DURDUR\",IF(B8/B6>0.05,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Zam etkisini ürün bazlı fiyata yansıt.",
      "İşçilik yoğun ürünlerde fiyat artışını önceliklendir.",
      "Tam sürümde çalışan bazlı maliyet, SGK yükü ve senaryo motoru açılır."
    ]
  },
  "asiri-dusuk-teklif-savunma-robotu": {
    "karar": "Aşırı düşük teklif açıklamasında sınırın altında kalan tutarı ve açıklama yeterliliğini gösterir.",
    "girisBasliklari": [
      "Kalem",
      "Maliyet (₺)",
      "Belge durumu",
      "Açıklama dahil mi",
      "Not"
    ],
    "ornek": [
      [
        "Malzeme",
        185000,
        "Belgeli",
        "Evet",
        ""
      ],
      [
        "İşçilik",
        96000,
        "Belgeli",
        "Evet",
        ""
      ],
      [
        "Makine",
        42000,
        "Belgesiz",
        "Hayır",
        ""
      ],
      [
        "Nakliye",
        18000,
        "Belgeli",
        "Evet",
        ""
      ],
      [
        "Genel gider",
        30000,
        "Belgesiz",
        "Hayır",
        ""
      ]
    ],
    "metrikler": [
      [
        "Toplam açıklama maliyeti",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Açıklama kapsamındaki tutar",
        "=SUMPRODUCT(--(DEMO_GIRIS!D6:D25=\"Evet\"),DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Belgesiz kalem tutarı",
        "=SUMPRODUCT(--(DEMO_GIRIS!C6:C25=\"Belgesiz\"),DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Açıklama kapsama oranı",
        "=IFERROR(B7/B6,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B8>B6*0.25,\"DURDUR\",IF(B9<0.75,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Belgesiz ve kapsam dışı kalemleri açıklamaya ekle.",
      "Açıklama tutarını sınır değerin altında kalan bölümle karşılaştır.",
      "Tam sürümde sınır hesapları, endeks farkı ve ihale kararı motoru birlikte çalışır."
    ]
  },
  "aylik-patron-finans-paneli": {
    "karar": "İşletmenin finansal durumunu tek ekranda yorumlar.",
    "girisBasliklari": [
      "Gösterge",
      "Tutar (₺)",
      "Not",
      "Dönem",
      "Kaynak"
    ],
    "ornek": [
      [
        "Nakit",
        185000,
        "",
        "Ağustos",
        "Kasa+Banka"
      ],
      [
        "Alacak",
        420000,
        "",
        "Ağustos",
        "Cari"
      ],
      [
        "Stok",
        310000,
        "",
        "Ağustos",
        "Stok"
      ],
      [
        "Kısa borç",
        560000,
        "",
        "Ağustos",
        "Borç"
      ],
      [
        "Aylık gelir",
        740000,
        "",
        "Ağustos",
        "Satış"
      ],
      [
        "Aylık gider",
        675000,
        "",
        "Ağustos",
        "Muhasebe"
      ]
    ],
    "metrikler": [
      [
        "Toplam likit varlık",
        "=SUM(DEMO_GIRIS!B6:B8)",
        "para"
      ],
      [
        "Kısa borç",
        "=DEMO_GIRIS!B9",
        "para"
      ],
      [
        "Aylık net",
        "=DEMO_GIRIS!B10-DEMO_GIRIS!B11",
        "para"
      ],
      [
        "Likidite tamponu",
        "=B6-B7",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9<0,\"DURDUR\",IF(B8<0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Likidite tamponunu kısa borçla birlikte değerlendir.",
      "Aylık net ile nakit değişimini aynı şey kabul etme.",
      "Tam sürümde yönetici KPI, trend, senaryo ve aksiyonlar tek sayfada birleşir."
    ]
  },
  "banka-kredi-ve-taksit-takip-sistemi": {
    "karar": "Borç yükünü, yaklaşan taksit baskısını ve refinansman ihtiyacını gösterir.",
    "girisBasliklari": [
      "Banka / kredi",
      "Kalan borç (₺)",
      "Aylık taksit (₺)",
      "Vade gün",
      "Aylık serbest nakit (₺)"
    ],
    "ornek": [
      [
        "Banka A - İşletme",
        420000,
        32000,
        5,
        95000
      ],
      [
        "Banka B - Spot",
        260000,
        24000,
        12,
        95000
      ],
      [
        "Banka C - Taşıt",
        145000,
        16000,
        20,
        95000
      ],
      [
        "Finansman - Ekipman",
        98000,
        12000,
        8,
        95000
      ],
      [
        "Banka D - Kobi Destek",
        180000,
        11000,
        25,
        95000
      ]
    ],
    "metrikler": [
      [
        "Toplam kalan borç",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Aylık toplam taksit",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "15 gün içindeki taksit sayısı",
        "=COUNTIF(DEMO_GIRIS!D6:D25,\"<=15\")",
        "sayi"
      ],
      [
        "Taksit / serbest nakit",
        "=IFERROR(B7/MAX(DEMO_GIRIS!E6:E25),0)",
        "yuzde"
      ],
      [
        "Demo karar",
        "=IF(B9>1,\"DURDUR\",IF(B9>0.6,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Taksit yükü serbest nakdi aşıyorsa yeni borçlanmayı durdur.",
      "15 gün içindeki taksitleri tahsilat planıyla eşleştir.",
      "Tam sürümde banka/kredi yoğunlaşması, takvim ve refinansman sinyali detaylanır."
    ]
  },
  "cari-ba-bs-toplu-mutabakat": {
    "karar": "Cari ile Form Ba/Bs tutarlarını eşleştirir; fark kovalarını listeler.",
    "girisBasliklari": [
      "VKN",
      "Cari (₺)",
      "Ba/Bs (₺)",
      "Fark (₺)",
      "Kova"
    ],
    "ornek": [
      [
        "1234567890",
        125000,
        125000,
        0,
        "Eşleşti"
      ],
      [
        "2345678901",
        88000,
        86000,
        2000,
        "Tutar farkı"
      ],
      [
        "3456789012",
        45000,
        0,
        45000,
        "Eşleşmedi"
      ],
      [
        "4567890123",
        67000,
        67050,
        -50,
        "Tolerans"
      ]
    ],
    "metrikler": [
      [
        "Cari toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Ba/Bs toplam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Fark mutlak",
        "=SUMPRODUCT(ABS(DEMO_GIRIS!D6:D25))",
        "para"
      ],
      [
        "Kayıt",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>20000,\"DURDUR\",IF(B8>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eşleşmeyen VKN satırlarını cariye işleyin.",
      "Tutar farkını fatura ile kapatın.",
      "Tam sürümde dört kova ve kök neden açılır."
    ]
  },
  "cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi": {
    "karar": "Kime satış durdurulmalı ve kimden tahsilat hızlandırılmalı sorusunu yanıtlar.",
    "girisBasliklari": [
      "Müşteri",
      "Bakiye (₺)",
      "Gecikme (gün)",
      "Teminat (₺)",
      "Planlanan tahsilat (₺)"
    ],
    "ornek": [
      [
        "Alfa Yapı",
        85000,
        35,
        25000,
        40000
      ],
      [
        "Beta Tekstil",
        32000,
        7,
        0,
        12000
      ],
      [
        "Gama Gıda",
        120000,
        18,
        45000,
        30000
      ],
      [
        "Delta İnşaat",
        18000,
        0,
        0,
        18000
      ],
      [
        "Epsilon Ltd.",
        54000,
        28,
        15000,
        20000
      ]
    ],
    "metrikler": [
      [
        "Toplam açık bakiye",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "30+ gün geciken müşteri",
        "=COUNTIF(DEMO_GIRIS!C6:C25,\">30\")",
        "sayi"
      ],
      [
        "Teminat açığı",
        "=MAX(0,SUM(DEMO_GIRIS!B6:B25)-SUM(DEMO_GIRIS!D6:D25)-SUM(DEMO_GIRIS!E6:E25))",
        "para"
      ],
      [
        "En yüksek gecikme",
        "=MAX(DEMO_GIRIS!C6:C25)",
        "sayi"
      ],
      [
        "Demo karar",
        "=IF(B7>=2,\"DURDUR\",IF(B8>50000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "30+ gün geciken müşterilerde yeni vadeli satışı incele.",
      "Teminat ve planlanan tahsilatı bakiye ile karşılaştır.",
      "Tam sürümde müşteri bazlı risk sıralaması ve dinamik tahsilat aksiyonu açılır."
    ]
  },
  "cek-senet-ve-vade-risk-sistemi": {
    "karar": "Ödeme yoğunlaşmasının hangi tarihte oluştuğunu ve karşılıksız kalma riskini gösterir.",
    "girisBasliklari": [
      "Vade",
      "Belge",
      "Tutar (₺)",
      "Hazır karşılık (₺)",
      "Durum"
    ],
    "ornek": [
      [
        "12.08.2026",
        "Çek-001",
        48000,
        40000,
        "Bekliyor"
      ],
      [
        "14.08.2026",
        "Çek-002",
        72000,
        60000,
        "Bekliyor"
      ],
      [
        "14.08.2026",
        "Senet-003",
        55000,
        45000,
        "Bekliyor"
      ],
      [
        "28.08.2026",
        "Çek-004",
        32000,
        32000,
        "Hazır"
      ],
      [
        "02.09.2026",
        "Senet-005",
        64000,
        55000,
        "Bekliyor"
      ]
    ],
    "metrikler": [
      [
        "Toplam vade yükü",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam hazır karşılık",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Karşılık açığı",
        "=MAX(0,B6-B7)",
        "para"
      ],
      [
        "En büyük tek belge",
        "=MAX(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8>75000,\"DURDUR\",IF(B8>25000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Aynı haftaya yığılan vadeleri yeniden planla.",
      "Karşılığı ayrılmamış büyük belgeleri önceliklendir.",
      "Tam sürümde tarih yoğunluğu, senaryo ve kök-neden risk analizi açılır."
    ]
  },
  "defter-beyan-e-arsiv-aktarim": {
    "karar": "e-Arşiv satırlarını Defter Beyan kolon haritasına dönüştürür ve hata listesini üretir.",
    "girisBasliklari": [
      "Fatura No",
      "Tutar (₺)",
      "Map durumu",
      "Hata",
      "Aktarım"
    ],
    "ornek": [
      [
        "EA-1001",
        11800,
        "Tam",
        "",
        "Hazır"
      ],
      [
        "EA-1002",
        23600,
        "Eksik alan",
        "VKN boş",
        "Durdur"
      ],
      [
        "EA-1003",
        5900,
        "Tam",
        "",
        "Hazır"
      ],
      [
        "EA-1004",
        17700,
        "Format",
        "Tarih hatalı",
        "İncele"
      ]
    ],
    "metrikler": [
      [
        "Satır sayısı",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Tutar toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Hatalı satır",
        "=COUNTIF(DEMO_GIRIS!E6:E25,\"Durdur\")+COUNTIF(DEMO_GIRIS!E6:E25,\"İncele\")",
        "adet"
      ],
      [
        "Hazır satır",
        "=COUNTIF(DEMO_GIRIS!E6:E25,\"Hazır\")",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>2,\"DURDUR\",IF(B8>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Hatalı satırları kolon haritasına göre düzeltin.",
      "Hazır satırları DBS aktarımına alın.",
      "Tam sürümde API yok; yapıştır-çalıştır modelidir."
    ]
  },
  "doviz-acik-pozisyonu-ve-kur-riski-stres-testi": {
    "karar": "Dövizli varlık ve borçların net açık pozisyonunu ve kur şoku etkisini gösterir.",
    "girisBasliklari": [
      "Kalem",
      "Varlık (₺)",
      "Borç (₺)",
      "Döviz cinsi",
      "Net pozisyon (₺)"
    ],
    "ornek": [
      [
        "Mevduat",
        850000,
        0,
        "USD",
        850000
      ],
      [
        "İhracat alacağı",
        1200000,
        0,
        "EUR",
        1200000
      ],
      [
        "Kredi",
        0,
        2400000,
        "USD",
        -2400000
      ],
      [
        "Tedarikçi borcu",
        0,
        480000,
        "EUR",
        -480000
      ]
    ],
    "metrikler": [
      [
        "Toplam varlık",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam borç",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Net pozisyon",
        "=B6-B7",
        "para"
      ],
      [
        "Kur şoku etkisi (%15)",
        "=B8*0.15",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>500000,\"DURDUR\",IF(B9>200000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Açık pozisyonu dengeleyici döviz işlemi değerlendir.",
      "Kur şoku senaryosunu AYARLAR oranıyla doğrula.",
      "Tam sürümde cins bazlı pozisyon, stres senaryoları ve karar motoru açılır."
    ]
  },
  "e-fatura-satir-defteri-pdf-kaniti": {
    "karar": "e-Fatura satırları ile muhasebe kayıtlarını eşleştirir; tutar farkı ve eksik belgeyi işaretler.",
    "girisBasliklari": [
      "UUID/No",
      "Tarih",
      "e-Fatura (₺)",
      "Muhasebe (₺)",
      "Fark (₺)"
    ],
    "ornek": [
      [
        "UUID-001",
        "01.07.2026",
        11800,
        11800,
        0
      ],
      [
        "UUID-002",
        "05.07.2026",
        23600,
        23000,
        600
      ],
      [
        "UUID-003",
        "12.07.2026",
        5900,
        5900,
        0
      ],
      [
        "UUID-004",
        "20.07.2026",
        17700,
        0,
        17700
      ]
    ],
    "metrikler": [
      [
        "e-Fatura toplam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Muhasebe toplam",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Fark toplam",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Kayıt sayısı",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>10000,\"DURDUR\",IF(B8>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eşleşmeyen UUID satırlarını muhasebeye işleyin.",
      "Tutar farkını belgeyle kapatın.",
      "Tam sürümde PDF kanıt raporu baskıya hazırdır."
    ]
  },
  "fazla-mesai-ve-isci-dava-riski-tespit-dosyasi": {
    "karar": "Fazla mesai karşılığını ve işçi alacağı riskini gösterir.",
    "girisBasliklari": [
      "Çalışan",
      "Brüt ücret (₺)",
      "Aylık fazla mesai (saat)",
      "Ödenen (₺)",
      "Eksik ödeme (₺)"
    ],
    "ornek": [
      [
        "Çalışan 1",
        42000,
        45,
        18000,
        3000
      ],
      [
        "Çalışan 2",
        38000,
        28,
        12000,
        0
      ],
      [
        "Çalışan 3",
        51000,
        62,
        15000,
        7000
      ],
      [
        "Çalışan 4",
        36000,
        15,
        8000,
        0
      ]
    ],
    "metrikler": [
      [
        "Toplam fazla mesai karşılığı",
        "=SUM(DEMO_GIRIS!C6:C25)* (AVERAGE(DEMO_GIRIS!B6:B25)/225)*1.5",
        "para"
      ],
      [
        "Toplam ödenen",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam eksik ödeme",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Eksik ödeme oranı",
        "=IFERROR(B8/MAX(B6,1),0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B9>0.35,\"DURDUR\",IF(B8>8000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eksik ödeme olan çalışanları öncelikli dava riski olarak işaretle.",
      "Aylık fazla mesai kayıtlarını sözleşmeyle doğrula.",
      "Tam sürümde saat sınırı, anomali ve dava riski motoru birlikte çalışır."
    ]
  },
  "gunluk-gelir-gider-ve-gercek-karlilik-sistemi": {
    "karar": "Ciro ile gerçek nakit kazancı arasındaki farkı gösterir.",
    "girisBasliklari": [
      "Gün",
      "Ciro (₺)",
      "Direkt gider (₺)",
      "Sabit/nakit gider (₺)",
      "Tahsil edilen (₺)"
    ],
    "ornek": [
      [
        "Pazartesi",
        42000,
        21000,
        8500,
        36000
      ],
      [
        "Salı",
        38000,
        20500,
        8500,
        25000
      ],
      [
        "Çarşamba",
        51000,
        26000,
        8500,
        47000
      ],
      [
        "Perşembe",
        33000,
        19000,
        8500,
        28000
      ],
      [
        "Cuma",
        62000,
        31500,
        8500,
        50000
      ]
    ],
    "metrikler": [
      [
        "Toplam ciro",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Gerçek nakit gider",
        "=SUM(DEMO_GIRIS!C6:C25)+SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Hesaplanan kâr",
        "=B6-B7",
        "para"
      ],
      [
        "Tahsilat-kâr farkı",
        "=SUM(DEMO_GIRIS!E6:E25)-B7",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8<0,\"DURDUR\",IF(B9<B8*0.5,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Ciro yüksek olsa da nakit gideri aşmıyorsa büyümeyi sorgula.",
      "Tahsilat ile hesaplanan kâr arasındaki farkı izle.",
      "Tam sürümde gerçek kârlılık, nakit bağlanması ve senaryo analizi ayrıştırılır."
    ]
  },
  "hakedis-fiyat-farki-hak-kaybi-cetveli": {
    "karar": "Hakediş fiyat farkını ve endeks kaynaklı hak kaybını gösterir.",
    "girisBasliklari": [
      "Dönem",
      "Hakediş (₺)",
      "Sözleşme endeks",
      "Güncel endeks",
      "Katsayı"
    ],
    "ornek": [
      [
        "Haziran",
        240000,
        220.4,
        231.8,
        0.8
      ],
      [
        "Temmuz",
        265000,
        220.4,
        238.1,
        0.8
      ],
      [
        "Ağustos",
        250000,
        220.4,
        245.6,
        0.8
      ],
      [
        "Eylül",
        280000,
        220.4,
        252.2,
        0.8
      ]
    ],
    "metrikler": [
      [
        "Toplam hakediş",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Ortalama endeks artışı",
        "=IFERROR(AVERAGE(DEMO_GIRIS!D6:D25)/AVERAGE(DEMO_GIRIS!C6:C25)-1,0)",
        "oran"
      ],
      [
        "Hesaplanan fiyat farkı",
        "=SUM(DEMO_GIRIS!B6:B25)*(B7)*AVERAGE(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Endeks farkı oranı",
        "=IFERROR(B8/MAX(B6,1),0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B9>0.15,\"DURDUR\",IF(B8<10000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Endeks artışını sözleşme hükmüyle eşleştir.",
      "Hesaplanan fiyat farkını hakedişe yansıt.",
      "Tam sürümde dönem bazlı fark, hak kaybı ve rapor motoru açılır."
    ]
  },
  "ihaleye-kac-tl-teklif-vermeliyim": {
    "karar": "Rakip teklifler üzerinden sınır değeri ve önerilen teklif aralığını gösterir.",
    "girisBasliklari": [
      "Teklif veren",
      "Teklif (₺)",
      "Yaklaşık maliyet (₺)",
      "Aralık durumu",
      "Not"
    ],
    "ornek": [
      [
        "Firma A",
        1180000,
        1200000,
        "Üst bölge",
        ""
      ],
      [
        "Firma B",
        1320000,
        1200000,
        "Üst bölge",
        ""
      ],
      [
        "Firma C",
        1040000,
        1200000,
        "Alt bölge",
        ""
      ],
      [
        "Firma D",
        960000,
        1200000,
        "Aşırı düşük",
        ""
      ],
      [
        "Firma E",
        1250000,
        1200000,
        "Üst bölge",
        ""
      ]
    ],
    "metrikler": [
      [
        "Ortalama rakip teklif",
        "=AVERAGE(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Sınır değer (tahmini)",
        "=IFERROR(B6*0.92,0)",
        "para"
      ],
      [
        "Önerilen alt sınır",
        "=IFERROR(B7*0.95,0)",
        "para"
      ],
      [
        "Aşırı düşük sayısı",
        "=COUNTIF(DEMO_GIRIS!D6:D25,\"Aşırı düşük\")",
        "sayi"
      ],
      [
        "Demo karar",
        "=IF(B9>=1,\"İNCELE\",IF(B8>1200000,\"DURDUR\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Sınır değerin altındaki teklifler aşırı düşük sorgusu riski taşır.",
      "Önerilen aralığı kâr hedefinle karşılaştır.",
      "Tam sürümde önceki ihale trendi, maliyet motoru ve senaryo analizi açılır."
    ]
  },
  "insaat-hakedis-santiye-maliyet": {
    "karar": "Hakediş kuyruğu ve şantiye maliyet sapmasını tek ekranda gösterir.",
    "girisBasliklari": [
      "Hakediş",
      "Tutar (₺)",
      "Maliyet (₺)",
      "Gecikme (gün)",
      "Durum"
    ],
    "ornek": [
      [
        "H-01",
        850000,
        720000,
        0,
        "Onay"
      ],
      [
        "H-02",
        420000,
        480000,
        12,
        "Bekliyor"
      ],
      [
        "H-03",
        610000,
        590000,
        3,
        "Bekliyor"
      ],
      [
        "H-04",
        300000,
        250000,
        25,
        "Geciken"
      ]
    ],
    "metrikler": [
      [
        "Hakediş toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Maliyet toplam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Sapma",
        "=B6-B7",
        "para"
      ],
      [
        "Ort. gecikme",
        "=AVERAGE(DEMO_GIRIS!D6:D25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B9>15,\"KRİTİK\",IF(OR(B8<0,B9>5),\"DİKKAT\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Maliyet aşan şantiye kalemini inceleyin.",
      "Geciken hakedişleri önceliklendirin.",
      "Tam sürümde durum makinesi ve yaşlandırma açılır."
    ]
  },
  "ithalat-depo-teslim-rafa-gelen-net-birim-maliyet": {
    "karar": "İthal ürünün FOB değerinden depo teslim net birim maliyetine geçişini gösterir.",
    "girisBasliklari": [
      "Ürün",
      "FOB (₺)",
      "CIF (₺)",
      "Vergi toplam (₺)",
      "Net birim maliyet (₺)"
    ],
    "ornek": [
      [
        "Ürün A",
        2400,
        2650,
        1180,
        3960
      ],
      [
        "Ürün B",
        850,
        940,
        420,
        1490
      ],
      [
        "Ürün C",
        5200,
        5750,
        2560,
        8790
      ],
      [
        "Ürün D",
        1360,
        1490,
        660,
        2410
      ]
    ],
    "metrikler": [
      [
        "Toplam FOB",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam vergi",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Vergi / CIF oranı",
        "=IFERROR(B7/SUM(DEMO_GIRIS!C6:C25),0)",
        "oran"
      ],
      [
        "Ortalama net birim maliyet",
        "=AVERAGE(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8>0.55,\"DURDUR\",IF(B9>3000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Vergi yükü yüksek ürünlerde fiyatlamayı yeniden değerlendir.",
      "CIF ve yurt içi masrafları ürün bazında doğrula.",
      "Tam sürümde gümrük, ÖTV, KDV kademeli hesabı ve yurt içi masraf dağıtımı açılır."
    ]
  },
  "kacirilan-sgk-tesvikleri-ve-gercek-iscilik-maliyeti-analizi": {
    "karar": "Yararlanılabilir SGK teşvik tutarını ve kaçırılan tutarı gösterir.",
    "girisBasliklari": [
      "Çalışan",
      "Brüt ücret (₺)",
      "SGK matrahı (₺)",
      "Teşvik oranı",
      "Kullanılıyor mu"
    ],
    "ornek": [
      [
        "Çalışan 1",
        42000,
        42000,
        0.05,
        "Evet"
      ],
      [
        "Çalışan 2",
        38000,
        38000,
        0.05,
        "Evet"
      ],
      [
        "Çalışan 3",
        51000,
        51000,
        0.035,
        "Hayır"
      ],
      [
        "Çalışan 4",
        36000,
        36000,
        0.05,
        "Evet"
      ],
      [
        "Çalışan 5",
        47000,
        47000,
        0.035,
        "Hayır"
      ]
    ],
    "metrikler": [
      [
        "Toplam SGK matrahı",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Yararlanılabilir teşvik",
        "=SUMPRODUCT(DEMO_GIRIS!C6:C25,DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Kullanılan teşvik",
        "=SUMPRODUCT((DEMO_GIRIS!E6:E25=\"Evet\")*DEMO_GIRIS!C6:C25*DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Kaçırılan teşvik",
        "=B7-B8",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>B7*0.5,\"DURDUR\",IF(B9>B7*0.15,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Kullanılmayan teşvik kodlarını SGK beyanına ekle.",
      "Teşvik oranlarını dönem bazında doğrula.",
      "Tam sürümde çalışan bazlı gerçek işçilik maliyeti ve teşvik simülatörü açılır."
    ]
  },
  "kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici": {
    "karar": "Devreden KDV ve ihracat iadesi sınırına göre azami KDV iade alacağını gösterir.",
    "girisBasliklari": [
      "Belge",
      "Tutar (₺)",
      "KDV (₺)",
      "İade hakkı",
      "Azami iade (₺)"
    ],
    "ornek": [
      [
        "İhracat faturası 1",
        650000,
        78000,
        "Evet",
        65000
      ],
      [
        "İhracat faturası 2",
        380000,
        45600,
        "Evet",
        38000
      ],
      [
        "Yurt içi satış",
        240000,
        28800,
        "Hayır",
        0
      ],
      [
        "Gider pusulası",
        48000,
        5760,
        "Hayır",
        0
      ]
    ],
    "metrikler": [
      [
        "Toplam belge tutarı",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam KDV",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "İade hakkı doğuran tutar",
        "=SUMIF(DEMO_GIRIS!D6:D25,\"Evet\",DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Azami iade",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9<B8,\"UYGUN\",IF(B9=B8,\"İNCELE\",\"DURDUR\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eksik belge varsa iade dosyasını tamamla.",
      "İade hakkı sınırını güncel mevzuatla doğrula.",
      "Tam sürümde belge takibi, sınır hesabı ve dosya kontrolü açılır."
    ]
  },
  "kdv-tevkifat-mahsup-iade-listesi": {
    "karar": "Tevkifat mahsup listesi ile iade satırlarını ayırır; MAHSUP/İADE/BEKLE kararını üretir.",
    "girisBasliklari": [
      "Belge",
      "Matrah (₺)",
      "Tevkifat (₺)",
      "Mahsup (₺)",
      "İade (₺)"
    ],
    "ornek": [
      [
        "F-1001",
        100000,
        10000,
        8000,
        2000
      ],
      [
        "F-1002",
        50000,
        5000,
        5000,
        0
      ],
      [
        "F-1003",
        200000,
        20000,
        0,
        20000
      ],
      [
        "F-1004",
        75000,
        7500,
        7500,
        0
      ]
    ],
    "metrikler": [
      [
        "Matrah toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Tevkifat toplam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Mahsup toplam",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "İade toplam",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>15000,\"İADE\",IF(B8>0,\"MAHSUP\",\"BEKLE\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "İade satırlarını belge paketleriyle eşleştirin.",
      "Mahsup listesini KDV2 ile hizalayın.",
      "Tam sürümde kural yılı ve tebliğ vakası açılır."
    ]
  },
  "kidem-ihbar-yuku-ve-personel-cikarma-maliyeti-hesaplayici": {
    "karar": "Çalışan çıkarmada kıdem ve ihbar tazminatı yükünü gösterir.",
    "girisBasliklari": [
      "Çalışan",
      "Hizmet yılı",
      "Brüt ücret (₺)",
      "Kıdem tazminatı (₺)",
      "İhbar tazminatı (₺)"
    ],
    "ornek": [
      [
        "Çalışan 1",
        2,
        38000,
        76000,
        38000
      ],
      [
        "Çalışan 2",
        1,
        36000,
        36000,
        36000
      ],
      [
        "Çalışan 3",
        3,
        42000,
        126000,
        42000
      ],
      [
        "Çalışan 4",
        1,
        34000,
        34000,
        34000
      ]
    ],
    "metrikler": [
      [
        "Toplam kıdem tazminatı",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam ihbar tazminatı",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Toplam çıkarma maliyeti",
        "=B6+B7",
        "para"
      ],
      [
        "En yüksek tek çalışan yükü",
        "=MAX(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8>500000,\"DURDUR\",IF(B8>200000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Uzun kıdemli çalışanlarda çıkarma maliyetini ayrıca değerlendir.",
      "İhbar süresi bildirimi ile ihbar tazminatını karşılaştır.",
      "Tam sürümde kıdem tavanı, tazminat hesabı ve toplu çıkarma senaryosu açılır."
    ]
  },
  "kira-avans-takip-dekont": {
    "karar": "Kira ve avans mahsup bakiyesini gösterir; yazdırılabilir dekont için karar üretir.",
    "girisBasliklari": [
      "Kiracı",
      "Kira (₺)",
      "Avans (₺)",
      "Mahsup (₺)",
      "Bakiye (₺)"
    ],
    "ornek": [
      [
        "Kiracı A",
        25000,
        50000,
        25000,
        25000
      ],
      [
        "Kiracı B",
        18000,
        0,
        0,
        18000
      ],
      [
        "Kiracı C",
        32000,
        32000,
        32000,
        0
      ],
      [
        "Kiracı D",
        22000,
        10000,
        10000,
        12000
      ]
    ],
    "metrikler": [
      [
        "Kira toplam",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Avans toplam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Mahsup toplam",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Açık bakiye",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>40000,\"KRİTİK\",IF(B9>10000,\"DİKKAT\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Açık bakiyesi olan kiracıya dekont kesin.",
      "Avans mahsup sırasını sözleşme ile doğrulayın.",
      "Tam sürümde durum makinesi ve yaşlandırma açılır."
    ]
  },
  "kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti": {
    "karar": "Yabancı kaynak/öz kaynak farkına göre kısıtlamaya tabi finansman giderini ve KKEG etkisini gösterir.",
    "girisBasliklari": [
      "Kalem",
      "Yabancı kaynak (₺)",
      "Öz kaynak (₺)",
      "Finansman gideri (₺)",
      "KKEG (₺)"
    ],
    "ornek": [
      [
        "Kısa vadeli borç",
        1850000,
        900000,
        96000,
        48000
      ],
      [
        "Uzun vadeli borç",
        960000,
        900000,
        72000,
        3600
      ],
      [
        "Kredi faizi",
        420000,
        900000,
        38400,
        0
      ],
      [
        "Kur farkı",
        780000,
        900000,
        28800,
        0
      ]
    ],
    "metrikler": [
      [
        "Toplam yabancı kaynak",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam öz kaynak",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Fark (aşan kısım)",
        "=B6-B7",
        "para"
      ],
      [
        "Toplam KKEG",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>40000,\"DURDUR\",IF(B9>10000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "KKEG tutarını dönem matrahına yansıt.",
      "Yabancı kaynak ve öz kaynak kalemlerini belgeyle doğrula.",
      "Tam sürümde oran hesabı, senaryo ve savunma raporu açılır."
    ]
  },
  "kobi-finans-yonetim-paketi": {
    "karar": "Günlük finans operasyonunun ana risklerini tek dosyada birleştirir.",
    "girisBasliklari": [
      "Gösterge",
      "Tutar (₺)",
      "Kritik eşik (₺)",
      "Durum notu",
      "Kaynak"
    ],
    "ornek": [
      [
        "Kullanılabilir nakit",
        90000,
        100000,
        "",
        "Kasa"
      ],
      [
        "30 gün tahsilat",
        260000,
        220000,
        "",
        "Cari"
      ],
      [
        "30 gün ödeme",
        240000,
        250000,
        "",
        "Ödeme"
      ],
      [
        "Aylık taksit",
        80000,
        85000,
        "",
        "Kredi"
      ],
      [
        "Vergi+SGK+maaş",
        168000,
        160000,
        "",
        "Karşılık"
      ],
      [
        "Stok bağlanması",
        190000,
        200000,
        "",
        "Stok"
      ]
    ],
    "metrikler": [
      [
        "Toplam izlenen finansal yük",
        "=SUM(DEMO_GIRIS!B6:B11)",
        "para"
      ],
      [
        "Eşik toplamı",
        "=SUM(DEMO_GIRIS!C6:C11)",
        "para"
      ],
      [
        "Eşiği aşan gösterge",
        "=SUMPRODUCT(--(DEMO_GIRIS!B6:B11>DEMO_GIRIS!C6:C11))",
        "sayi"
      ],
      [
        "Genel baskı oranı",
        "=IFERROR(B6/B7,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B8>=3,\"DURDUR\",IF(B8>=1,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Kasa, cari, borç, karşılık ve stok baskısını birlikte okuyun.",
      "Tek bir göstergenin iyi olması genel finans sağlığı için yeterli değildir.",
      "Tam sürüm diğer finans motorlarını ortak yönetim ve karar katmanında birleştirir."
    ]
  },
  "mutfak-kayip-kacak-hesaplayici": {
    "karar": "Teorik ve fiili hammadde tüketimini karşılaştırarak mutfak kayıp oranını ve tutarını gösterir.",
    "girisBasliklari": [
      "Hammadde",
      "Teorik (kg)",
      "Fiili (kg)",
      "Kayıp (kg)",
      "Kayıp oranı"
    ],
    "ornek": [
      [
        "Domates",
        420,
        510,
        90,
        "=D6/B6"
      ],
      [
        "Peynir",
        180,
        235,
        55,
        "=D7/B7"
      ],
      [
        "Et",
        260,
        335,
        75,
        "=D8/B8"
      ],
      [
        "Un",
        380,
        445,
        65,
        "=D9/B9"
      ]
    ],
    "metrikler": [
      [
        "Toplam teorik",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam fiili",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam kayıp",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam kayıp oranı",
        "=IFERROR(B8/B7,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B9>0.08,\"DURDUR\",IF(B9>0.03,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Yüksek kayıplı hammaddeyi mutfak sürecinde denetle.",
      "Stok ve reçete verisini doğrula.",
      "Tam sürümde reçete bazlı tüketim, anomali ve tahmin modülü açılır."
    ]
  },
  "nakliye-maliyeti-hesaplayici": {
    "karar": "Sefer bazında yakıt, bakım, sürücü ve amortisman maliyetinden km/ton-km birim maliyetini ve kârı gösterir.",
    "girisBasliklari": [
      "Sefer",
      "Km",
      "Ton",
      "Gelir (₺)",
      "Maliyet (₺)"
    ],
    "ornek": [
      [
        "Sefer 1",
        620,
        18,
        38500,
        29400
      ],
      [
        "Sefer 2",
        380,
        12,
        21800,
        17200
      ],
      [
        "Sefer 3",
        840,
        22,
        51200,
        39800
      ],
      [
        "Sefer 4",
        460,
        15,
        25600,
        21400
      ]
    ],
    "metrikler": [
      [
        "Toplam gelir",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam maliyet",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Net kâr",
        "=B6-B7",
        "para"
      ],
      [
        "Km başına maliyet",
        "=IFERROR(B8/SUM(DEMO_GIRIS!B6:B25),0)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B8<0,\"DURDUR\",IF(B8<B7*0.15,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Zararlı seferlerde fiyatlamayı yeniden değerlendir.",
      "Yakıt tüketimi ve bakım kalemlerini doğrula.",
      "Tam sürümde filo bazlı amortisman, senaryo ve duyarlılık analizi açılır."
    ]
  },
  "ortaklar-cari-ve-kasa-adat-faiz-faturasi-hesaplayici": {
    "karar": "Ortak cari bakiyeleri ve kasa adatları üzerinden dönem faizini ve fatura tutarını gösterir.",
    "girisBasliklari": [
      "Ortak",
      "Bakiye (₺)",
      "Gün",
      "Günlük faiz oranı",
      "Faiz (₺)"
    ],
    "ornek": [
      [
        "Ahmet Y.",
        850000,
        120,
        0.000411,
        41910
      ],
      [
        "Mehmet K.",
        420000,
        90,
        0.000411,
        15540
      ],
      [
        "Ayşe D.",
        1200000,
        150,
        0.000411,
        73980
      ],
      [
        "Ali S.",
        260000,
        60,
        0.000411,
        6412
      ]
    ],
    "metrikler": [
      [
        "Toplam bakiye",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam faiz",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "KDV (%20)",
        "=B7*0.20",
        "para"
      ],
      [
        "Fatura tutarı",
        "=B7+B8",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>100000,\"DURDUR\",IF(B9>50000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Faiz faturasını ortak bazında düzenle.",
      "Gün ve oranları belgelerle doğrula.",
      "Tam sürümde adat gün hesabı, dönem takibi ve fatura şablonu açılır."
    ]
  },
  "pazaryeri-net-kar-ve-eksik-hakedis-yakalayici": {
    "karar": "Pazaryeri satışlarında komisyon, kargo, reklam sonrası net kârı ve eksik hakedişi gösterir.",
    "girisBasliklari": [
      "Kalem",
      "Satış (₺)",
      "Gider (₺)",
      "Beklenen hakediş (₺)",
      "Gerçek hakediş (₺)"
    ],
    "ornek": [
      [
        "Kalem A",
        45000,
        13500,
        31500,
        29800
      ],
      [
        "Kalem B",
        28000,
        8200,
        19800,
        19800
      ],
      [
        "Kalem C",
        61000,
        19700,
        41300,
        38900
      ],
      [
        "Kalem D",
        18000,
        5400,
        12600,
        12600
      ]
    ],
    "metrikler": [
      [
        "Toplam satış",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam gider",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Beklenen hakediş",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Fark (eksik tahsilat)",
        "=B8-SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>5000,\"DURDUR\",IF(B9>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eksik hakedişi pazaryeri ile mutabık kıl.",
      "Gider kalemlerini belgeyle doğrula.",
      "Tam sürümde komisyon kademesi, iade, reklam dağıtımı ve tahmin açılır."
    ]
  },
  "pos-komisyon-ve-net-tahsilat-kontrol-sistemi": {
    "karar": "Bankanın eksik yatırdığı veya komisyona giden tutarı gösterir.",
    "girisBasliklari": [
      "Gün",
      "Brüt POS (₺)",
      "Komisyon %",
      "Beklenen net (₺)",
      "Banka yatan (₺)"
    ],
    "ornek": [
      [
        "01.08.2026",
        35000,
        0.025,
        "=B6*(1-C6)",
        34050
      ],
      [
        "02.08.2026",
        42000,
        0.027,
        "=B7*(1-C7)",
        40700
      ],
      [
        "03.08.2026",
        28000,
        0.025,
        "=B8*(1-C8)",
        27250
      ],
      [
        "04.08.2026",
        51000,
        0.03,
        "=B9*(1-C9)",
        48900
      ]
    ],
    "metrikler": [
      [
        "Toplam brüt POS",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Beklenen net",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Banka yatan",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Mutabakat farkı",
        "=B8-B7",
        "para"
      ],
      [
        "Demo karar",
        "=IF(ABS(B9)>2500,\"DURDUR\",IF(ABS(B9)>500,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Banka yatan ile beklenen neti günlük karşılaştır.",
      "Fark büyüyorsa komisyon/valör/kesinti belgesini kontrol et.",
      "Tam sürümde banka bazlı mutabakat ve kök-neden ayrıştırması açılır."
    ]
  },
  "proje-ve-is-bazinda-gercek-karlilik-sistemi": {
    "karar": "Hangi işin para kazandırdığını ve hangisinin nakit tükettiğini gösterir.",
    "girisBasliklari": [
      "Proje / iş",
      "Gelir (₺)",
      "Direkt maliyet (₺)",
      "Personel (₺)",
      "Finansman/nakit (₺)"
    ],
    "ornek": [
      [
        "Proje A",
        320000,
        165000,
        72000,
        18000
      ],
      [
        "Proje B",
        210000,
        138000,
        54000,
        24000
      ],
      [
        "Proje C",
        480000,
        255000,
        98000,
        32000
      ],
      [
        "Proje D",
        145000,
        97000,
        41000,
        15000
      ]
    ],
    "metrikler": [
      [
        "Toplam proje geliri",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam gerçek maliyet",
        "=SUM(DEMO_GIRIS!C6:E25)",
        "para"
      ],
      [
        "Gerçek proje kârı",
        "=B6-B7",
        "para"
      ],
      [
        "Gerçek marj",
        "=IFERROR(B8/B6,0)",
        "yuzde"
      ],
      [
        "Demo karar",
        "=IF(B8<0,\"DURDUR\",IF(B9<0.10,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Gelir yerine gerçek proje marjını yönetin.",
      "Finansman ve işletme sermayesi etkisini maliyetten ayırmayın.",
      "Tam sürümde iş bazlı nakit tüketimi, senaryo ve teklif eşiği açılır."
    ]
  },
  "restoran-recete-maliyet-fire": {
    "karar": "Fire dahil porsiyon maliyetini ve bileşim yüzde 100 kontrolünü gösterir.",
    "girisBasliklari": [
      "Reçete",
      "Hammadde (₺)",
      "Fire (₺)",
      "Porsiyon (₺)",
      "Hedef fiyat (₺)"
    ],
    "ornek": [
      [
        "Menemen",
        42,
        6,
        48,
        95
      ],
      [
        "Köfte",
        78,
        10,
        88,
        175
      ],
      [
        "Salata",
        28,
        4,
        32,
        75
      ],
      [
        "Pizza",
        55,
        8,
        63,
        140
      ]
    ],
    "metrikler": [
      [
        "Ort. porsiyon",
        "=AVERAGE(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Ort. fire",
        "=AVERAGE(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Food cost oranı",
        "=B6/AVERAGE(DEMO_GIRIS!E6:E25)",
        "yuzde"
      ],
      [
        "Kalem sayısı",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>0.45,\"KRİTİK\",IF(B8>0.35,\"DİKKAT\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Fire oranı yüksek reçeteyi gözden geçirin.",
      "Bileşim yüzde 100 dışına çıkan satırları düzeltin.",
      "Tam sürümde birim dönüşüm ve varyans köprüsü açılır."
    ]
  },
  "sirket-oz-kaynagi-eridi-mi-ttk-376-sermaye-tamamlama-cetveli": {
    "karar": "Öz kaynak, sermaye kaybı ve TTK 376 eşiklerini (1/3, 2/3, borca batıklık) gösterir.",
    "girisBasliklari": [
      "Dönem",
      "Sermaye (₺)",
      "Öz kaynak (₺)",
      "Kayıp (₺)",
      "Kayıp oranı"
    ],
    "ornek": [
      [
        "Oca 2026",
        2000000,
        1750000,
        250000,
        "=D6/B6"
      ],
      [
        "Şub 2026",
        2000000,
        1480000,
        520000,
        "=D7/B7"
      ],
      [
        "Mar 2026",
        2000000,
        1260000,
        740000,
        "=D8/B8"
      ],
      [
        "Nis 2026",
        2000000,
        1080000,
        920000,
        "=D9/B9"
      ]
    ],
    "metrikler": [
      [
        "Toplam kayıp",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Son dönem kayıp oranı",
        "=IFERROR(DEMO_GIRIS!D9/DEMO_GIRIS!B9,0)",
        "oran"
      ],
      [
        "2/3 eşiği",
        "=2/3",
        "oran"
      ],
      [
        "1/3 eşiği",
        "=1/3",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B7>=B8,\"DURDUR\",IF(B7>=B9,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Kayıp oranı 2/3 eşiğini aştıysa genel kurul sürecini başlat.",
      "Bilanço kalemlerini belgelerle doğrula.",
      "Tam sürümde aylık izleme, borca batıklık ve yönetim kurulu raporu açılır."
    ]
  },
  "stok-satis-ve-nakit-baglanma-sistemi": {
    "karar": "Hangi stokun para tükettiğini ve hangisinin yeniden alınması gerektiğini gösterir.",
    "girisBasliklari": [
      "Ürün",
      "Stok maliyeti (₺)",
      "30 gün satış (₺)",
      "Brüt marj %",
      "Tedarik süresi (gün)"
    ],
    "ornek": [
      [
        "Ürün A",
        95000,
        45000,
        0.28,
        12
      ],
      [
        "Ürün B",
        42000,
        68000,
        0.34,
        8
      ],
      [
        "Ürün C",
        120000,
        15000,
        0.22,
        25
      ],
      [
        "Ürün D",
        28000,
        51000,
        0.31,
        5
      ],
      [
        "Ürün E",
        76000,
        38000,
        0.18,
        18
      ]
    ],
    "metrikler": [
      [
        "Toplam stok maliyeti",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "30 gün satış",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Stok / satış oranı",
        "=IFERROR(B6/B7,0)",
        "oran"
      ],
      [
        "Satışı çok düşük ürün",
        "=COUNTIF(DEMO_GIRIS!C6:C25,\"<20000\")",
        "sayi"
      ],
      [
        "Demo karar",
        "=IF(B8>2,\"DURDUR\",IF(B9>=1,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Satışı düşük ve stok maliyeti yüksek ürünlerde yeniden alımı durdur.",
      "Hızlı dönen ürünlerde tedarik süresini ayrıca izle.",
      "Tam sürümde stok gün sayısı, yeniden sipariş ve nakit bağlanma motoru açılır."
    ]
  },
  "sube-karlilik-ve-nakit-hesaplayici": {
    "karar": "Şube bazında gelir, gider ve nakit akışını toplayarak kârlılık ve nakit pozisyonunu gösterir.",
    "girisBasliklari": [
      "Şube",
      "Gelir (₺)",
      "Gider (₺)",
      "Net kâr (₺)",
      "Marj"
    ],
    "ornek": [
      [
        "İstanbul",
        940000,
        620000,
        320000,
        "=D6/B6"
      ],
      [
        "Ankara",
        480000,
        390000,
        90000,
        "=D7/B7"
      ],
      [
        "İzmir",
        520000,
        415000,
        105000,
        "=D8/B8"
      ],
      [
        "Bursa",
        260000,
        275000,
        -15000,
        "=D9/B9"
      ]
    ],
    "metrikler": [
      [
        "Toplam gelir",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam gider",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam net kâr",
        "=B6-B7",
        "para"
      ],
      [
        "Genel marj",
        "=IFERROR(B8/B6,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B9<0.05,\"DURDUR\",IF(B9<0.15,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Zararlı şubelerin gider yapısını denetle.",
      "Tahsilat ve ödeme planını gözden geçir.",
      "Tam sürümde nakit akışı, senaryo ve duyarlılık analizi açılır."
    ]
  },
  "taseron-hakedis-kesinti-mutabakati": {
    "karar": "Taşeron hakedişi ile yapılan ödeme arasındaki mutabakat farkını gösterir.",
    "girisBasliklari": [
      "Taşeron",
      "Hakediş (₺)",
      "Kesinti (₺)",
      "Ödenen (₺)",
      "Fark (₺)"
    ],
    "ornek": [
      [
        "Taşeron A",
        185000,
        25000,
        155000,
        "=B6-C6-D6"
      ],
      [
        "Taşeron B",
        96000,
        12000,
        80000,
        "=B7-C7-D7"
      ],
      [
        "Taşeron C",
        132000,
        18000,
        118000,
        "=B8-C8-D8"
      ],
      [
        "Taşeron D",
        74000,
        9000,
        68000,
        "=B9-C9-D9"
      ]
    ],
    "metrikler": [
      [
        "Toplam hakediş",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam kesinti",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam ödenen",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Toplam mutabakat farkı",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(ABS(B9)>B6*0.05,\"DURDUR\",IF(ABS(B9)>1000,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Fark tutarı taşeron hakedişinde işaretle.",
      "Kesinti kalemlerini sözleşme hükümleriyle doğrula.",
      "Tam sürümde taşeron bazlı mutabakat ve ihtilaf erken uyarısı açılır."
    ]
  },
  "tesvikli-bordro-avantajli-tesvik": {
    "karar": "Çalışan bazında en avantajlı SGK teşvik kodunu seçer ve kaçırılan tasarrufu gösterir.",
    "girisBasliklari": [
      "Çalışan",
      "Brüt (₺)",
      "Mevcut teşvik (₺)",
      "Potansiyel (₺)",
      "Kaçırılan (₺)"
    ],
    "ornek": [
      [
        "A. Yılmaz",
        45000,
        2250,
        6500,
        4250
      ],
      [
        "B. Demir",
        38000,
        1900,
        5200,
        3300
      ],
      [
        "C. Kaya",
        52000,
        0,
        7800,
        7800
      ],
      [
        "D. Çelik",
        41000,
        2050,
        2050,
        0
      ]
    ],
    "metrikler": [
      [
        "Toplam brüt",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Mevcut teşvik",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Potansiyel",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Kaçırılan",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>10000,\"UYGULA\",IF(B9>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Kaçırılan tutarı yüksek çalışanlarda teşvik kodunu değiştirin.",
      "Bordro satırını dönem kapanışından önce kilitleyin.",
      "Tam sürümde kural yılı ve vaka doğrulaması açılır."
    ]
  },
  "trendyol-komisyon-sonrasi-net-kar": {
    "karar": "Trendyol komisyon, TY Plus, flash, reklam ve kargo sonrası net kârı ve SAT/ZAM/ÇEKİL kararını gösterir.",
    "girisBasliklari": [
      "SKU",
      "Satış (₺)",
      "Maliyet (₺)",
      "Komisyon+kesinti (₺)",
      "Hakediş (₺)"
    ],
    "ornek": [
      [
        "SKU-A",
        45000,
        18000,
        9000,
        36000
      ],
      [
        "SKU-B",
        28000,
        12000,
        5600,
        22400
      ],
      [
        "SKU-C",
        61000,
        25000,
        14000,
        45000
      ],
      [
        "SKU-D",
        18000,
        8000,
        4000,
        14000
      ]
    ],
    "metrikler": [
      [
        "Toplam satış",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam maliyet",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam kesinti",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Net kâr",
        "=B6-B7-B8",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9<0,\"ÇEKİL\",IF(B9<5000,\"ZAM\",\"SAT\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Negatif net kârda SKUyu çekin veya fiyatı artırın.",
      "Kesinti kırılımını kategori komisyon tablosuyla doğrulayın.",
      "Tam sürümde TY Plus, flash ve desi kargo ayrı kolonlarda açılır."
    ]
  },
  "uretim-recetesi-ve-zam-yansitma-hesaplayici": {
    "karar": "Reçete hammadde zamlarının ürün maliyetine ve önerilen satış fiyatına etkisini gösterir.",
    "girisBasliklari": [
      "Ürün",
      "Eski maliyet (₺)",
      "Yeni maliyet (₺)",
      "Artış (₺)",
      "Zam oranı"
    ],
    "ornek": [
      [
        "Ürün A",
        85,
        104,
        19,
        "=D6/B6"
      ],
      [
        "Ürün B",
        42,
        51,
        9,
        "=D7/B7"
      ],
      [
        "Ürün C",
        130,
        168,
        38,
        "=D8/B8"
      ],
      [
        "Ürün D",
        65,
        76,
        11,
        "=D9/B9"
      ]
    ],
    "metrikler": [
      [
        "Toplam eski maliyet",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam yeni maliyet",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam artış",
        "=B7-B6",
        "para"
      ],
      [
        "Ortalama zam oranı",
        "=IFERROR(B8/B6,0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B9>0.20,\"DURDUR\",IF(B9>0.08,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Yüksek artışlı ürünlerde fiyatı yeniden hesapla.",
      "Fire ve hammadde verisini doğrula.",
      "Tam sürümde reçete bazlı hedef marj ve önerilen fiyat açılır."
    ]
  },
  "vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi": {
    "karar": "Tecil (6183/48), kredi ve peşin ödeme seçeneklerinin toplam maliyetini karşılaştırır.",
    "girisBasliklari": [
      "Borç",
      "Asıl (₺)",
      "Zam (₺)",
      "Tecil taksit",
      "Toplam ödeme (₺)"
    ],
    "ornek": [
      [
        "Vergi borcu",
        480000,
        86400,
        24,
        597600
      ],
      [
        "SGK borcu",
        315000,
        47250,
        12,
        382725
      ],
      [
        "Kira tevkifatı",
        96000,
        12480,
        6,
        113280
      ],
      [
        "Motorlu taşıt",
        42000,
        5880,
        12,
        50148
      ]
    ],
    "metrikler": [
      [
        "Toplam asıl",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam zam",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Toplam ödeme",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Kredi maliyeti (örnek)",
        "=B6*1.18",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9<B8,\"UYGUN\",IF(B9<B8*1.05,\"İNCELE\",\"DURDUR\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "En düşük maliyetli seçeneği borç bazında değerlendir.",
      "Kredi faiz oranını güncel piyasa ile doğrula.",
      "Tam sürümde NBD, vade ve taksit planı senaryoları açılır."
    ]
  },
  "vergi-sgk-ve-maas-karsilik-ayirma-sistemi": {
    "karar": "Bugünkü paranın ne kadarının gerçekte harcanabilir olmadığını gösterir.",
    "girisBasliklari": [
      "Dönem",
      "Mevcut nakit (₺)",
      "Vergi karşılığı (₺)",
      "SGK+maaş (₺)",
      "Diğer zorunlu (₺)"
    ],
    "ornek": [
      [
        "Ağustos",
        280000,
        62000,
        118000,
        18000
      ],
      [
        "Eylül",
        210000,
        51000,
        112000,
        15000
      ],
      [
        "Ekim",
        260000,
        56000,
        116000,
        16000
      ],
      [
        "Kasım",
        240000,
        53000,
        110000,
        15000
      ],
      [
        "Aralık",
        230000,
        50000,
        108000,
        14000
      ]
    ],
    "metrikler": [
      [
        "Toplam görünen nakit",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam zorunlu karşılık",
        "=SUM(DEMO_GIRIS!C6:E25)",
        "para"
      ],
      [
        "Gerçek harcanabilir nakit",
        "=B6-B7",
        "para"
      ],
      [
        "Karşılık / nakit",
        "=IFERROR(B7/B6,0)",
        "yuzde"
      ],
      [
        "Demo karar",
        "=IF(B8<0,\"DURDUR\",IF(B9>0.8,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Vergi, SGK ve maaş karşılıklarını ayrı tut.",
      "Harcanabilir nakit negatifse discretionary ödemeyi durdur.",
      "Tam sürümde dönemsel tahakkuk ve ödeme takvimi detaylanır."
    ]
  },
  "yeniden-degerleme-yapmali-miyim-vergi-tasarruf-analizi": {
    "karar": "Kıymet bazında yeniden değerlemenin fon vergisi ve ek amortisman sonrası net vergi tasarrufunu gösterir.",
    "girisBasliklari": [
      "Kıymet",
      "Maliyet (₺)",
      "Katsayı",
      "Değer artışı (₺)",
      "Net tasarruf (₺)"
    ],
    "ornek": [
      [
        "Makine 1",
        850000,
        1.42,
        357000,
        42500
      ],
      [
        "Makine 2",
        420000,
        1.38,
        159600,
        18600
      ],
      [
        "Bina 1",
        2500000,
        1.51,
        1275000,
        152000
      ],
      [
        "Taşıt 1",
        380000,
        1.24,
        91200,
        10400
      ]
    ],
    "metrikler": [
      [
        "Toplam maliyet",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam değer artışı",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Fon vergisi (%2)",
        "=B7*0.02",
        "para"
      ],
      [
        "Toplam net tasarruf",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>B8,\"UYGUN\",IF(B9>B8*0.7,\"İNCELE\",\"DURDUR\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Net tasarrufu pozitif kıymetlerde yeniden değerlemeyi değerlendir.",
      "Katsayı ve oranları güncel mevzuatla doğrula.",
      "Tam sürümde kıymet bazlı yıl ve ömür hesabı, senaryo ve karar motoru açılır."
    ]
  },
  "yillara-sari-insaat-stopaj-nakit-akis-planlayici": {
    "karar": "Dönem stopaj yükünü ve nakit akışı açığını gösterir.",
    "girisBasliklari": [
      "Dönem",
      "Hakediş (₺)",
      "Stopaj oranı",
      "Tahsilat (₺)",
      "Ödeme (₺)"
    ],
    "ornek": [
      [
        "2026 Q3",
        320000,
        0.05,
        290000,
        260000
      ],
      [
        "2026 Q4",
        410000,
        0.05,
        380000,
        350000
      ],
      [
        "2027 Q1",
        480000,
        0.05,
        300000,
        360000
      ],
      [
        "2027 Q2",
        520000,
        0.05,
        470000,
        430000
      ]
    ],
    "metrikler": [
      [
        "Toplam hakediş",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Toplam stopaj",
        "=SUMPRODUCT(DEMO_GIRIS!B6:B25,DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Net nakit (tahsilat-ödeme)",
        "=SUM(DEMO_GIRIS!D6:D25)-SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Stopaj / nakit oranı",
        "=IFERROR(B7/MAX(B8,1),0)",
        "oran"
      ],
      [
        "Demo karar",
        "=IF(B8<0,\"DURDUR\",IF(B9>0.5,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Stopaj ödeme tarihlerini tahsilatla eşleştir.",
      "Nakit açığı dönemlerinde finansman planı oluştur.",
      "Tam sürümde yıllık plan, vergi planı ve nakit köprüsü motoru açılır."
    ]
  },
  "kdv-iade-listesi-robotu-gib7": {
    "karar": "GİB 7 liste tutarlarını toplar; İADE/EKSİK BELGE/BEKLE kararını üretir.",
    "girisBasliklari": [
      "Liste",
      "Satır",
      "Tutar (₺)",
      "Eksik belge",
      "Durum"
    ],
    "ornek": [
      [
        "İndirilecek KDV",
        12,
        180000,
        0,
        "Hazır"
      ],
      [
        "Yüklenilen KDV",
        8,
        95000,
        1,
        "Eksik"
      ],
      [
        "GÇB",
        5,
        220000,
        0,
        "Hazır"
      ],
      [
        "Diğer",
        3,
        40000,
        0,
        "Hazır"
      ]
    ],
    "metrikler": [
      [
        "Toplam tutar",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Satır",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "adet"
      ],
      [
        "Eksik",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "adet"
      ],
      [
        "Liste sayısı",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>0,\"EKSİK BELGE\",IF(B6>0,\"İADE\",\"BEKLE\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eksik belgeleri tamamlayın.",
      "7 listeyi GİB sırasıyla kontrol edin.",
      "Tam sürümde kural yılı ve kanıt raporu açılır."
    ]
  },
  "e-fatura-toplu-donusturucu": {
    "karar": "Toplu e-Fatura satırlarını muhasebe ile eşleştirir; PDF kanıt için karar üretir.",
    "girisBasliklari": [
      "UUID",
      "e-Fatura (₺)",
      "Muhasebe (₺)",
      "Fark (₺)",
      "Kova"
    ],
    "ornek": [
      [
        "U1",
        11800,
        11800,
        0,
        "Eşleşti"
      ],
      [
        "U2",
        23600,
        23000,
        600,
        "Fark"
      ],
      [
        "U3",
        5900,
        5900,
        0,
        "Eşleşti"
      ],
      [
        "U4",
        17700,
        0,
        17700,
        "Eşleşmedi"
      ]
    ],
    "metrikler": [
      [
        "e-Fatura",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Muhasebe",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Fark",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Kayıt",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B8>10000,\"DURDUR\",IF(B8>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "XML dosyası okunmaz; export satırı yapıştırılır.",
      "Eşleşmeyen UUID’leri işleyin.",
      "Tam sürümde 10.000 satır ölçeği açılır."
    ]
  },
  "ymm-tasdik-kontrol-robotu": {
    "karar": "YMM tasdik kontrol listesi ve eksik belge kuyruğundan TASDIK/EKSİK/DURDUR üretir.",
    "girisBasliklari": [
      "Kalem",
      "Zorunlu",
      "Durum",
      "Gecikme (gün)",
      "Risk"
    ],
    "ornek": [
      [
        "Bilanço",
        "Evet",
        "Tamam",
        0,
        "Düşük"
      ],
      [
        "Defter",
        "Evet",
        "Eksik",
        12,
        "Yüksek"
      ],
      [
        "Fatura örnek",
        "Evet",
        "İnceleme",
        3,
        "Orta"
      ],
      [
        "Sözleşme",
        "Hayır",
        "Tamam",
        0,
        "Düşük"
      ]
    ],
    "metrikler": [
      [
        "Kalem",
        "=COUNTA(DEMO_GIRIS!A6:A25)",
        "adet"
      ],
      [
        "Eksik",
        "=COUNTIF(DEMO_GIRIS!C6:C25,\"Eksik\")",
        "adet"
      ],
      [
        "Ort. gecikme",
        "=AVERAGE(DEMO_GIRIS!D6:D25)",
        "adet"
      ],
      [
        "Yüksek risk",
        "=COUNTIF(DEMO_GIRIS!E6:E25,\"Yüksek\")",
        "adet"
      ],
      [
        "Demo karar",
        "=IF(B9>=1,\"DURDUR\",IF(B7>0,\"EKSİK\",\"TASDIK\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Eksik zorunlu belgeleri tamamlayın.",
      "Geciken kalemleri önceliklendirin.",
      "Tam sürümde durum makinesi ve kanıt paketi açılır."
    ]
  },
  "tesvikli-bordro-optimizasyon": {
    "karar": "Kişi×teşvik matrisi ile kaçırılan tasarrufu ve UYGULA/İNCELE kararını gösterir.",
    "girisBasliklari": [
      "Çalışan",
      "Brüt (₺)",
      "Mevcut (₺)",
      "Potansiyel (₺)",
      "Kaçırılan (₺)"
    ],
    "ornek": [
      [
        "A",
        50000,
        2500,
        8000,
        5500
      ],
      [
        "B",
        42000,
        2100,
        6500,
        4400
      ],
      [
        "C",
        60000,
        0,
        9500,
        9500
      ],
      [
        "D",
        38000,
        3800,
        3800,
        0
      ]
    ],
    "metrikler": [
      [
        "Brüt",
        "=SUM(DEMO_GIRIS!B6:B25)",
        "para"
      ],
      [
        "Mevcut",
        "=SUM(DEMO_GIRIS!C6:C25)",
        "para"
      ],
      [
        "Potansiyel",
        "=SUM(DEMO_GIRIS!D6:D25)",
        "para"
      ],
      [
        "Kaçırılan",
        "=SUM(DEMO_GIRIS!E6:E25)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>15000,\"UYGULA\",IF(B9>0,\"İNCELE\",\"UYGUN\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Kaçırılan tutarı yüksek çalışanlarda kod değiştirin.",
      "Matris setini dönem kapanışına kilitleyin.",
      "Tam sürümde M-SEN ve vaka doğrulaması açılır."
    ]
  },
  "konkordato-nakit-akis-on-projesi": {
    "karar": "3 yıllık nakit açık/fazlasından BAŞVUR/BEKLE/UYGUN DEĞİL kararını üretir.",
    "girisBasliklari": [
      "Yıl",
      "Gelir (₺)",
      "Gider (₺)",
      "Nakit (₺)",
      "Açık (₺)"
    ],
    "ornek": [
      [
        "2026",
        12000000,
        13500000,
        -1500000,
        1500000
      ],
      [
        "2027",
        14000000,
        13800000,
        200000,
        0
      ],
      [
        "2028",
        16000000,
        14500000,
        1500000,
        0
      ],
      [
        "Toplam",
        42000000,
        41800000,
        200000,
        1500000
      ]
    ],
    "metrikler": [
      [
        "Gelir",
        "=SUM(DEMO_GIRIS!B6:B8)",
        "para"
      ],
      [
        "Gider",
        "=SUM(DEMO_GIRIS!C6:C8)",
        "para"
      ],
      [
        "Net nakit",
        "=B6-B7",
        "para"
      ],
      [
        "Açık",
        "=SUM(DEMO_GIRIS!E6:E8)",
        "para"
      ],
      [
        "Demo karar",
        "=IF(B9>2000000,\"UYGUN DEĞİL\",IF(B8<0,\"BEKLE\",\"BAŞVUR\"))",
        "metin"
      ]
    ],
    "aksiyonlar": [
      "Nakit açık yılları mahkeme raporunda vurgulayın.",
      "3 yıllık bilanço satırlarını kilitleyin.",
      "Tam sürümde durum makinesi ve kanıt raporu açılır."
    ]
  }
});

function getProofDemoSpec(slug) {
  return SPECS[slug] ?? null;
}

module.exports = { SPECS, getProofDemoSpec };
