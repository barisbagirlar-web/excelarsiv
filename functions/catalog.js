'use strict';

const TIERS = Object.freeze({
  PRO: Object.freeze({
    priceTL: 990,
    shopierProductId: '49652321',
    shopierUrl: 'https://www.shopier.com/49652321',
  }),
  PREMIUM: Object.freeze({
    priceTL: 1490,
    shopierProductId: '49652403',
    shopierUrl: 'https://www.shopier.com/49652403',
  }),
  ENTERPRISE: Object.freeze({
    priceTL: 2490,
    shopierProductId: '49653399',
    shopierUrl: 'https://www.shopier.com/49653399',
  }),
  EXCLUSIVE: Object.freeze({
    priceTL: 7900,
    shopierProductId: '49653437',
    shopierUrl: 'https://www.shopier.com/49653437',
  }),
});

const PRODUCTS = Object.freeze({
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': Object.freeze({
    name: '13 Haftalık Nakit Akışı ve Ödeme Planlama Sistemi',
    tier: 'ENTERPRISE',
    priceTL: 2490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/146581bf9981e729746cd19aebc87839/product.xlsx',
  }),
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': Object.freeze({
    name: 'Akıllı Kasa Defteri ve Nakit Kontrol Sistemi',
    tier: 'PRO',
    priceTL: 990,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/22abcc63fe2f943c48dfba6c26b89275/product.xlsx',
  }),
  'aylik-patron-finans-paneli': Object.freeze({
    name: 'Aylık Patron Finans Paneli',
    tier: 'ENTERPRISE',
    priceTL: 2490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/c5a431b1c9d723374836cd4b1b1698c0/product.xlsx',
  }),
  'banka-kredi-ve-taksit-takip-sistemi': Object.freeze({
    name: 'Banka, Kredi ve Taksit Takip Sistemi',
    tier: 'PREMIUM',
    priceTL: 1490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/dffdf827a785079c0a192aa38743f474/product.xlsx',
  }),
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': Object.freeze({
    name: 'Cari Hesap, Tahsilat ve Müşteri Risk Takip Sistemi',
    tier: 'PREMIUM',
    priceTL: 1490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/2d8ce60fe1d1bef7278586413f65927f/product.xlsx',
  }),
  'cek-senet-ve-vade-risk-sistemi': Object.freeze({
    name: 'Çek–Senet ve Vade Risk Sistemi',
    tier: 'PREMIUM',
    priceTL: 1490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/daf3cb59cbd732e3ab10929375c0fb5a/product.xlsx',
  }),
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': Object.freeze({
    name: 'Günlük Gelir–Gider ve Gerçek Kârlılık Sistemi',
    tier: 'PREMIUM',
    priceTL: 1490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/a4b4e62b796ae880e4cdf569c4800dbd/product.xlsx',
  }),
  'kobi-finans-yonetim-paketi': Object.freeze({
    name: 'KOBİ Finans Yönetim Paketi',
    tier: 'EXCLUSIVE',
    priceTL: 7900,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/a3cf76f195785a55b1e824687b0b7c49/product.xlsx',
  }),
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': Object.freeze({
    name: 'POS, Komisyon ve Net Tahsilat Kontrol Sistemi',
    tier: 'PRO',
    priceTL: 990,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/a1e49563d1359926e364795e733ad17c/product.xlsx',
  }),
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': Object.freeze({
    name: 'Proje ve İş Bazında Gerçek Kârlılık Sistemi',
    tier: 'ENTERPRISE',
    priceTL: 2490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/f5009367aebf5eabfc7f5c5db0dddd88/product.xlsx',
  }),
  'stok-satis-ve-nakit-baglanma-sistemi': Object.freeze({
    name: 'Stok, Satış ve Nakit Bağlanma Sistemi',
    tier: 'PREMIUM',
    priceTL: 1490,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/f6941e9077e81f4fbd279fda51899a5a/product.xlsx',
  }),
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': Object.freeze({
    name: 'Vergi, SGK ve Maaş Karşılık Ayırma Sistemi',
    tier: 'PRO',
    priceTL: 990,
    fileFormat: 'xlsx',
    storageKey: 'excelarsiv-paid/9b26bdcc9ce66923d853061ebece996b/product.xlsx',
  }),
});

function getTierForPrice(priceTL) {
  return Object.entries(TIERS).find(([, value]) => value.priceTL === priceTL)?.[0] ?? null;
}

function getTierByProductId(productId) {
  const normalized = String(productId ?? '').trim();
  return Object.entries(TIERS).find(([, value]) => value.shopierProductId === normalized)?.[0] ?? null;
}

module.exports = { TIERS, PRODUCTS, getTierForPrice, getTierByProductId };
