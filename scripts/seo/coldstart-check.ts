import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, mergeDeep } from './preflight.ts';
import { evaluateColdStart } from './conformance-rules.ts';

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type ColdStartConfig = { thresholds: { coldStartMinDays: number } };
type Coverage = { availableDays: number };

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}
function siteArg(): string | undefined {
  const index = process.argv.indexOf('--site');
  return index >= 0 ? process.argv[index + 1] : process.env.SITE_ID;
}

const site = siteArg();
if (!site) {
  console.error('SITE_ID_MISSING');
  process.exit(EXIT.CONFIG);
}
const localPath = resolve(ROOT, `sites/${site}/seo.config.json`);
if (!existsSync(localPath)) {
  console.error(`SITE_CONFIG_MISSING: ${localPath}`);
  process.exit(EXIT.CONFIG);
}
const defaults = readJson<JsonObject>(resolve(ROOT, 'seo.config.defaults.json'));
const local = readJson<JsonObject>(localPath);
const config = mergeDeep(defaults, local) as unknown as ColdStartConfig;
const thresholdDays = config.thresholds.coldStartMinDays;
if (!Number.isInteger(thresholdDays) || thresholdDays < 1) {
  console.error('COLDSTART_THRESHOLD_INVALID');
  process.exit(EXIT.CONFIG);
}
const coveragePath = resolve(ROOT, `data/seo/gsc_coverage_${site}.json`);
if (!existsSync(coveragePath)) {
  console.error(`GSC_COVERAGE_MISSING: ${coveragePath}`);
  process.exit(EXIT.MISSING_DATA);
}
const coverage = readJson<Coverage>(coveragePath);
if (!Number.isInteger(coverage.availableDays) || coverage.availableDays < 0) {
  console.error('GSC_COVERAGE_INVALID');
  process.exit(EXIT.CONFIG);
}
const result = evaluateColdStart(coverage.availableDays, thresholdDays);
console.log(JSON.stringify({ siteId: site, availableDays: coverage.availableDays, ...result }));
process.exit(EXIT.PASS);
