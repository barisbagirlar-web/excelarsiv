// Sitemap-index finalizer.
// Generated child hashes are compared with a semantically consistent production baseline.
// Baseline acceptance requires two consecutive identical valid snapshots.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST_DIR, SITE_ORIGIN } from './lib.mjs';

const RETRY_ATTEMPTS = 8;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 5_000;
const MAX_UNAPPROVED_DROP_RATIO = 0.20;
const FUTURE_GRACE_MS = 5 * 60 * 1000;
const INDEX_LASTMOD_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MIGRATION_MARKER = '[sitemap-migration]';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function parseSitemapIndex(xml) {
  return [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)]
    .map((block) => {
      const loc = block[1].match(/<loc>([^<]+)<\/loc>/);
      const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/);
      return { loc: loc ? loc[1].trim() : null, lastmod: lastmod ? lastmod[1].trim() : null };
    })
    .filter((entry) => entry.loc);
}

export function parseUrlset(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((block) => {
      const loc = block[1].match(/<loc>([^<]+)<\/loc>/);
      const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/);
      return { loc: loc ? loc[1].trim() : null, lastmod: lastmod ? lastmod[1].trim() : null };
    })
    .filter((entry) => entry.loc);
}

export function renderIndex(children) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const child of children) {
    lines.push('  <sitemap>');
    lines.push(`    <loc>${child.loc}</loc>`);
    if (child.lastmod) lines.push(`    <lastmod>${child.lastmod}</lastmod>`);
    lines.push('  </sitemap>');
  }
  lines.push('</sitemapindex>');
  return lines.join('\n');
}

export function calculateUrlDelta(generatedEntries, liveEntries) {
  const generated = new Map(generatedEntries.map((entry) => [entry.loc, entry]));
  const live = new Map(liveEntries.map((entry) => [entry.loc, entry]));
  const added = [];
  const changed = [];
  const removed = [];
  for (const [loc, entry] of generated) {
    const before = live.get(loc);
    if (!before) added.push(loc);
    else if ((before.lastmod ?? null) !== (entry.lastmod ?? null)) changed.push(loc);
  }
  for (const loc of live.keys()) if (!generated.has(loc)) removed.push(loc);
  return {
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
    changedOrNew: [...new Set([...added, ...changed])].sort(),
  };
}

export function assertSafeShrink({ generatedCount, liveCount, allowShrink = false, maxDropRatio = MAX_UNAPPROVED_DROP_RATIO }) {
  if (!Number.isFinite(generatedCount) || generatedCount < 0 || !Number.isFinite(liveCount) || liveCount < 0) {
    throw new Error('SITEMAP_COUNT_INVALID');
  }
  if (liveCount === 0 || generatedCount >= liveCount) return { dropRatio: 0, approved: true };
  const dropRatio = (liveCount - generatedCount) / liveCount;
  if (dropRatio > maxDropRatio && !allowShrink) {
    throw new Error(`SITEMAP_SUDDEN_SHRINK: live=${liveCount} generated=${generatedCount} drop=${(dropRatio * 100).toFixed(2)}% > ${(maxDropRatio * 100).toFixed(0)}%. İnsan onayı olmadan deploy yasak.`);
  }
  return { dropRatio, approved: allowShrink || dropRatio <= maxDropRatio };
}

export function decideIndex(children, liveIndexMap, { nowIso, migration = false }) {
  const decisions = [];
  for (const child of children) {
    const live = liveIndexMap.get(child.loc);
    let status;
    let lastmod;
    let action;
    if (migration) {
      status = 'CHANGED'; action = 'SET_NOW'; lastmod = nowIso;
    } else if (!live) {
      status = 'NEW'; action = 'SET_NOW'; lastmod = nowIso;
    } else if (live.sha256 === child.sha256) {
      if (!live.lastmod) throw new Error(`BASELINE_UNKNOWN: canlı index child lastmod eksik: ${child.loc}`);
      status = 'UNCHANGED'; action = 'PRESERVE'; lastmod = live.lastmod;
    } else {
      status = 'CHANGED'; action = 'SET_NOW'; lastmod = nowIso;
    }
    decisions.push({
      loc: child.loc,
      file: child.file,
      status,
      lastmod,
      lastmodAction: action,
      live_sha256: live ? live.sha256 : null,
      generated_sha256: child.sha256,
    });
  }
  decisions.sort((a, b) => a.loc.localeCompare(b.loc, 'en'));
  const removed = [...liveIndexMap.keys()].filter((loc) => !children.some((child) => child.loc === loc));
  const indexXml = renderIndex(decisions.map((d) => ({ loc: d.loc, lastmod: d.lastmod })));
  return { indexXml, decisions, removed };
}

