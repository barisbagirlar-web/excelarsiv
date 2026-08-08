import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';

export const SITE_ORIGIN = 'https://excelarsiv.com';
export const DIST_DIR = resolve(process.cwd(), 'dist');
export const SRC_PAGES_DIR = resolve(process.cwd(), 'src/pages');
export const TEMPLATE_DIR = resolve(process.cwd(), 'src/content/templates');

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'ref',
]);

export function walkFiles(dir, predicate = () => true, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkFiles(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

export function extractAttr(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

export function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(stripTags(match[1])).trim() : '';
}

export function extractCanonical(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = extractAttr(tag, 'rel').toLowerCase().split(/\s+/);
    if (rel.includes('canonical')) return extractAttr(tag, 'href');
  }
  return '';
}

export function extractMeta(html, name) {
  const wanted = name.toLowerCase();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const metaName = extractAttr(tag, 'name').toLowerCase();
    if (metaName === wanted) return decodeHtml(extractAttr(tag, 'content')).trim();
  }
  return '';
}

export function extractDescription(html) {
  return extractMeta(html, 'description');
}

export function hasH1(html) {
  return /<h1(?:\s|>)/i.test(html);
}

export function hasJsonLd(html) {
  return /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
}

export function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ');
}

export function normalizeCanonical(raw) {
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw, SITE_ORIGIN);
  } catch {
    return '';
  }
  if (url.origin !== SITE_ORIGIN) return '';
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  if ([...url.searchParams.keys()].length > 0) return '';
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.toString();
}

export function discoverBuiltPages() {
  const files = walkFiles(DIST_DIR, (file) => extname(file) === '.html');
  const pages = [];
  const seen = new Map();

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const canonical = normalizeCanonical(extractCanonical(html));
    if (!canonical) continue;

    const robots = extractMeta(html, 'robots').toLowerCase();
    const indexable = !robots.split(',').map((x) => x.trim()).includes('noindex');
    const page = {
      file,
      html,
      canonical,
      pathname: new URL(canonical).pathname,
      title: extractTitle(html),
      description: extractDescription(html),
      robots,
      indexable,
      hasH1: hasH1(html),
      hasJsonLd: hasJsonLd(html),
    };

    const existing = seen.get(canonical);
    if (existing) {
      throw new Error(`DUPLICATE_CANONICAL: ${canonical}\n  ${relative(DIST_DIR, existing.file)}\n  ${relative(DIST_DIR, file)}`);
    }
    seen.set(canonical, page);
    pages.push(page);
  }

  return pages.sort((a, b) => a.canonical.localeCompare(b.canonical, 'tr'));
}

export function getTemplateRecords() {
  const records = new Map();
  const files = walkFiles(TEMPLATE_DIR, (file) => ['.md', '.mdx'].includes(extname(file)));
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const frontmatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;
    const fm = frontmatterMatch[1];
    const slug = basename(file, extname(file));
    const pick = (key) => {
      const match = fm.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
      if (!match) return '';
      return match[1].trim().replace(/^['"]|['"]$/g, '');
    };
    const record = {
      slug,
      file,
      name: pick('name'),
      summary: pick('summary'),
      category: pick('category'),
      priceTL: Number(pick('priceTL')) || null,
      vatIncluded: pick('vatIncluded') === 'true',
      fileFormat: pick('fileFormat'),
      version: pick('version'),
      updatedAt: pick('updatedAt'),
      sheetCount: Number(pick('sheetCount')) || null,
    };
    records.set(slug, record);
  }
  return records;
}

function sourceRoutePattern(file) {
  const rel = relative(SRC_PAGES_DIR, file).split(sep).join('/');
  if (!rel.endsWith('.astro')) return null;
  if (rel === '404.astro') return null;

  let route = '/' + rel.replace(/\.astro$/, '');
  route = route.replace(/\/index$/, '') || '/';

  const escaped = route
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (/^\[\.\.\..+\]$/.test(segment)) return '(.+)';
      if (/^\[.+\]$/.test(segment)) return '([^/]+)';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return { file, re: new RegExp(`^${escaped || '/'}$`) };
}

let pagePatterns;
function getPagePatterns() {
  if (pagePatterns) return pagePatterns;
  pagePatterns = walkFiles(SRC_PAGES_DIR, (file) => extname(file) === '.astro')
    .map(sourceRoutePattern)
    .filter(Boolean);
  return pagePatterns;
}

export function sourceForPath(pathname, templateRecords = getTemplateRecords()) {
  const product = pathname.match(/^\/sablon\/([^/]+)$/);
  if (product && templateRecords.has(product[1])) return templateRecords.get(product[1]).file;
  const match = getPagePatterns().find((item) => item.re.test(pathname));
  return match?.file ?? null;
}

export function gitLastModified(file) {
  if (!file || !existsSync(file)) return null;
  try {
    const rel = relative(process.cwd(), file);
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', rel], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  } catch {
    return null;
  }
}

export function semanticLastModified(page, templateRecords = getTemplateRecords()) {
  const product = page.pathname.match(/^\/sablon\/([^/]+)$/);
  if (product) {
    const record = templateRecords.get(product[1]);
    if (record?.updatedAt) {
      const parsed = new Date(`${record.updatedAt}T00:00:00.000Z`);
      if (!Number.isNaN(parsed.valueOf())) return parsed;
    }
  }
  return gitLastModified(sourceForPath(page.pathname, templateRecords));
}

export function assertNotFuture(date, label, skewMs = 5 * 60 * 1000) {
  if (!date) return;
  if (date.valueOf() > Date.now() + skewMs) {
    throw new Error(`FUTURE_LASTMOD: ${label} -> ${date.toISOString()}`);
  }
}

export function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function markdownEscape(value) {
  return String(value).replace(/([\\`*_{}\[\]()#+.!|>])/g, '\\$1');
}

export function humanPath(pathname) {
  if (pathname === '/') return 'Ana Sayfa';
  return pathname
    .split('/')
    .filter(Boolean)
    .at(-1)
    .split('-')
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ');
}
