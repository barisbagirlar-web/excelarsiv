export type ShopierTier = 'PRO' | 'PREMIUM' | 'ENTERPRISE' | 'EXCLUSIVE';

export interface ShopierPlan {
  tier: ShopierTier;
  priceTL: number;
  productId: string;
  url: string;
}

export const SHOPIER_PLANS: readonly ShopierPlan[] = [
  { tier: 'PRO', priceTL: 990, productId: '49652321', url: 'https://www.shopier.com/49652321' },
  { tier: 'PREMIUM', priceTL: 1490, productId: '49652403', url: 'https://www.shopier.com/49652403' },
  { tier: 'ENTERPRISE', priceTL: 2490, productId: '49653399', url: 'https://www.shopier.com/49653399' },
  { tier: 'EXCLUSIVE', priceTL: 7900, productId: '49653437', url: 'https://www.shopier.com/49653437' },
] as const;

export function getShopierPlan(priceTL: number): ShopierPlan | undefined {
  return SHOPIER_PLANS.find((plan) => plan.priceTL === priceTL);
}
