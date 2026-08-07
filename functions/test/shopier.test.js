'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TIERS, PRODUCTS, getTierByProductId } = require('../catalog');
const {
  normalizeEmail,
  numericValue,
  normalizeShopierOrder,
  extractOrders,
  orderMatchesCheckout,
} = require('../index')._test;

test('four Shopier price tiers are exact and unique', () => {
  assert.deepEqual(
    Object.values(TIERS).map((tier) => tier.priceTL).sort((a, b) => a - b),
    [990, 1490, 2490, 7900],
  );
  assert.equal(new Set(Object.values(TIERS).map((tier) => tier.shopierProductId)).size, 4);
});

test('every product inherits its tier price', () => {
  for (const [slug, product] of Object.entries(PRODUCTS)) {
    assert.ok(TIERS[product.tier], `${slug} has a known tier`);
    assert.equal(product.priceTL, TIERS[product.tier].priceTL, `${slug} price matches tier`);
    assert.match(product.storageKey, /^paid-products\/.+\/current\.(xlsx|xlsm)$/);
  }
});

test('Shopier product ids map to tiers', () => {
  assert.equal(getTierByProductId('49652321'), 'PRO');
  assert.equal(getTierByProductId('49652403'), 'PREMIUM');
  assert.equal(getTierByProductId('49653399'), 'ENTERPRISE');
  assert.equal(getTierByProductId('49653437'), 'EXCLUSIVE');
});

test('normalizers handle Turkish price strings and email casing', () => {
  assert.equal(normalizeEmail('  Test.User@Example.COM '), 'test.user@example.com');
  assert.equal(numericValue('1.490,00 TL'), 1490);
  assert.equal(numericValue('2490.00'), 2490);
});

test('order parser accepts documented Shopier order shape', () => {
  const raw = {
    id: 'ORDER-123',
    paymentStatus: 'paid',
    dateCreated: '2026-08-07T14:00:00+0300',
    currency: 'TRY',
    totals: { total: '1490.00' },
    shippingInfo: { email: 'buyer@example.com' },
    lineItems: [{ productId: '49652403', quantity: 1, price: '1490.00' }],
  };
  const order = normalizeShopierOrder(raw);
  assert.equal(order.id, 'ORDER-123');
  assert.equal(order.tier, 'PREMIUM');
  assert.equal(order.amount, 1490);
  assert.equal(order.knownQuantity, 1);
});

test('order matching rejects wrong amount, email and quantity', () => {
  const baseRaw = {
    id: 'ORDER-123',
    paymentStatus: 'paid',
    dateCreated: '2026-08-07T14:00:00+0300',
    currency: 'TRY',
    totals: { total: '1490.00' },
    shippingInfo: { email: 'buyer@example.com' },
    lineItems: [{ productId: '49652403', quantity: 1 }],
  };
  const crypto = require('node:crypto');
  const emailHash = crypto.createHash('sha256').update('buyer@example.com').digest('hex');
  const checkout = {
    emailHash,
    tier: 'PREMIUM',
    expectedAmountTL: 1490,
    createdAt: { toMillis: () => Date.parse('2026-08-07T13:55:00+0300') },
  };

  assert.equal(orderMatchesCheckout(normalizeShopierOrder(baseRaw), checkout), true);
  assert.equal(orderMatchesCheckout(normalizeShopierOrder({ ...baseRaw, totals: { total: '990.00' } }), checkout), false);
  assert.equal(orderMatchesCheckout(normalizeShopierOrder({ ...baseRaw, shippingInfo: { email: 'other@example.com' } }), checkout), false);
  assert.equal(orderMatchesCheckout(normalizeShopierOrder({ ...baseRaw, lineItems: [{ productId: '49652403', quantity: 2 }] }), checkout), false);
});

test('order list extractor accepts common API envelopes', () => {
  assert.equal(extractOrders([{ id: 1 }]).length, 1);
  assert.equal(extractOrders({ orders: [{ id: 1 }] }).length, 1);
  assert.equal(extractOrders({ data: { items: [{ id: 1 }] } }).length, 1);
});
