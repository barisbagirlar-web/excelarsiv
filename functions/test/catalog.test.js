'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TIERS, PRODUCTS, getTierForPrice, getTierByProductId } = require('../catalog');

const EXPECTED_PRICES = [990, 1490, 2490, 7900];

test('four Shopier tiers are configured exactly once', () => {
  assert.deepEqual(
    Object.values(TIERS).map((tier) => tier.priceTL).sort((a, b) => a - b),
    EXPECTED_PRICES,
  );
  assert.equal(new Set(Object.values(TIERS).map((tier) => tier.shopierProductId)).size, 4);
  assert.equal(new Set(Object.values(TIERS).map((tier) => tier.shopierUrl)).size, 4);
});

test('every paid product maps to one valid tier and a private opaque storage key', () => {
  assert.equal(Object.keys(PRODUCTS).length, 12);
  const storageKeys = new Set();

  for (const [slug, product] of Object.entries(PRODUCTS)) {
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.ok(TIERS[product.tier], `${slug}: unknown tier`);
    assert.equal(product.priceTL, TIERS[product.tier].priceTL, `${slug}: tier price mismatch`);
    assert.match(product.storageKey, /^excelarsiv-paid\/[a-f0-9]{32}\/product\.xlsx$/);
    assert.equal(storageKeys.has(product.storageKey), false, `${slug}: duplicate storage key`);
    storageKeys.add(product.storageKey);
  }
});

test('tier lookup works by price and Shopier product id', () => {
  for (const [name, tier] of Object.entries(TIERS)) {
    assert.equal(getTierForPrice(tier.priceTL), name);
    assert.equal(getTierByProductId(tier.shopierProductId), name);
  }
  assert.equal(getTierForPrice(1234), null);
  assert.equal(getTierByProductId('missing'), null);
});
