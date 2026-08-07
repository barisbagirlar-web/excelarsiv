'use strict';

const catalog = require('./commerce/catalog.json');

const TIERS = Object.freeze(
  Object.fromEntries(
    Object.entries(catalog.tiers).map(([name, value]) => [name, Object.freeze({ ...value })]),
  ),
);

const PRODUCTS = Object.freeze(
  Object.fromEntries(
    Object.entries(catalog.products).map(([slug, value]) => {
      const tier = TIERS[value.tier];
      if (!tier) throw new Error(`Unknown tier ${value.tier} for ${slug}`);
      return [slug, Object.freeze({ ...value, priceTL: tier.priceTL })];
    }),
  ),
);

function getTierForPrice(priceTL) {
  return Object.entries(TIERS).find(([, value]) => value.priceTL === Number(priceTL))?.[0] ?? null;
}

function getTierByProductId(productId) {
  const normalized = String(productId ?? '').trim();
  return Object.entries(TIERS).find(([, value]) => value.shopierProductId === normalized)?.[0] ?? null;
}

module.exports = { TIERS, PRODUCTS, getTierForPrice, getTierByProductId };
