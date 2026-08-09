import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, MISSING_DATA: 3, CONFIG: 4 });
const SOURCES = new Set(['ads_keyword_planner', 'ahrefs', 'semrush']);
const GENERIC_TOKENS = new Set(['excel', 'xls', 'xlsx', 'sablon', 'sablonu', 'şablon', 'şablonu', 'template', 'program', 'programi', 'programı', 'dosya', 'dosyasi', 'dosyası']);

type DemandSource = 'ads_keyword_planner' | 'ahrefs' | 'semrush';
type DemandRow = { keyword: string; normalizedKeyword: string; volume: number; cpc: number | null; competition: string | null };
type RejectedRow = { line: number; reason: string; raw: string[] };
type ImportResult = { rows: DemandRow[]; rejected: RejectedRow[] };
type RegistryRecord = { pageId: string; route: string; type: string; status: string; primaryQueryClusterId?: string | null };
type Registry = { records: RegistryRecord[] };
type KacCluster = Record<string, unknown> & { clusterId: string; primaryQuery: string; ownerRoute: string | null };
type KacArtifact = Record<string, unknown> & { meta: Record<string, unknown>; clusters: KacCluster[]; missingSignals?: string[] };
type TamArtifact = Record<string, unknown> & { meta: Record<string, unknown>; coverage: Record<string, unknown>; missingSignals?: string[] };
type DemandArtifact = {
  meta: {
    artifact: 'keyword_demand'; schemaVersion: string; importedAt: string; source: DemandSource; confidence: 'low'; partial: true; siteId: 'excelarsiv'; coldStart: true;
  };
  acceptedCount: number;
  rejectedCount: number;
  rows: DemandRow[];
  rejected: RejectedRow[];
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { out.push(cell.trim()); cell = ''; }
    else cell += char;
  }
  out.push(cell.trim());
  return out;
}

function normalizeKeyword(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

function ascii(value: string): string {
  return normalizeKeyword(value).replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

function slug(value: string): string {
  return ascii(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'keyword';
}

function significantTokens(value: string): Set<string> {
  return new Set(ascii(value).split(/[^a-z0-9]+/).filter((token) => token && !GENERIC_TOKENS.has(token)));
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseDemandCsv(text: string): ImportResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], rejected: [] };
  const headers = parseCsvLine(lines[0]).map((item) => normalizeKeyword(item));
  const keywordIndex = headers.indexOf('keyword');
  const volumeIndex = headers.indexOf('volume');
  const cpcIndex = headers.indexOf('cpc');
  const competitionIndex = headers.indexOf('competition');
  if (keywordIndex < 0 || volumeIndex < 0) throw new Error('CSV_REQUIRED_COLUMNS_MISSING');

  const accepted = new Map<string, DemandRow>();
  const rejected: RejectedRow[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index]);
    const keyword = cells[keywordIndex]?.trim() ?? '';
    const volume = parseNumber(cells[volumeIndex] ?? '');
    if (!keyword) { rejected.push({ line: index + 1, reason: 'EMPTY_KEYWORD', raw: cells }); continue; }
    if (volume === null || !Number.isInteger(volume) || volume < 0) { rejected.push({ line: index + 1, reason: 'INVALID_VOLUME', raw: cells }); continue; }
    const normalizedKeyword = normalizeKeyword(keyword);
    const cpcRaw = cpcIndex >= 0 ? parseNumber(cells[cpcIndex] ?? '') : null;
    if (cpcRaw !== null && cpcRaw < 0) { rejected.push({ line: index + 1, reason: 'INVALID_CPC', raw: cells }); continue; }
    const row: DemandRow = {
      keyword,
      normalizedKeyword,
      volume,
      cpc: cpcRaw,
      competition: competitionIndex >= 0 ? (cells[competitionIndex]?.trim() || null) : null,
    };
    const previous = accepted.get(normalizedKeyword);
    if (!previous || row.volume > previous.volume) accepted.set(normalizedKeyword, row);
  }
  return { rows: [...accepted.values()].sort((a, b) => b.volume - a.volume || a.normalizedKeyword.localeCompare(b.normalizedKeyword, 'tr')), rejected };
}

function bestOwner(row: DemandRow, clusters: KacCluster[]): KacCluster | null {
  const tokens = significantTokens(row.normalizedKeyword);
  if (tokens.size === 0) return null;
  let best: { cluster: KacCluster; score: number } | null = null;
  for (const cluster of clusters) {
    const anchor = significantTokens(cluster.primaryQuery);
    let score = 0;
    for (const token of tokens) if (anchor.has(token)) score += 1;
    if (score === 0) continue;
    if (!best || score > best.score || (score === best.score && cluster.clusterId.localeCompare(best.cluster.clusterId) < 0)) best = { cluster, score };
  }
  return best?.cluster ?? null;
}

