'use strict';

module.exports = Object.freeze({
  'logo-sql-cari-yaslandirma-tahsilat-karar-motoru': {
    karar: 'Logo/SQL cari hareket örneğinden açık alacak, gecikme ve tahsilat önceliğini gösterir.',
    girisBasliklari: ['Cari', 'Borç (₺)', 'Tahsilat (₺)', 'Vade (gün)', 'Gecikme (gün)'],
    ornek: [
      ['Atlas Yapı', 320000, 195000, 30, 107],
      ['Bora Lojistik', 210000, 80000, 30, 126],
      ['Cem Gıda', 145000, 0, 30, 18],
      ['Delta Dış Ticaret', 402000, 167500, 30, 78],
      ['Eksen Makine', 420000, 0, 30, 0]
    ],
    metrikler: [
      ['Açık alacak', '=SUM(DEMO_GIRIS!B6:B25)-SUM(DEMO_GIRIS!C6:C25)', 'para'],
      ['Vadesi geçmiş', '=SUMIF(DEMO_GIRIS!E6:E25,">0",DEMO_GIRIS!B6:B25)-SUMIF(DEMO_GIRIS!E6:E25,">0",DEMO_GIRIS!C6:C25)', 'para'],
      ['90+ riskli satır', '=COUNTIF(DEMO_GIRIS!E6:E25,">90")', 'adet'],
      ['Ortalama gecikme', '=IFERROR(SUMIF(DEMO_GIRIS!E6:E25,">0",DEMO_GIRIS!E6:E25)/COUNTIF(DEMO_GIRIS!E6:E25,">0"),0)', 'adet'],
      ['Demo karar', '=IF(B8>=2,"ACİL",IF(B7>100000,"İNCELE","UYGUN"))', 'metin']
    ],
    aksiyonlar: [
      '90 günü aşan açık alacakları önce ele alın.',
      'Vadesi geçmiş tutarı müşteri bazında tahsilat kuyruğuna alın.',
      'Tam sürümde FIFO açık kalem, 7 kovalı yaşlandırma, 13 hafta ve VUK 323 ön eleği açılır.'
    ]
  }
});
