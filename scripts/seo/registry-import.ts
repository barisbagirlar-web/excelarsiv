import { createHash } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { materialize, validateRecords } from './registry-validate.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
type JsonRecord = Record<string, unknown>;
type Registry = { meta: JsonRecord; mode: string; source: JsonRecord; recordDefaults: JsonRecord; records: JsonRecord[] };
function arg(name: string): string | undefined { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }
const site = arg('--site') ?? process.env.SITE_ID;
if (!site) process.exit(4);
const path = resolve(ROOT, `data/seo/registry/${site}_seo_registry.json`);
const registry = JSON.parse(readFileSync(path, 'utf8')) as Registry;
const records = materialize(registry).sort((a,b) => String(a.route).localeCompare(String(b.route), 'tr'));
const errors = validateRecords(records);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const normalized = { ...registry, records: registry.records.slice().sort((a,b) => String(a.route).localeCompare(String(b.route), 'tr')) };
const bytes = `${JSON.stringify(normalized, null, 2)}\n`;
const hash = createHash('sha256').update(bytes).digest('hex');
console.log(`SEO REGISTRY IMPORT DRY-RUN — ${records.length} kayıt — sha256 ${hash}`);
if (process.argv.includes('--write')) {
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, bytes, 'utf8');
  renameSync(tmp, path);
  console.log('SEO REGISTRY WRITE — atomik tamamlandı');
}
process.exit(0);
