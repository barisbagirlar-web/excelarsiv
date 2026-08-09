import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analytics } from '../../src/config/analytics.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CONFIG_PATH = 'src/config/analytics.ts';

const EVENT_CONTRACT = Object.freeze({
  templateView: Object.freeze({
    name: analytics.events.templateView,
    payload: Object.freeze(['templateId', 'categorySlug']),
    emitFiles: Object.freeze(['src/components/product/ProductHeroPremium.astro']),
  }),
  downloadStart: Object.freeze({
    name: analytics.events.downloadStart,
    payload: Object.freeze(['templateId', 'source']),
    emitFiles: Object.freeze(['src/components/DemoDownloadBox.astro', 'src/components/CheckoutPanel.astro', 'src/pages/teslimat.astro']),
  }),
  downloadComplete: Object.freeze({
    name: analytics.events.downloadComplete,
    payload: Object.freeze(['templateId', 'fileType']),
    emitFiles: Object.freeze(['src/components/DemoDownloadBox.astro', 'src/components/CheckoutPanel.astro', 'src/pages/teslimat.astro']),
  }),
  signup: Object.freeze({
    name: analytics.events.signup,
    payload: Object.freeze(['method']),
    emitFiles: Object.freeze(['src/components/DemoDownloadBox.astro']),
  }),
  checkoutIntent: Object.freeze({
    name: analytics.events.checkoutIntent,
    payload: Object.freeze(['packId']),
    emitFiles: Object.freeze(['src/components/CheckoutPanel.astro']),
  }),
});

type EventKey = keyof typeof EVENT_CONTRACT;
type EventMapRow = {
  key: EventKey;
  name: string;
  payload: readonly string[];
  emitFiles: readonly string[];
};

function walk(path: string): string[] {
  const absolute = resolve(ROOT, path);
  const entries = readdirSync(absolute);
  const files: string[] = [];
  for (const entry of entries) {
    const child = resolve(absolute, entry);
    if (statSync(child).isDirectory()) files.push(...walk(relative(ROOT, child)));
    else files.push(relative(ROOT, child).replaceAll('\\', '/'));
  }
  return files;
}

function quotedLiteralPattern(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`['\"]${escaped}['\"]`);
}

function buildEventMap(): EventMapRow[] {
  return (Object.keys(EVENT_CONTRACT) as EventKey[]).map((key) => ({ key, ...EVENT_CONTRACT[key] }));
}

function validateEventContract(): string[] {
  const errors: string[] = [];
  const rows = buildEventMap();
  const eventNames = rows.map((row) => row.name);
  if (new Set(eventNames).size !== eventNames.length) errors.push('EVENT_NAME_DUPLICATE');

  for (const row of rows) {
    for (const file of row.emitFiles) {
      const source = readFileSync(resolve(ROOT, file), 'utf8');
      if (!source.includes(`analytics.events.${row.key}`)) errors.push(`${row.name}:EMIT_MISSING:${file}`);
      for (const field of row.payload) if (!source.includes(field)) errors.push(`${row.name}:PAYLOAD_FIELD_MISSING:${field}:${file}`);
    }
  }

  const runtimeSources = walk('src').filter((file) => /\.(astro|ts|js|mjs|cjs)$/.test(file) && file !== CONFIG_PATH);
  for (const file of runtimeSources) {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    for (const row of rows) {
      if (quotedLiteralPattern(row.name).test(source)) errors.push(`${row.name}:STRING_LITERAL_OUTSIDE_CONFIG:${file}`);
    }
  }
  return errors;
}

function main(): void {
  const rows = buildEventMap();
  console.log('GA4 EVENT MAP');
  for (const row of rows) {
    console.log(`${row.name} | {${row.payload.join(',')}} | ${row.emitFiles.join(',')}`);
  }
  const errors = validateEventContract();
  if (errors.length) {
    for (const error of errors) console.error(`FAIL ${error}`);
    process.exit(1);
  }
  console.log(`GA4 EVENT CONTRACT PASS — ${rows.length} olay, literal drift=0`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EVENT_CONTRACT, buildEventMap, validateEventContract };
