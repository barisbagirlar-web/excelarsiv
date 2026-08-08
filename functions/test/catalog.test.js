'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTS } = require('../catalog');

test('satışa açık ürünlerin tamamı satista bayrağı taşır', () => {
  const satista = Object.entries(PRODUCTS).filter(([, p]) => p.satista !== false);
  assert.equal(satista.length, 6, `beklenen 6 satışa açık ürün, bulunan ${satista.length}`);
});

test('satış dosyası eksik ürünler satista=false ile kapalıdır', () => {
  for (const slug of [
    'aylik-patron-finans-paneli',
    'kobi-finans-yonetim-paketi',
    'pos-komisyon-ve-net-tahsilat-kontrol-sistemi',
    'proje-ve-is-bazinda-gercek-karlilik-sistemi',
    'stok-satis-ve-nakit-baglanma-sistemi',
    'vergi-sgk-ve-maas-karsilik-ayirma-sistemi',
  ]) {
    assert.equal(PRODUCTS[slug]?.satista, false, `${slug} satışa kapalı olmalı`);
  }
});

test('yüklenen 6 hedef ürün satista=true ile satışa açıktır', () => {
  for (const slug of [
    '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi',
    'akilli-kasa-defteri-ve-nakit-kontrol-sistemi',
    'banka-kredi-ve-taksit-takip-sistemi',
    'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi',
    'cek-senet-ve-vade-risk-sistemi',
    'gunluk-gelir-gider-ve-gercek-karlilik-sistemi',
  ]) {
    assert.ok(PRODUCTS[slug]?.satista !== false, `${slug} satışa açık olmalı`);
  }
});