function buildSeeds(importResult: ImportResult, source: DemandSource, importedAt: string, existingKac: KacArtifact, existingTam: TamArtifact, registry: Registry) {
  const registryByRoute = new Map(registry.records.map((record) => [record.route, record]));
  const clusters = structuredClone(existingKac.clusters).map((cluster) => ({
    ...cluster,
    demandEvidence: [] as Array<Record<string, unknown>>,
    observedKeywordVolumeSum: 0,
    registryPageId: cluster.ownerRoute ? registryByRoute.get(cluster.ownerRoute)?.pageId ?? null : null,
    contentGap: cluster.ownerRoute === null,
  }));
  const byId = new Map(clusters.map((cluster) => [cluster.clusterId, cluster]));
  const gaps: Array<Record<string, unknown>> = [];
  let mappedVolume = 0;
  let totalVolume = 0;

  for (const row of importResult.rows) {
    totalVolume += row.volume;
    const owner = bestOwner(row, existingKac.clusters);
    if (owner) {
      const target = byId.get(owner.clusterId);
      if (!target) throw new Error(`OWNER_CLUSTER_MISSING:${owner.clusterId}`);
      (target.demandEvidence as Array<Record<string, unknown>>).push({ keyword: row.keyword, volume: row.volume, cpc: row.cpc, competition: row.competition, source });
      target.observedKeywordVolumeSum = Number(target.observedKeywordVolumeSum) + row.volume;
      mappedVolume += row.volume;
    } else {
      const gap = {
        clusterId: `demand-gap-${slug(row.normalizedKeyword)}`,
        primaryQuery: row.keyword,
        ownerRoute: null,
        registryPageId: null,
        sourceCtrModel: null,
        state: null,
        priorityScore: null,
        portfolioRecommendation: null,
        decisionEligible: false,
        contentGap: true,
        observedKeywordVolumeSum: row.volume,
        demandEvidence: [{ keyword: row.keyword, volume: row.volume, cpc: row.cpc, competition: row.competition, source }],
        suggestedRoute: `/sablon/${slug(row.normalizedKeyword)}`,
      };
      clusters.push(gap);
      gaps.push(gap);
    }
  }

  const demandArtifact: DemandArtifact = {
    meta: { artifact: 'keyword_demand', schemaVersion: '6.0-wave2-b1', importedAt, source, confidence: 'low', partial: true, siteId: 'excelarsiv', coldStart: true },
    acceptedCount: importResult.rows.length,
    rejectedCount: importResult.rejected.length,
    rows: importResult.rows,
    rejected: importResult.rejected,
  };

  const kac: KacArtifact = {
    ...existingKac,
    meta: { ...existingKac.meta, generatedAt: importedAt, generatorScript: 'scripts/seo/demand-import.ts', confidence: 'low', partial: true, coldStart: true },
    status: 'PARTIAL_SAFE',
    scoringEnabled: false,
    reason: 'External keyword demand imported; GSC CTR, GA4 conversion/value and effort signals remain unavailable.',
    demandSource: { source, importedAt, acceptedRows: importResult.rows.length, rejectedRows: importResult.rejected.length },
    clusters,
    contentGaps: gaps.map((gap) => ({ clusterId: gap.clusterId, primaryQuery: gap.primaryQuery, observedKeywordVolumeSum: gap.observedKeywordVolumeSum, suggestedRoute: gap.suggestedRoute })),
  };

  const coverageRatio = totalVolume === 0 ? null : mappedVolume / totalVolume;
  const tam: TamArtifact = {
    ...existingTam,
    meta: { ...existingTam.meta, generatedAt: importedAt, generatorScript: 'scripts/seo/demand-import.ts', confidence: 'low', partial: true, coldStart: true },
    status: 'PARTIAL_SAFE',
    coverage: {
      ...existingTam.coverage,
      totalDemandUniverse: totalVolume,
      mappedDemandVolume: mappedVolume,
      coverageRatio,
      coverageBasis: 'imported-keyword-dataset-only',
      provisional: true,
      reason: 'Coverage is limited to the imported external keyword dataset and is not a full market denominator.',
    },
    demandSeed: { source, importedAt, acceptedRows: importResult.rows.length, rejectedRows: importResult.rejected.length, contentGapCount: gaps.length },
    missingSignals: (existingTam.missingSignals ?? []).filter((signal) => signal !== 'keyword-demand-source'),
  };

  return { demandArtifact, kac, tam, gaps, totalVolume, mappedVolume };
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main(): void {
  try {
    const input = arg('--input');
    const sourceArg = arg('--source');
    const write = process.argv.includes('--write');
    if (!input) { console.log('DEMAND IMPORT SKIP_NO_DATA — --input CSV yok'); process.exit(EXIT.MISSING_DATA); }
    if (!sourceArg || !SOURCES.has(sourceArg)) throw new Error('INVALID_SOURCE');
    const source = sourceArg as DemandSource;
    const importedAt = new Date().toISOString();
    const parsed = parseDemandCsv(readFileSync(resolve(ROOT, input), 'utf8'));
    const existingKac = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/kac/cluster_map.json'), 'utf8')) as KacArtifact;
    const existingTam = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/tam_map.json'), 'utf8')) as TamArtifact;
    const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
    const seeds = buildSeeds(parsed, source, importedAt, existingKac, existingTam, registry);

    console.log(`DEMAND IMPORT source=${source} accepted=${parsed.rows.length} rejected=${parsed.rejected.length}`);
    console.log(`DEMAND VOLUME total=${seeds.totalVolume} mapped=${seeds.mappedVolume}`);
    console.log(`CONTENT GAPS ${seeds.gaps.length}`);
    for (const gap of seeds.gaps) console.log(`GAP ${String(gap.primaryQuery)} -> ${String(gap.suggestedRoute)}`);

    if (!write) { console.log('DRY_RUN PASS — production artefaktı yazılmadı'); process.exit(EXIT.PASS); }
    writeFileSync(resolve(ROOT, 'data/seo/demand/keyword_demand.json'), `${JSON.stringify(seeds.demandArtifact, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(ROOT, 'data/seo/kac/cluster_map.json'), `${JSON.stringify(seeds.kac, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(ROOT, 'data/seo/tam_map.json'), `${JSON.stringify(seeds.tam, null, 2)}\n`, 'utf8');
    console.log('DEMAND IMPORT WRITE PASS');
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EXIT, buildSeeds, normalizeKeyword, parseDemandCsv, significantTokens };
