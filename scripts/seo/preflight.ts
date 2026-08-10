import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type CheckStatus = 'PASS' | 'FAIL';
type Check = { id: string; status: CheckStatus; msg: string; code: number };
type PhaseContract = { writes: string[]; forbidsWrites?: string[] };
type Progress = { bootstrap: 'active' | 'completed'; activePhase: number | null; completedPhases: number[]; profile: 'S' | 'M' | 'L'; siteId: string };
type ParsedArgs = { site?: string; contractOverride?: string };
type SeoConfig = {
  site: { siteId: string };
  measurement: { dataWindowStart: string };
  economics: { budgetSplit: { investPct: number; holdPct: number; harvestPct: number; divestPct: number } };
};
type InvariantRecord = { id: string };

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DATE_FLOOR = '2025-09-11';
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, WARN: 2, MISSING_DATA: 3, CONFIG: 4 });
const BRANCH_CONTRACTS: Readonly<Record<string, string>> = Object.freeze({
  'seo/ga4-events': 'wave2-a1',
  'seo/consent': 'wave2-a2',
  'seo/breaks-seed': 'wave2-a3',
  'seo/demand-seed': 'wave2-b1',
  'seo/launch-catalog': 'wave2-b2',
  'seo/link-graph': 'wave2-c1',
  'seo/staging-proof': 'wave2-c2',
  'seo/registry-refresh-wave2': 'faz-01',
  'seo/sitemap-enterprise': 'faz-03',
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as T;
}
function mergeDeep(base: JsonValue, override: JsonValue): JsonValue {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (isRecord(base) && isRecord(override)) {
    const out: JsonObject = { ...(base as JsonObject) };
    for (const [key, value] of Object.entries(override)) {
      const current = out[key];
      out[key] = current === undefined ? value as JsonValue : mergeDeep(current, value as JsonValue);
    }
    return out;
  }
  return override ?? base;
}
function parseArgs(argv: string[]): ParsedArgs {
  const siteIndex = argv.indexOf('--site');
  const contractIndex = argv.indexOf('--contract-test');
  const site = siteIndex >= 0 ? argv[siteIndex + 1] : process.env.SITE_ID;
  const contractOverride = contractIndex >= 0 ? argv[contractIndex + 1] : undefined;
  if (contractOverride && process.env.SEO_CONFORMANCE_TEST !== '1') throw new Error('CONTRACT_OVERRIDE_TEST_ONLY');
  return { ...(site ? { site } : {}), ...(contractOverride ? { contractOverride } : {}) };
}
function progress(): Progress {
  const text = readFileSync(resolve(ROOT, 'docs/seo/PROGRESS.md'), 'utf8');
  const match = text.match(/<!--\s*SEO_PROGRESS\s+(\{[^\n]+\})\s*-->/);
  if (!match?.[1]) throw new Error('PROGRESS_META_MISSING');
  return JSON.parse(match[1]) as Progress;
}
function typeOk(value: unknown, type: unknown): boolean {
  if (Array.isArray(type)) return type.some((item) => typeOk(value, item));
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'object') return isRecord(value);
  return typeof value === type;
}
function validateSchema(value: unknown, schema: Record<string, unknown>, path = '$'): string[] {
  const errors: string[] = [];
  if (schema.type !== undefined && !typeOk(value, schema.type)) return [`${path}: type`];
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path}: const`);
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => Object.is(item, value))) errors.push(`${path}: enum`);
  if (typeof value === 'string') {
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: pattern`);
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) errors.push(`${path}: minLength`);
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) errors.push(`${path}: maxLength`);
    if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push(`${path}: date format`);
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${path}: minimum`);
    if (typeof schema.maximum === 'number' && value > schema.maximum) errors.push(`${path}: maximum`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path}: minItems`);
    if (schema.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${path}: uniqueItems`);
    if (isRecord(schema.items)) value.forEach((item, index) => errors.push(...validateSchema(item, schema.items, `${path}[${index}]`)));
  }
  if (isRecord(value)) {
    if (Array.isArray(schema.required)) for (const key of schema.required) if (typeof key === 'string' && !(key in value)) errors.push(`${path}.${key}: required`);
    const properties = isRecord(schema.properties) ? schema.properties : {};
    for (const [key, subSchema] of Object.entries(properties)) if (key in value && isRecord(subSchema)) errors.push(...validateSchema(value[key], subSchema, `${path}.${key}`));
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(properties));
      for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key}: additionalProperties`);
    } else if (isRecord(schema.additionalProperties)) {
      const known = new Set(Object.keys(properties));
      for (const [key, child] of Object.entries(value)) if (!known.has(key)) errors.push(...validateSchema(child, schema.additionalProperties, `${path}.${key}`));
    }
  }
  if (isRecord(schema.not) && validateSchema(value, schema.not, path).length === 0) errors.push(`${path}: not`);
  return errors;
}
function scanPlaceholders(value: unknown, path = '$', out: string[] = []): string[] {
  if (typeof value === 'string' && value.includes('|')) out.push(path);
  else if (Array.isArray(value)) value.forEach((item, index) => scanPlaceholders(item, `${path}[${index}]`, out));
  else if (isRecord(value)) for (const [key, child] of Object.entries(value)) scanPlaceholders(child, `${path}.${key}`, out);
  return out;
}
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*');
  return new RegExp(`^${escaped}$`);
}
function matchAny(path: string, patterns: string[]): boolean {
  return patterns.some((glob) => globToRegExp(glob).test(path));
}
function changedFiles(): string[] {
  if (process.env.SEO_CHANGED_FILES) return process.env.SEO_CHANGED_FILES.split(',').map((item) => item.trim()).filter(Boolean);
  const base = process.env.GITHUB_BASE_REF;
  const args = base ? ['diff', '--name-only', `origin/${base}...HEAD`] : ['diff', '--name-only', 'HEAD'];
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
}
function currentBranch(): string {
  return process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? '';
}
function branchContractKey(branch = currentBranch()): string | null {
  const phaseMatch = branch.match(/^seo\/faz-(\d{2})-/);
  if (phaseMatch?.[1]) return `faz-${phaseMatch[1]}`;
  if (branch === 'seo/bootstrap-v6') return 'bootstrap';
  if (branch.startsWith('seo/governance-')) return 'governance';
  return BRANCH_CONTRACTS[branch] ?? null;
}
function shouldEnforcePhaseContract(branch: string, contractOverride?: string): boolean {
  return Boolean(contractOverride) || branch === '' || branch.startsWith('seo/');
}
function phaseContract(state: Progress, contractOverride?: string, branch = currentBranch()): PhaseContract | null {
  const contracts = readJson<JsonObject>('PHASE_CONTRACTS.json') as Record<string, unknown>;
  const branchKey = branchContractKey(branch);
  const fallbackKey = branch === ''
    ? (state.activePhase === null && (state.bootstrap === 'active' || state.bootstrap === 'completed')
      ? 'bootstrap'
      : Number.isInteger(state.activePhase)
        ? `faz-${String(state.activePhase).padStart(2, '0')}`
        : null)
    : null;
  const key = contractOverride ?? branchKey ?? fallbackKey;
  if (!key || !isRecord(contracts[key])) return null;
  const raw = contracts[key];
  const writes = Array.isArray(raw.writes) ? raw.writes.filter((item): item is string => typeof item === 'string') : [];
  const forbidsWrites = Array.isArray(raw.forbidsWrites) ? raw.forbidsWrites.filter((item): item is string => typeof item === 'string') : [];
  return { writes, forbidsWrites };
}
function secretHits(files: string[]): string[] {
  const patterns = [/github_pat_[A-Za-z0-9_]{20,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bAKIA[0-9A-Z]{16}\b/, /\bAIza[0-9A-Za-z_-]{20,}\b/, /\bsk-[A-Za-z0-9]{20,}\b/];
  const hits: string[] = [];
  for (const file of files) {
    const absolute = resolve(ROOT, file);
    if (!existsSync(absolute) || /\.(xlsx|png|jpe?g|gif|webp|pdf)$/i.test(file)) continue;
    const text = readFileSync(absolute, 'utf8');
    for (const pattern of patterns) if (pattern.test(text)) hits.push(`${file}:${pattern.source}`);
  }
  return hits;
}
function mandateInvariantIds(): string[] {
  const text = readFileSync(resolve(ROOT, 'docs/seo/MANDATE.md'), 'utf8');
  return [...new Set([...text.matchAll(/\*\*(INV-[A-Z0-9.]+(?:[ab])?) \[(?:BLOCK|WARN|INFO)\]\*\*/g)].map((match) => match[1]).filter((id): id is string => Boolean(id)))].sort();
}
function artifactEnvelopeErrors(): string[] {
  const candidates = ['data/seo/tam_map.json','data/seo/slo_history.json','data/seo/calibration_report.json','data/seo/pnl.json','data/seo/portfolio_board.json','data/seo/valuation.json','data/seo/brand_demand.json','data/seo/linkable_assets.json','data/seo/cro_experiments.json'];
  const required = ['artifact','schemaVersion','generatedAt','generatorScript','inputWindow','confidence','partial','siteId','coldStart','structuralBreaksApplied'];
  const errors: string[] = [];
  for (const file of candidates) if (existsSync(resolve(ROOT, file))) {
    const artifact = readJson<JsonObject>(file) as Record<string, unknown>;
    const meta = isRecord(artifact.meta) ? artifact.meta : {};
    for (const key of required) if (!(key in meta)) errors.push(`${file}:meta.${key}`);
  }
  return errors;
}
function containsGuarantee(text: string): boolean {
  const hard = /(kesin\s+çıkar|#1\s+ol|\bguaranteed\b|şunu\s+yaparsan[^\n]{0,40}çıkarsın)/iu;
  if (hard.test(text)) return true;
  for (const line of text.split(/\r?\n/)) {
    if (!/\bgaranti\b/iu.test(line)) continue;
    const compliance = /(garanti[^\n]{0,45}(?:yok|yasak|vermez|değildir|taramas|örüntüsü)|(?:yok|yasak)[^\n]{0,45}garanti)/iu;
    if (!compliance.test(line)) return true;
  }
  return false;
}
function reviewTextGuaranteeHit(): boolean {
  const direct = process.env.SEO_REVIEW_TEXT ?? '';
  const commitOverride = process.env.SEO_COMMIT_TEXT;
  const base = process.env.GITHUB_BASE_REF;
  const commits = commitOverride !== undefined
    ? commitOverride
    : base
      ? execFileSync('git', ['log', `origin/${base}..HEAD`, '--format=%B'], { cwd: ROOT, encoding: 'utf8' })
      : execFileSync('git', ['log', '-1', '--format=%B'], { cwd: ROOT, encoding: 'utf8' });
  return containsGuarantee(`${direct}\n${commits}`);
}
function guaranteeHits(files: string[]): string[] {
  const excluded = new Set(['docs/seo/MANDATE.md','docs/seo/MANDATE_ERRATA.md','docs/seo/YORUM_KAYDI.md','data/seo/invariants.json']);
  const hits: string[] = [];
  for (const file of files) {
    if (excluded.has(file) || file.startsWith('scripts/seo/') || file.startsWith('tests/conformance/') || file.includes('/fixtures/') || file.includes('/invariants/')) continue;
    const absolute = resolve(ROOT, file);
    if (!existsSync(absolute) || !/\.(md|txt|json|ya?ml|mjs|cjs|js|ts|astro)$/i.test(file)) continue;
    if (containsGuarantee(readFileSync(absolute, 'utf8'))) hits.push(file);
  }
  return hits;
}
function runPreflight({ site, files = changedFiles(), contractOverride, branch = currentBranch() }: { site?: string; files?: string[]; contractOverride?: string; branch?: string }): Check[] {
  const checks: Check[] = [];
  const fail = (id: string, msg: string, code = EXIT.BLOCK): void => { checks.push({ id, status: 'FAIL', msg, code }); };
  const pass = (id: string, msg: string): void => { checks.push({ id, status: 'PASS', msg, code: EXIT.PASS }); };
  if (!site) { fail('P-09', '--site/SITE_ID eksik', EXIT.CONFIG); return checks; }
  const defaults = readJson<JsonObject>('seo.config.defaults.json');
  const local = readJson<JsonObject>(`sites/${site}/seo.config.json`);
  const config = mergeDeep(defaults, local) as unknown as SeoConfig;
  const schema = readJson<JsonObject>('seo.config.schema.json') as Record<string, unknown>;
  const schemaErrors = validateSchema(config, schema);
  schemaErrors.length ? fail('P-01', schemaErrors.join('; '), EXIT.CONFIG) : pass('P-01', 'config schema PASS');
  const placeholders = scanPlaceholders(config);
  placeholders.length ? fail('P-02', `placeholder: ${placeholders.join(',')}`, EXIT.CONFIG) : pass('P-02', 'placeholder yok');
  if (!shouldEnforcePhaseContract(branch, contractOverride)) {
    pass('P-03', `SEO faz manifesti kapsam dışı (branch=${branch})`);
  } else {
    const contract = phaseContract(progress(), contractOverride, branch);
    if (!contract) fail('P-03', `phase contract yok${contractOverride ? `: ${contractOverride}` : branch ? `: branch=${branch}` : ''}`, EXIT.CONFIG);
    else {
      const bad = files.filter((file) => !matchAny(file, contract.writes) || matchAny(file, contract.forbidsWrites ?? []));
      bad.length ? fail('P-03', `manifest dışı: ${bad.join(',')}`) : pass('P-03', `manifest uyumlu (${files.length} değişiklik)`);
    }
  }
  const secrets = secretHits(files);
  secrets.length ? fail('P-04', `secret bulundu: ${secrets.join(',')}`) : pass('P-04', 'secret izi yok');
  const invariantIds = readJson<InvariantRecord[]>('data/seo/invariants.json').map((item) => item.id).sort();
  const mandateIds = mandateInvariantIds();
  JSON.stringify(invariantIds) === JSON.stringify(mandateIds) ? pass('P-05', `invariant parity ${invariantIds.length}`) : fail('P-05', `invariant parity bozuk json=${invariantIds.length} mandate=${mandateIds.length}`, EXIT.CONFIG);
  const envelopeErrors = artifactEnvelopeErrors();
  envelopeErrors.length ? fail('P-06', envelopeErrors.join(',')) : pass('P-06', 'mevcut artefakt zarfları PASS');
  const budget = config.economics.budgetSplit;
  const sum = budget.investPct + budget.holdPct + budget.harvestPct + budget.divestPct;
  sum === 100 ? pass('P-07', 'budgetSplit=100') : fail('P-07', `budgetSplit=${sum}`, EXIT.CONFIG);
  const date = config.measurement.dataWindowStart;
  /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= DATE_FLOOR ? pass('P-08', `dataWindowStart=${date}`) : fail('P-08', `dataWindowStart=${date} < ${DATE_FLOOR}`, EXIT.CONFIG);
  config.site.siteId === site ? pass('P-09', `siteId=${site}`) : fail('P-09', `siteId mismatch ${config.site.siteId}`, EXIT.CONFIG);
  const guaranteeFiles = guaranteeHits(files);
  const reviewHit = reviewTextGuaranteeHit();
  guaranteeFiles.length || reviewHit ? fail('P-10', `garanti/vaat dili: ${[...guaranteeFiles, ...(reviewHit ? ['PR/commit metni'] : [])].join(',')}`) : pass('P-10', 'garanti/vaat örüntüsü yok');
  return checks;
}
function exitCode(checks: Check[]): number {
  if (checks.some((check) => check.code === EXIT.CONFIG)) return EXIT.CONFIG;
  if (checks.some((check) => check.code === EXIT.BLOCK)) return EXIT.BLOCK;
  if (checks.some((check) => check.code === EXIT.MISSING_DATA)) return EXIT.MISSING_DATA;
  if (checks.some((check) => check.code === EXIT.WARN)) return EXIT.WARN;
  return EXIT.PASS;
}
function main(): void {
  try {
    const { site, contractOverride } = parseArgs(process.argv.slice(2));
    const checks = runPreflight({ site, contractOverride });
    for (const check of checks) console.log(`${check.id} ${check.status} — ${check.msg}`);
    const code = exitCode(checks);
    console.log(`SEO PREFLIGHT — ${checks.filter((check) => check.status === 'PASS').length}/${checks.length} PASS — exit ${code}`);
    process.exit(code);
  } catch (error) {
    console.error(`PREFLIGHT CONFIG ERROR — ${error instanceof Error ? error.message : String(error)}`);
    process.exit(EXIT.CONFIG);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
export { EXIT, DATE_FLOOR, mergeDeep, validateSchema, scanPlaceholders, globToRegExp, matchAny, containsGuarantee, reviewTextGuaranteeHit, guaranteeHits, runPreflight, exitCode, progress, branchContractKey, shouldEnforcePhaseContract };
