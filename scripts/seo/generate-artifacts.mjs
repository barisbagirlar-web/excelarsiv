// Deterministik child sitemap üretimi.
// Astro build sonrası dist/ HTML'lerinden canonical sayfaları keşfeder,
// sitemap-pages.xml ve sitemap-products.xml üretir, URL seviyesinde semantic
// lastmod atar, her child için SHA-256 hesaplar ve manifest yazar.
// Aynı girdi -> aynı byte çıktısı -> aynı SHA-256 (madde 5-6).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DIST = join(ROOT, 'dist');
const PAGES_DIR = join(ROOT, 'src', 'pages');
const TEMPLATES_DIR = join(ROOT, 'src', 'content', 'templates');
const PUBLIC_DIR = join(ROOT, 'public');
const SITE = 'https://excelarsiv.com';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function walkHtmlDirs(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (isDir(full)) {
      walkHtmlDirs(full, out);
    } else if (entry === 'index.html') {
      out.push(dir);
    }
  }
  return out;
}

// Kaynak .astro dosyasını route'a göre bulur; [param] segmentlerini destekler.
function findSource(route, dir = PAGES_DIR) {
  const segs = route.split('/').filter(Boolean);
  const direct = join(dir, ...segs) + '.astro';
  if (existsSync(direct)) return direct;
  const directIndex = join(dir, ...segs, 'index.astro');
  if (existsSync(directIndex)) return directIndex;
  if (segs.length === 0) return null;
  const [head, ...rest] = segs;
  const headDir = join(dir, head);
  if (isDir(headDir)) {
    const found = findSource(rest.join('/'), headDir);
    if (found) return found;
  }
  for (const entry of readdirSync(dir)) {
    if (!isDir(join(dir, entry)) || !/^\[[^\]]+\]$/.test(entry)) continue;
    const found = findSource(rest.join('/'), join(dir, entry));
    if (found) return found;
  }
  for (const entry of readdirSync(dir)) {
    if (isDir(join(dir, entry)) || !/^\[[^\]]+\]\.astro$/.test(entry)) continue;
    return join(dir, entry);
  }
  return null;
}

function gitCommitTime(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return null;
    const iso = new Date(out).toISOString();
    return ISO_RE.test(iso) ? iso : null;
  } catch {
    return null;
  }
}

function frontmatterValue(file, key) {
  try {
    const src = readFileSync(file, 'utf8');
    const m = src.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm'));
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

export function renderUrlset(entries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const e of entries) {
    lines.push('  <url>');
    lines.push(`    <loc>${e.loc}</loc>`);
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizePath(p) {
  return p.split(sep).join('/');
}

export function generateArtifacts() {
  if (!isDir(DIST)) {
    throw new Error(`dist/ bulunamadı: ${DIST}. Önce "astro build" çalıştırın.`);
  }

  const htmlDirs = walkHtmlDirs(DIST);
  const routes = htmlDirs
    .map((dir) => normalizePath(relative(DIST, dir)))
    .filter((route) => route !== '404' && route !== 'demo' && !route.startsWith('demo/') && !route.startsWith('og'));

  const pages = [];
  const products = [];
  for (const route of routes) {
    const loc = route === '' ? `${SITE}/` : `${SITE}/${route}`;
    let lastmod = null;
    if (route.startsWith('sablon/')) {
      const slug = route.slice('sablon/'.length);
      const mdx = join(TEMPLATES_DIR, `${slug}.mdx`);
      if (existsSync(mdx)) {
        const updatedAt = frontmatterValue(mdx, 'updatedAt');
        if (updatedAt && DATE_RE.test(updatedAt)) lastmod = updatedAt;
      }
      products.push({ loc, lastmod });
    } else {
      const source = findSource(route);
      if (source) lastmod = gitCommitTime(source);
      pages.push({ loc, lastmod });
    }
  }

  const sortEntries = (entries) => entries.sort((a, b) => a.loc.localeCompare(b.loc, 'en'));

  const pagesEntries = sortEntries(pages);
  const productsEntries = sortEntries(products);

  const children = [
    { file: 'sitemap-pages.xml', entries: pagesEntries },
    { file: 'sitemap-products.xml', entries: productsEntries },
  ];

  const manifestChildren = [];
  for (const child of children) {
    const xml = renderUrlset(child.entries);
    const hash = sha256(Buffer.from(xml, 'utf8'));
    writeFileSync(join(DIST, child.file), xml);
    manifestChildren.push({
      file: child.file,
      urlCount: child.entries.length,
      sha256: hash,
    });
  }

  for (const llms of ['llms.txt', 'llms-full.txt']) {
    if (!existsSync(join(DIST, llms)) && existsSync(join(PUBLIC_DIR, llms))) {
      copyFileSync(join(PUBLIC_DIR, llms), join(DIST, llms));
    }
  }

  const manifest = { site: SITE, children: manifestChildren };
  writeFileSync(join(DIST, 'seo-artifacts.json'), JSON.stringify(manifest, null, 2));

  for (const c of manifestChildren) {
    console.log(`${c.file}\tsha256=${c.sha256}\turlCount=${c.urlCount}`);
  }
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? '')) {
  try {
    const manifest = generateArtifacts();
    console.log(`SEO ARTIFACTS GEÇTİ — ${manifest.children.length} child, ${manifest.children.reduce((s, c) => s + c.urlCount, 0)} URL`);
  } catch (err) {
    console.error(`SEO ARTIFACTS KALDI: ${err.message}`);
    process.exit(1);
  }
}
