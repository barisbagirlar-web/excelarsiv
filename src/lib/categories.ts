export const categories = [
  { slug: 'finansal-analiz', name: 'Finansal Analiz', description: 'Oran ve eğilimlerle mali yapıyı izleyin.' },
  { slug: 'nakit-akisi', name: 'Nakit Akışı', description: 'Giriş ve çıkışları haftalık planlayın.' },
  { slug: 'muhasebe-ve-vergi', name: 'Muhasebe ve Vergi', description: 'Kayıt ve kontrol düzenini kurun.' },
  { slug: 'butce-ve-planlama', name: 'Bütçe ve Planlama', description: 'Hedef ve sapmaları yönetin.' },
  { slug: 'stok-ve-uretim', name: 'Stok ve Üretim', description: 'Miktar ve devir takibini yapın.' },
  { slug: 'satis-ve-fiyatlama', name: 'Satış ve Fiyatlama', description: 'Fiyat ve marj kararlarını verin.' },
  { slug: 'personel-ve-bordro', name: 'Personel ve Bordro', description: 'Bordro ve maliyeti hesaplayın.' },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export function getCategoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
