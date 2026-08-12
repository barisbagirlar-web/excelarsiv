export interface SektorUrun {
  slug: string;
  neden: string;
}

export interface Sektor {
  slug: string;
  title: string;
  description: string;
  lead: string;
  products: SektorUrun[];
}

export const SEKTORLER: Sektor[] = [
  {
    slug: 'kafe-restoran-nakit',
    title: 'Kafe / Restoran Nakit ve Kârlılık',
    description:
      'Kafe ve restoran işletmeleri için kasa, menü maliyeti, kayıp/kaçak ve nakit planlama Excel sistemleri.',
    lead: 'Günlük kasa, menü reçete maliyeti ve kayıp/kaçak — tek dikeyde karar sistemleri.',
    products: [
      { slug: 'akilli-kasa-defteri-ve-nakit-kontrol-sistemi', neden: 'Günlük kasa ve nakit kontrolü' },
      { slug: 'recete-maliyeti-menu-muhendisligi', neden: 'Menü / reçete maliyet ve mühendislik' },
      { slug: 'mutfak-kayip-kacak-hesaplayici', neden: 'Mutfak kayıp/kaçak ve menü kârı' },
      { slug: '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi', neden: '13 haftalık nakit planı' },
    ],
  },
  {
    slug: 'insaat-hakedis',
    title: 'İnşaat Hakediş ve Teklif',
    description:
      'İnşaat hakediş, fiyat farkı, aşırı düşük teklif ve taşeron mutabakatı için Excel karar sistemleri.',
    lead: 'Hakediş, eskalasyon, sınır değer ve taşeron kesinti — şantiye finansının omurgası.',
    products: [
      { slug: 'insaat-hakedis-yonetim-sistemi', neden: 'Hakediş yönetim sistemi' },
      { slug: 'hakedis-fiyat-farki-hak-kaybi-cetveli', neden: 'Fiyat farkı / hak kaybı' },
      { slug: 'ihale-fiyat-farki-eskalasyon-pro', neden: 'İhale fiyat farkı (eskalasyon)' },
      { slug: 'asiri-dusuk-teklif-savunma-robotu', neden: 'Aşırı düşük teklif savunması' },
      { slug: 'taseron-hakedis-kesinti-mutabakati', neden: 'Taşeron hakediş mutabakatı' },
    ],
  },
  {
    slug: 'e-ticaret-karlilik',
    title: 'E-Ticaret ve Pazaryeri Kârlılık',
    description:
      'E-ticaret gerçek kârlılık, pazaryeri hakediş mutabakatı ve net tahsilat için Excel sistemleri.',
    lead: 'Komisyon, kargo, iade ve hakediş — ekranda görünen ciroyu nakit kâra çevirin.',
    products: [
      { slug: 'e-ticaret-gercek-karlilik-fiyatlama', neden: 'E-ticaret gerçek kârlılık' },
      { slug: 'pazaryeri-net-kar-ve-eksik-hakedis-yakalayici', neden: 'Pazaryeri net kâr / eksik hakediş' },
      { slug: 'pazaryeri-hakedis-mutabakat-motoru', neden: 'Hakediş mutabakat motoru' },
      { slug: 'pos-komisyon-ve-net-tahsilat-kontrol-sistemi', neden: 'POS komisyon ve net tahsilat' },
      { slug: 'kargo-desi-maliyet-optimizasyonu', neden: 'Kargo / desi maliyet' },
    ],
  },
];

export function sektorRotalari(): string[] {
  return SEKTORLER.map((s) => `/sektor/${s.slug}`);
}
