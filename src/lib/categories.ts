export const categories = [
  { slug: 'finansal-analiz', name: 'Finansal Analiz' },
  { slug: 'nakit-akisi', name: 'Nakit Akışı' },
  { slug: 'muhasebe-ve-vergi', name: 'Muhasebe ve Vergi' },
  { slug: 'butce-ve-planlama', name: 'Bütçe ve Planlama' },
  { slug: 'stok-ve-uretim', name: 'Stok ve Üretim' },
  { slug: 'satis-ve-fiyatlama', name: 'Satış ve Fiyatlama' },
  { slug: 'personel-ve-bordro', name: 'Personel ve Bordro' },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export function getCategoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
