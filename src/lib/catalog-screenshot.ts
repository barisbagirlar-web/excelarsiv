export interface CatalogShot {
  src: string;
  alt: string;
}

const SONUC_ALT = /pano|karar|rapor|yönetim|sonuç|çıktı|özet/i;

/** Katalog kartı: girdi sayfası değil, karar/çıktı ekranı (SCREENSHOT_STANDARD I4). */
export function pickCatalogScreenshot(shots: CatalogShot[]): CatalogShot | undefined {
  if (shots.length === 0) return undefined;
  const byAlt = shots.find((shot) => SONUC_ALT.test(shot.alt));
  if (byAlt) return byAlt;
  const byFile = shots.find((shot) => /-3\.(png|webp)$/i.test(shot.src));
  if (byFile) return byFile;
  return shots[Math.min(2, shots.length - 1)];
}

export function catalogScreenshotAlt(name: string): string {
  return `${name} gerçek Excel karar ekranı`;
}
