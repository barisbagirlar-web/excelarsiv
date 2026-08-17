export interface CatalogShot {
  src: string;
  alt: string;
}

const SONUC_ALT = /pano|karar|rapor|yönetim|sonuç|çıktı|özet/i;
const GIRDI_ALT = /girdi|giriş|input|nakit_giris/i;

/** Katalog kartı: girdi sayfası değil, karar/çıktı ekranı (SCREENSHOT_STANDARD I4). */
export function pickCatalogScreenshot(shots: CatalogShot[]): CatalogShot | undefined {
  if (shots.length === 0) return undefined;
  const karar = shots.filter((shot) => !GIRDI_ALT.test(shot.alt));
  const pool = karar.length > 0 ? karar : shots;
  const byAlt = pool.find((shot) => SONUC_ALT.test(shot.alt));
  if (byAlt) return byAlt;
  const byFile = pool.find((shot) => /-3\.(png|webp)$/i.test(shot.src));
  if (byFile) return byFile;
  return pool[Math.min(2, pool.length - 1)];
}

export function catalogScreenshotAlt(name: string): string {
  return `${name} gerçek Excel karar ekranı`;
}
