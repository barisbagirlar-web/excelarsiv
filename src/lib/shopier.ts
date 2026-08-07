import catalog from '../../commerce/catalog.json';

export type ShopierTierName = keyof typeof catalog.tiers;

export interface ShopierTier {
  priceTL: number;
  shopierProductId: string;
  shopierUrl: string;
}

export function getTierForPrice(priceTL: number): { name: ShopierTierName; tier: ShopierTier } | null {
  const entry = Object.entries(catalog.tiers).find(([, tier]) => tier.priceTL === priceTL);
  if (!entry) return null;
  return { name: entry[0] as ShopierTierName, tier: entry[1] as ShopierTier };
}

export function getCommerceProduct(slug: string) {
  return catalog.products[slug as keyof typeof catalog.products] ?? null;
}

export { catalog as shopierCatalog };
