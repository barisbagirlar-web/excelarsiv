'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PRODUCTS } = require('../catalog');

test('katalogdaki tüm ürünler satista=true ile satışa açıktır', () => {
  const satista = Object.entries(PRODUCTS).filter(([, p]) => p.satista !== false);
  assert.equal(satista.length, Object.keys(PRODUCTS).length,
    `tüm ${Object.keys(PRODUCTS).length} ürün satışa açık olmalı`);
});

test('tüm ürünlerde storageKey private paid-products standardına uygundur', () => {
  for (const [slug, p] of Object.entries(PRODUCTS)) {
    const uzanti = p.fileFormat === 'xlsm' ? 'xlsm' : 'xlsx';
    assert.equal(p.storageKey, `paid-products/${slug}/current.${uzanti}`,
      `${slug} storageKey standart olmalı`);
  }
});

test('production createCheckout satista gate içerir', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'safe-checkout.js'), 'utf8');
  assert.match(source, /satista\s*===\s*false/, 'safe-checkout.js PRODUCT_NOT_FOR_SALE kapısı olmalı');
  assert.match(source, /PRODUCT_NOT_FOR_SALE/, 'safe-checkout.js PRODUCT_NOT_FOR_SALE yanıtı içermeli');
  assert.ok(
    source.indexOf('PRODUCT_NOT_FOR_SALE') < source.indexOf('PRODUCT_NOT_READY'),
    'satista kapısı storage kapısından önce çalışmalı',
  );
});

