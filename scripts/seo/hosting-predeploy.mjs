// Firebase Hosting deploy gate.
// Any hosting deploy path (CI, local Firebase CLI, future automation) must carry a
// finalized sitemap index. If the current dist was already finalized against the
// generated child hashes, only validation is repeated; otherwise finalization runs.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR } from './lib.mjs';
import { parseSitemapIndex } from './finalize-sitemap-index.mjs';

function run(script) {
  // firebase CLI'nin paketli node'u ESM'i require edemediği için predeploy
  // sarmalayıcısı gerçek sistem node'unu PREDEPLOY_NODE olarak geçer.
  const node = process.env.PREDEPLOY_NODE || process.execPath;
  const result = spawnSync(node, [script], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function finalizedBuildMatches({ dist = DIST_DIR } = {}) {
  const manifestPath = join(dist, 'seo-artifacts.json');
  const reportPath = join(dist, 'seo-finalize-report.json');
  const indexPath = join(dist, 'sitemap.xml');
  if (![manifestPath, reportPath, indexPath].every(existsSync)) return false;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (report.status !== 'PASS' || !Array.isArray(report.children) || !Array.isArray(manifest.children)) return false;
    const generated = new Map(manifest.children.map((child) => [child.file, child.sha256]));
    if (report.children.length !== generated.size) return false;
    for (const child of report.children) {
      if (!child.file || generated.get(child.file) !== child.generated_sha256 || !child.lastmod) return false;
    }
    const indexEntries = parseSitemapIndex(readFileSync(indexPath, 'utf8'));
    if (indexEntries.length !== generated.size || indexEntries.some((entry) => !entry.lastmod)) return false;
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(join(DIST_DIR, 'seo-artifacts.json'))) {
    console.error('HOSTING PREDEPLOY KALDI: dist/seo-artifacts.json yok. Önce npm run build çalıştırılmalı.');
    process.exit(1);
  }
  if (finalizedBuildMatches()) {
    console.log('HOSTING PREDEPLOY: mevcut dist aynı child hashleriyle zaten finalized; yeniden baseline zamanı üretilmedi.');
  } else {
    console.log('HOSTING PREDEPLOY: finalized build kanıtı yok/stale; production baseline finalizer çalıştırılıyor.');
    run('scripts/seo/finalize-sitemap-index.mjs');
  }
  run('scripts/seo/validate-artifacts.mjs');
  console.log('HOSTING PREDEPLOY PASS — finalized sitemap + artifact validation');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
