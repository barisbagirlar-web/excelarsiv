'use strict';

// The Functions source is deployed as the isolated `functions/` directory.
// Keep a deployment-local catalog mirror so Cloud Functions never depends on
// a parent-directory file that is omitted from the uploaded source package.
// This module is part of the production deployment boundary; catalog changes
// must therefore trigger a backend redeploy before checkout is released.
const catalog = require('./catalog.json');
if (!catalog?.tiers || !catalog?.products) {
  throw new Error('Packaged commerce catalog is incomplete');
}

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
