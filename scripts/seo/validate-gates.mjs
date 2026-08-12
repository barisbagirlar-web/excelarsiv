// Saf (yan etkisiz) doğrulama kapıları.
// Bu modül import edildiğinde hiçbir dosya okumaz / process çalıştırmaz;
// böylece offline semantic testler doğrudan kapıları kullanabilir.

export function isValidLastmod(value) {
  if (!value) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  const iso = new Date(ms).toISOString();
  return iso === value || iso.slice(0, 19) === value.slice(0, 19);
}

export function isFuture(value, nowIso = new Date().toISOString()) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T23:59:59.999Z`) : Date.parse(value);
  return Number.isFinite(base) && base > Date.parse(nowIso) + 5 * 60 * 1000;
}

export function findDuplicateLocs(locs) {
  const seen = new Set();
  const duplicates = new Set();
  for (const loc of locs) {
    if (seen.has(loc)) duplicates.add(loc);
    seen.add(loc);
  }
  return [...duplicates];
}

/** Google image sitemap child: sayfa <loc> products ile yeniden listelenir; aggregate duplicate sayılmaz. */
export function isImageSitemapChild(childLoc, xml = '') {
  try {
    const name = new URL(childLoc).pathname.split('/').filter(Boolean).at(-1) ?? '';
    if (/^sitemap-images(?:-\d+)?\.xml$/i.test(name)) return true;
  } catch {
    /* ignore invalid URL */
  }
  return typeof xml === 'string' && (xml.includes('xmlns:image=') || xml.includes('<image:loc>'));
}

export function shouldAggregatePageLocs(childLoc, xml = '') {
  return !isImageSitemapChild(childLoc, xml);
}

export function findFutureLastmods(entries, nowIso = new Date().toISOString()) {
  return entries.filter((entry) => entry.lastmod && isFuture(entry.lastmod, nowIso));
}

export function findQueryParamLocs(locs) {
  return locs.filter((loc) => loc.includes('?') || loc.includes('#'));
}

export function validateParity(expected, sitemapLocs) {
  const errors = [];
  const expectedSet = expected instanceof Set ? expected : new Set(expected);
  const actual = new Set(sitemapLocs);
  if (actual.size !== sitemapLocs.length) errors.push('Sitemap child dosyalarında duplicate URL var');
  for (const canonical of expectedSet) {
    if (!actual.has(canonical)) errors.push(`SITEMAP_PARITY_MISSING: ${canonical}`);
  }
  for (const loc of actual) {
    if (!expectedSet.has(loc)) errors.push(`SITEMAP_PARITY_EXTRA: ${loc}`);
  }
  return errors;
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function xmlValues(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
    .map((match) => decodeXml(match[1].trim()));
}

export function validateChildXml(xml, { nowIso = new Date().toISOString(), label = 'child' } = {}) {
  const errors = [];
  if (!/^<\?xml[^>]*>\s*<urlset\b/i.test(xml)) errors.push(`${label}: geçerli urlset değil`);
  if (/<priority>|<changefreq>/i.test(xml)) errors.push(`${label}: priority/changefreq gürültüsü bulundu`);
  const locs = xmlValues(xml, 'loc');
  const lastmods = xmlValues(xml, 'lastmod');
  if (locs.length > 50_000) errors.push(`${label}: 50.000 URL sınırı aşıldı`);
  if (locs.length === 0) errors.push(`${label}: URL içermiyor`);
  for (const dup of findDuplicateLocs(locs)) errors.push(`${label}: duplicate URL -> ${dup}`);
  for (const raw of findQueryParamLocs(locs)) errors.push(`${label}: query parametreli loc -> ${raw}`);
  for (const raw of lastmods) {
    if (!isValidLastmod(raw)) errors.push(`${label}: geçersiz lastmod -> ${raw}`);
    else if (isFuture(raw, nowIso)) errors.push(`${label}: gelecek tarihli lastmod -> ${raw}`);
  }
  return { locs, lastmods, errors };
}

export function validateIndexXml(xml, { nowIso = new Date().toISOString(), label = 'index' } = {}) {
  const errors = [];
  const childUrls = xmlValues(xml, 'loc');
  const indexLastmods = xmlValues(xml, 'lastmod');
  for (const dup of findDuplicateLocs(childUrls)) errors.push(`${label}: duplicate child -> ${dup}`);
  for (const raw of indexLastmods) {
    if (!isValidLastmod(raw)) errors.push(`${label}: geçersiz index lastmod -> ${raw}`);
    else if (isFuture(raw, nowIso)) errors.push(`${label}: gelecek tarihli index lastmod -> ${raw}`);
  }
  return { childUrls, indexLastmods, errors };
}
