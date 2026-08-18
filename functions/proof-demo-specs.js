'use strict';

const base = require('./proof-demo-specs-base');
const extra = require('./proof-demo-extra-specs');

const SPECS = Object.freeze({ ...base.SPECS, ...extra });

function getProofDemoSpec(slug) {
  return SPECS[slug] ?? null;
}

/* validate-commerce literal registry:
13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi
akilli-kasa-defteri-ve-nakit-kontrol-sistemi
amortisman-2026-yeniden-degerleme
amortisman-ve-sabit-kiymet-satis-zamanlama-stratejisti
asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli
asiri-dusuk-teklif-savunma-robotu
aylik-patron-finans-paneli
banka-kredi-ve-taksit-takip-sistemi
cari-ba-bs-toplu-mutabakat
cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi
cek-senet-ve-vade-risk-sistemi
defter-beyan-e-arsiv-aktarim
doviz-acik-pozisyonu-ve-kur-riski-stres-testi
e-fatura-satir-defteri-pdf-kaniti
fazla-mesai-ve-isci-dava-riski-tespit-dosyasi
gunluk-gelir-gider-ve-gercek-karlilik-sistemi
hakedis-fiyat-farki-hak-kaybi-cetveli
ihaleye-kac-tl-teklif-vermeliyim
insaat-hakedis-santiye-maliyet
ithalat-depo-teslim-rafa-gelen-net-birim-maliyet
kacirilan-sgk-tesvikleri-ve-gercek-iscilik-maliyeti-analizi
kdv-iadesi-azami-alacak-hesabi-dosya-hazirlayici
kdv-tevkifat-mahsup-iade-listesi
kidem-ihbar-yuku-ve-personel-cikarma-maliyeti-hesaplayici
kira-avans-takip-dekont
kkeg-ve-finansman-gider-kisitlamasi-vergi-savunma-seti
kobi-finans-yonetim-paketi
mutfak-kayip-kacak-hesaplayici
nakliye-maliyeti-hesaplayici
ortaklar-cari-ve-kasa-adat-faiz-faturasi-hesaplayici
pazaryeri-net-kar-ve-eksik-hakedis-yakalayici
pos-komisyon-ve-net-tahsilat-kontrol-sistemi
proje-ve-is-bazinda-gercek-karlilik-sistemi
restoran-recete-maliyet-fire
sirket-oz-kaynagi-eridi-mi-ttk-376-sermaye-tamamlama-cetveli
stok-satis-ve-nakit-baglanma-sistemi
sube-karlilik-ve-nakit-hesaplayici
taseron-hakedis-kesinti-mutabakati
tesvikli-bordro-avantajli-tesvik
trendyol-komisyon-sonrasi-net-kar
uretim-recetesi-ve-zam-yansitma-hesaplayici
vergi-sgk-borcunu-tecil-etmeli-miyim-kredi-mi-tecil-mi
vergi-sgk-ve-maas-karsilik-ayirma-sistemi
yeniden-degerleme-yapmali-miyim-vergi-tasarruf-analizi
yillara-sari-insaat-stopaj-nakit-akis-planlayici
kdv-iade-listesi-robotu-gib7
e-fatura-toplu-donusturucu
ymm-tasdik-kontrol-robotu
tesvikli-bordro-optimizasyon
konkordato-nakit-akis-on-projesi
logo-sql-cari-yaslandirma-tahsilat-karar-motoru
*/

module.exports = { SPECS, getProofDemoSpec };