export function migrationAuthorizedFromMessage(message) {
  return String(message ?? '').toLowerCase().includes(MIGRATION_MARKER);
}

export function migrationAuthorizedFromHead({ env = process.env, cwd = process.cwd() } = {}) {
  if (env.SEO_SITEMAP_INDEX_MIGRATION === '1') return true;
  try {
    const message = execFileSync('git', ['log', '-1', '--format=%B'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return migrationAuthorizedFromMessage(message);
  } catch {
    return false;
  }
}

export function validateBaselineIndexEntries(entries, {
  baseUrl = SITE_ORIGIN,
  nowMs = Date.now(),
  allowMissingLastmod = false,
} = {}) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('BASELINE_UNKNOWN: canlı index geçersiz/boş.');
  const seen = new Set();
  for (const entry of entries) {
    if (!entry?.loc || seen.has(entry.loc)) throw new Error(`BASELINE_UNKNOWN: canlı index child loc geçersiz/duplicate: ${entry?.loc ?? '-'}`);
    seen.add(entry.loc);
    if (!entry.loc.startsWith(`${baseUrl}/`)) throw new Error(`BASELINE_UNKNOWN: canlı index external child: ${entry.loc}`);
    if (!entry.lastmod) {
      if (allowMissingLastmod) continue;
      throw new Error(`BASELINE_UNKNOWN: canlı index child lastmod eksik/geçersiz: ${entry.loc}`);
    }
    if (!INDEX_LASTMOD_RE.test(entry.lastmod) || Number.isNaN(Date.parse(entry.lastmod))) {
      throw new Error(`BASELINE_UNKNOWN: canlı index child lastmod eksik/geçersiz: ${entry.loc}`);
    }
    if (Date.parse(entry.lastmod) > nowMs + FUTURE_GRACE_MS) throw new Error(`BASELINE_UNKNOWN: canlı index child future lastmod: ${entry.loc}`);
  }
  return true;
}

export function baselineSnapshotFingerprint(snapshot) {
  if (snapshot?.kind === 'missing') return 'MISSING:404';
  const children = [...(snapshot?.baseline?.index?.children ?? [])]
    .map((child) => ({ loc: child.loc, lastmod: child.lastmod, sha256: child.sha256, urlCount: child.urlCount }))
    .sort((a, b) => a.loc.localeCompare(b.loc, 'en'));
  return sha256(Buffer.from(JSON.stringify(children), 'utf8'));
}

async function fetchOnce(url, { timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/xml,text/xml,*/*', 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (res.status === 404) return { status: 404, text: '' };
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${url}`);
    const text = await res.text();
    if (!text.trim()) throw new Error(`boş baseline: ${url}`);
    return { status: 200, text };
  } finally {
    clearTimeout(timer);
  }
}

async function readBaselineSnapshot({ baseUrl, timeoutMs, allowMissingLastmod }) {
  const indexRes = await fetchOnce(`${baseUrl}/sitemap.xml`, { timeoutMs });
  if (indexRes.status === 404) return { kind: 'missing', baseline: { index: { children: [] } } };
  const entries = parseSitemapIndex(indexRes.text);
  validateBaselineIndexEntries(entries, { baseUrl, allowMissingLastmod });
  const children = [];
  for (const entry of entries) {
    const res = await fetchOnce(entry.loc, { timeoutMs });
    if (res.status !== 200) throw new Error(`BASELINE_UNKNOWN: child okunamadı HTTP ${res.status}: ${entry.loc}`);
    const urlEntries = parseUrlset(res.text);
    if (urlEntries.length === 0) throw new Error(`BASELINE_UNKNOWN: child 0 URL/geçersiz: ${entry.loc}`);
    children.push({
      loc: entry.loc,
      lastmod: entry.lastmod,
      sha256: sha256(Buffer.from(res.text, 'utf8')),
      urlCount: urlEntries.length,
      entries: urlEntries,
    });
  }
  children.sort((a, b) => a.loc.localeCompare(b.loc, 'en'));
  return { kind: 'ready', baseline: { index: { children } } };
}

export async function fetchLiveBaseline({
  baseUrl = SITE_ORIGIN,
  logger = console,
  attempts = RETRY_ATTEMPTS,
  timeoutMs = REQUEST_TIMEOUT_MS,
  delayMs = RETRY_DELAY_MS,
  allowMissingLastmod = false,
}) {
  let previousFingerprint = null;
  let previousSnapshot = null;
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const snapshot = await readBaselineSnapshot({ baseUrl, timeoutMs, allowMissingLastmod });
      const fingerprint = baselineSnapshotFingerprint(snapshot);
      if (previousFingerprint === fingerprint && previousSnapshot?.kind === snapshot.kind) {
        if (snapshot.kind === 'missing') logger.log(`BASELINE: iki ardışık 404 doğrulandı (${attempt - 1}-${attempt}) — tüm child NEW.`);
        else {
          const children = snapshot.baseline.index.children;
          logger.log(`BASELINE: iki ardışık tutarlı snapshot doğrulandı (${attempt - 1}-${attempt}); ${children.length} child / ${children.reduce((sum, child) => sum + child.urlCount, 0)} URL.`);
        }
        return snapshot.baseline;
      }
      previousFingerprint = fingerprint;
      previousSnapshot = snapshot;
      lastError = new Error('BASELINE_SNAPSHOT_NOT_YET_STABLE');
      logger.log(`BASELINE RETRY ${attempt}/${attempts}: geçerli snapshot görüldü; ikinci aynı snapshot bekleniyor.`);
    } catch (err) {
      previousFingerprint = null;
      previousSnapshot = null;
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.log(`BASELINE RETRY ${attempt}/${attempts}: ${lastError.message}`);
    }
    if (attempt < attempts) await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`BASELINE_UNKNOWN: ${attempts} denemede iki ardışık tutarlı production snapshot doğrulanamadı. Son durum: ${lastError?.message ?? 'bilinmeyen hata'}`);
}

export function loadBaselineFile(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  if (!parsed?.index?.children) throw new Error(`geçersiz baseline dosyası: ${file}`);
  return parsed;
}

function buildLiveIndexMap(baseline) {
  return new Map(baseline.index.children.map((child) => [child.loc, child]));
}

function atomicWriteIndex(indexXml, dist) {
  const tmp = join(dist, 'sitemap.xml.tmp');
  const final = join(dist, 'sitemap.xml');
  writeFileSync(tmp, indexXml);
  if (readFileSync(tmp, 'utf8') !== indexXml) throw new Error('ATOMIC WRITE FAIL: temp dosya geri okumada uyuşmuyor.');
  if (parseSitemapIndex(indexXml).length === 0) throw new Error('ATOMIC WRITE FAIL: index geçersiz (child yok).');
  renameSync(tmp, final);
}

export async function finalize({
  baseline,
  nowIso,
  migration = false,
  logger = console,
  dist = DIST_DIR,
  site = SITE_ORIGIN,
  allowShrink = process.env.SEO_ALLOW_SITEMAP_SHRINK === '1',
}) {
  const manifestFile = join(dist, 'seo-artifacts.json');
  if (!existsSync(manifestFile)) throw new Error('dist/seo-artifacts.json yok. Önce generate-artifacts.mjs çalıştırın.');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const children = manifest.children.map((child) => {
    const xml = readFileSync(join(dist, child.file), 'utf8');
    return {
      file: child.file,
      loc: `${site}/${child.file}`,
      sha256: child.sha256,
      urlCount: parseUrlset(xml).length,
      entries: parseUrlset(xml),
    };
  });
  const liveEntries = baseline.index.children.flatMap((child) => child.entries ?? []);
  const generatedEntries = children.flatMap((child) => child.entries);
  const shrink = assertSafeShrink({ generatedCount: generatedEntries.length, liveCount: liveEntries.length, allowShrink });
  const urlDelta = calculateUrlDelta(generatedEntries, liveEntries);
  const { indexXml, decisions, removed } = decideIndex(children, buildLiveIndexMap(baseline), { nowIso, migration });
  atomicWriteIndex(indexXml, dist);
  const report = {
    status: 'PASS',
    finalizedAt: nowIso,
    migrationReset: migration,
    shrinkApproval: {
      liveUrlCount: liveEntries.length,
      generatedUrlCount: generatedEntries.length,
      dropRatio: shrink.dropRatio,
      explicitOverride: allowShrink,
    },
    urlDelta,
    children: decisions,
    removed,
  };
  writeFileSync(join(dist, 'seo-finalize-report.json'), JSON.stringify(report, null, 2));
  logger.log('SITEMAP INDEX SEMANTIC CONTRACT');
  logger.log(`URL COUNT: live=${liveEntries.length} generated=${generatedEntries.length} drop=${(shrink.dropRatio * 100).toFixed(2)}%`);
  logger.log(`URL DELTA: +${urlDelta.added.length} changed=${urlDelta.changed.length} -${urlDelta.removed.length}`);
  for (const d of decisions) {
    logger.log(`${d.file}`);
    logger.log(`  status          : ${d.status}`);
    logger.log(`  live_sha256     : ${d.live_sha256 ?? '-'}`);
    logger.log(`  generated_sha256: ${d.generated_sha256}`);
    logger.log(`  lastmod_action  : ${d.lastmodAction}`);
    logger.log(`  lastmod         : ${d.lastmod}`);
  }
  for (const loc of urlDelta.changedOrNew) logger.log(`CHANGED_OR_NEW_URL: ${loc}`);
  for (const loc of urlDelta.removed) logger.log(`REMOVED_URL: ${loc}`);
  for (const loc of removed) logger.log(`REMOVED_CHILD: ${loc}`);
  logger.log(`SITEMAP INDEX YAZILDI: ${join(dist, 'sitemap.xml')}`);
  return report;
}

function writeFailureReport(error, { migration, dist = DIST_DIR }) {
  if (!existsSync(dist)) return;
  const report = {
    status: 'FAIL',
    failedAt: new Date().toISOString(),
    migrationReset: migration,
    error: error instanceof Error ? error.message : String(error),
  };
  writeFileSync(join(dist, 'seo-finalize-report.json'), JSON.stringify(report, null, 2));
}

async function main() {
  const baselineFile = process.env.SEO_SITEMAP_BASELINE_FILE;
  const migration = migrationAuthorizedFromHead();
  const nowIso = new Date().toISOString();
  try {
    if (migration) console.log(`SITEMAP MIGRATION AUTHORIZED: ${process.env.SEO_SITEMAP_INDEX_MIGRATION === '1' ? 'explicit env' : MIGRATION_MARKER}`);
    const baseline = baselineFile
      ? loadBaselineFile(baselineFile)
      : await fetchLiveBaseline({ baseUrl: SITE_ORIGIN, allowMissingLastmod: migration });
    if (baselineFile) console.log(`BASELINE: dosyadan okundu — ${relative(process.cwd(), baselineFile)}`);
    await finalize({ baseline, nowIso, migration });
    console.log('SEO FINALIZER GEÇTİ');
  } catch (error) {
    writeFailureReport(error, { migration });
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`SEO FINALIZER KALDI: ${msg}`);
    if (msg.startsWith('BASELINE_UNKNOWN')) console.error('Production baseline belirsiz — DEPLOY FAIL. Last Known Good korunur.');
    process.exit(msg.startsWith('BASELINE_UNKNOWN') ? 2 : 1);
  }
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main().catch((error) => { console.error(`SEO FINALIZER KALDI: ${error instanceof Error ? error.message : error}`); process.exit(1); });
