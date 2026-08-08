// SEO kapıları: offline doğrulama (madde 4.3) + kaynak dil guard (madde 12).
// Her kapı saf fonksiyondur; test dosyası tarafından import edilir.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DIST = join(ROOT, 'dist');
const SRC_DIR = join(ROOT, 'src');
const SCRIPTS_DIR = join(ROOT, 'scripts');
const GITHUB_DIR = join(ROOT, '.github');
const PUBLIC_DIR = join(ROOT, 'public');
const SITE = 'https://excelarsiv.com';
const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;
const FUTURE_GRACE_MS = 5 * 60 * 1000;

export const TURKISH_CHARS_RE = /[çğıİöşü]/u;
export function hasTurkishChars(value) {
  return TURKISH_CHARS_RE.test(value);
}

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

export function isFuture(value, nowIso) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T23:59:59.999Z`) : Date.parse(value);
  return Number.isFinite(base) && base > Date.parse(nowIso) + FUTURE_GRACE_MS;
}

export function findDuplicateUrls(entries) {
  const seen = new Map();
  for (const entry of entries) {
    seen.set(entry.loc, (seen.get(entry.loc) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([loc]) => loc);
}

export function findFutureLastmods(entries, nowIso) {
  return entries
    .filter((entry) => entry.lastmod && isFuture(entry.lastmod, nowIso))
    .map((entry) => ({ loc: entry.loc, lastmod: entry.lastmod }));
}

export function findQueryParamLocs(entries) {
  return entries.filter((entry) => entry.loc.includes('?') || entry.loc.includes('#')).map((entry) => entry.loc);
}

export function findTurkishLocs(entries) {
  return entries.filter((entry) => hasTurkishChars(entry.loc)).map((entry) => entry.loc);
}

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function walkFiles(dir, out = []) {
  if (!isDir(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (isDir(full)) {
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

export function scanPathLanguage() {
  const errors = [];
  const roots = [SRC_DIR, SCRIPTS_DIR, GITHUB_DIR, PUBLIC_DIR];
  for (const root of roots) {
    const files = walkFiles(root);
    for (const file of files) {
      const rel = normalizePath(relative(ROOT, file));
      if (rel.split('/').some((segment) => hasTurkishChars(segment))) {
        errors.push(`dil guard: path Türkçe karakter içeriyor -> ${rel}`);
      }
    }
  }
  return errors;
}

export function noindexRoutes({ dist = DIST } = {}) {
  const routes = [];
  const files = walkFiles(dist).filter((file) => file.endsWith('index.html'));
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const m = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    if (m && m[1].toLowerCase().includes('noindex')) {
      const route = normalizePath(relative(dist, file)).replace(/\/index\.html$/, '');
      routes.push(route === '' ? `${SITE}/` : `${SITE}/${route}`);
    }
  }
  return routes;
}

export function validateChild(xml, { nowIso }) {
  const errors = [];
  if (!xml.includes('<urlset')) {
    errors.push('child <urlset> kökü eksik');
  }
  if (xml.includes('<changefreq>') || xml.includes('<priority>')) {
    errors.push('child sitemap changefreq/priority içeriyor (yasak)');
  }
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((block) => {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/);
    const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/);
    return { loc: loc ? loc[1].trim() : null, lastmod: lastmod ? lastmod[1].trim() : null };
  }).filter((entry) => entry.loc);
  if (entries.length === 0) errors.push('child sitemap 0 URL içeriyor');
  if (entries.length > MAX_URLS) errors.push(`child URL sayısı ${MAX_URLS} sınırını aşıyor: ${entries.length}`);
  for (const loc of findDuplicateUrls(entries)) errors.push(`duplicate URL: ${loc}`);
  for (const loc of findQueryParamLocs(entries)) errors.push(`query param canonical: ${loc}`);
  for (const loc of findTurkishLocs(entries)) errors.push(`dil guard: loc Türkçe karakter içeriyor -> ${loc}`);
  for (const entry of entries) {
    if (entry.lastmod && !isValidLastmod(entry.lastmod)) {
      errors.push(`geçersiz lastmod [${entry.lastmod}]: ${entry.loc}`);
    }
  }
  for (const { loc, lastmod } of findFutureLastmods(entries, nowIso)) {
    errors.push(`future lastmod [${lastmod}]: ${loc}`);
  }
  return { entries, errors };
}

export function validateIndex(xml, expectedLocs, { nowIso }) {
  const errors = [];
  const entries = [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)].map((block) => {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/);
    const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/);
    return { loc: loc ? loc[1].trim() : null, lastmod: lastmod ? lastmod[1].trim() : null };
  }).filter((entry) => entry.loc);
  const locs = entries.map((entry) => entry.loc);
  const expected = [...expectedLocs].sort((a, b) => a.localeCompare(b, 'en'));
  const actual = [...locs].sort((a, b) => a.localeCompare(b, 'en'));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    errors.push(`index child parity bozuk. beklenen: ${expected.join(', ')} | index: ${actual.join(', ')}`);
  }
  for (const loc of findDuplicateUrls(entries)) errors.push(`index duplicate child: ${loc}`);
  for (const entry of entries) {
    if (!entry.lastmod) {
      errors.push(`index child lastmod eksik: ${entry.loc}`);
      continue;
    }
    if (!isValidLastmod(entry.lastmod)) errors.push(`index geçersiz lastmod [${entry.lastmod}]: ${entry.loc}`);
  }
  for (const { loc, lastmod } of findFutureLastmods(entries, nowIso)) {
    errors.push(`index future lastmod [${lastmod}]: ${loc}`);
  }
  return { entries, errors };
}

export function runAllGates({ dist = DIST, nowIso = new Date().toISOString() } = {}) {
  const errors = [];
  if (!existsSync(join(dist, 'seo-artifacts.json'))) {
    return { errors: ['dist/seo-artifacts.json yok — generate-artifacts.mjs çalıştırılmadı'] };
  }
  const manifest = JSON.parse(readFileSync(join(dist, 'seo-artifacts.json'), 'utf8'));
  if (!Array.isArray(manifest.children) || manifest.children.length === 0) {
    return { errors: ['manifest child listesi boş'] };
  }

  const expectedLocs = new Set();
  const allUrlLocs = [];
  const blockedRoutes = noindexRoutes({ dist });

  for (const child of manifest.children) {
    const file = child.file;
    const path = join(dist, file);
    if (!existsSync(path)) {
      errors.push(`child dosyası yok: ${file}`);
      continue;
    }
    const bytes = readFileSync(path);
    if (bytes.length === 0) errors.push(`child boş: ${file}`);
    if (bytes.length > MAX_BYTES) errors.push(`child ${MAX_BYTES / 1024 / 1024}MB sınırını aşıyor: ${file}`);
    const xml = bytes.toString('utf8');
    const { entries, errors: childErrors } = validateChild(xml, { nowIso });
    for (const err of childErrors) errors.push(`${file}: ${err}`);
    expectedLocs.add(`${SITE}/${file}`);
    for (const entry of entries) allUrlLocs.push(entry.loc);
  }

  if (![...allUrlLocs].some((loc) => loc === `${SITE}/`)) {
    errors.push('homepage sitemap içinde yok');
  }
  for (const route of blockedRoutes) {
    if (allUrlLocs.includes(route)) {
      errors.push(`noindex sayfa sitemap'e sızmış: ${route}`);
    }
  }

  for (const llms of ['llms.txt', 'llms-full.txt']) {
    const path = join(dist, llms);
    if (!existsSync(path) || readFileSync(path, 'utf8').trim().length === 0) {
      errors.push(`${llms} dist içinde eksik/boş`);
    }
  }

  const indexPath = join(dist, 'sitemap.xml');
  if (existsSync(indexPath)) {
    const indexXml = readFileSync(indexPath, 'utf8');
    const { errors: indexErrors } = validateIndex(indexXml, expectedLocs, { nowIso });
    for (const err of indexErrors) errors.push(`index: ${err}`);
  }

  for (const err of scanPathLanguage()) errors.push(err);
  return { errors };
}

function normalizePath(p) {
  return p.split(sep).join('/');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? '')) {
  const { errors } = runAllGates();
  if (errors.length > 0) {
    console.error('SEO VALIDATION KALDI:');
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  console.log('SEO VALIDATION GEÇTİ — tüm kapılar temiz');
}
