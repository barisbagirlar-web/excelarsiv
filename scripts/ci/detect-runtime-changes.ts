/**
 * Production katman sınıflandırıcısı.
 * HEAD^ yalnız son commit'e bakar; provenance fail-closed bir SHA'da kalan
 * src/ değişikliği sonraki docs/CI PR'sinde Hosting'den düşer.
 * Baseline: o katmanı en son başarıyla deploy eden workflow run'ın head SHA'sı.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

type Layer = 'backend' | 'hosting' | 'delivery';

type ForceFlags = Record<Layer, boolean>;

type Baselines = Record<Layer, string | null>;

type DetectInput = {
  eventName: string;
  force: ForceFlags;
  baselines: Baselines;
  pathChangedSince: (baseSha: string, paths: readonly string[]) => boolean;
};

type DetectResult = {
  backend_changed: boolean;
  hosting_changed: boolean;
  delivery_changed: boolean;
  runtime_changed: boolean;
  reasons: Record<Layer, string>;
};

type WorkflowStep = { name?: unknown; conclusion?: unknown };
type WorkflowJob = { steps?: unknown };
type WorkflowRun = {
  id?: unknown;
  head_sha?: unknown;
  conclusion?: unknown;
  status?: unknown;
};

export const BACKEND_PATHS = ['functions/'] as const;

export const HOSTING_PATHS = [
  'src/',
  'public/',
  'commerce/',
  'firebase.json',
  '.firebaserc',
  'astro.config.mjs',
  'tsconfig.json',
  'package.json',
  'package-lock.json',
  'scripts/seo/generate-artifacts.mjs',
  'scripts/seo/finalize-sitemap-index.mjs',
  'scripts/seo/validate-gates.mjs',
  'scripts/seo/lib.mjs',
] as const;

export const DELIVERY_PATHS = [
  'delivery/paid-products/',
  'commerce/catalog.json',
  'scripts/sync-paid-products.mjs',
  'scripts/check-paid-products.mjs',
  'scripts/package.json',
  'scripts/package-lock.json',
] as const;

export const LAYER_STEPS: Record<Layer, readonly string[]> = {
  hosting: ['Deploy Firebase Hosting'],
  backend: [
    'Deploy verification and delivery Functions with Firebase',
    'Deploy checkout Function last',
  ],
  delivery: ['Sync changed paid product binaries to private Storage'],
};

const LAYER_PATHS: Record<Layer, readonly string[]> = {
  backend: BACKEND_PATHS,
  hosting: HOSTING_PATHS,
  delivery: DELIVERY_PATHS,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function gitPathsChangedSince(baseSha: string, paths: readonly string[]): boolean {
  const result = spawnSync('git', ['diff', '--quiet', baseSha, 'HEAD', '--', ...paths], {
    encoding: 'utf8',
  });
  if (result.status === 0) return false;
  if (result.status === 1) return true;
  return true;
}

export function parentRevExists(): boolean {
  const result = spawnSync('git', ['rev-parse', 'HEAD^'], { encoding: 'utf8' });
  return result.status === 0;
}

function parseBool(value: string | undefined): boolean {
  return value === 'true';
}

export function detectRuntimeChanges(input: DetectInput): DetectResult {
  if (input.eventName === 'workflow_dispatch') {
    const backend = input.force.backend;
    const hosting = input.force.hosting;
    const delivery = input.force.delivery;
    return {
      backend_changed: backend,
      hosting_changed: hosting,
      delivery_changed: delivery,
      runtime_changed: backend || hosting || delivery,
      reasons: {
        backend: `workflow_dispatch:${backend}`,
        hosting: `workflow_dispatch:${hosting}`,
        delivery: `workflow_dispatch:${delivery}`,
      },
    };
  }

  const reasons: Record<Layer, string> = {
    backend: '',
    hosting: '',
    delivery: '',
  };

  const changed: Record<Layer, boolean> = {
    backend: false,
    hosting: false,
    delivery: false,
  };

  (Object.keys(LAYER_PATHS) as Layer[]).forEach((layer) => {
    const baseline = input.baselines[layer];
    const paths = LAYER_PATHS[layer];
    if (baseline) {
      changed[layer] = input.pathChangedSince(baseline, paths);
      reasons[layer] = `${baseline}:${changed[layer] ? 'diff' : 'unchanged'}`;
      return;
    }
    if (layer === 'hosting') {
      changed[layer] = true;
      reasons[layer] = 'NO_BASELINE_FAIL_CLOSED';
      return;
    }
    changed[layer] = input.pathChangedSince('HEAD^', paths);
    reasons[layer] = `HEAD^_FALLBACK:${changed[layer] ? 'diff' : 'unchanged'}`;
  });

  return {
    backend_changed: changed.backend,
    hosting_changed: changed.hosting,
    delivery_changed: changed.delivery,
    runtime_changed: changed.backend || changed.hosting || changed.delivery,
    reasons,
  };
}

export function selectLayerBaselines(
  runs: WorkflowRun[],
  jobsByRunId: Record<string, WorkflowJob[]>,
  currentRunId: string | null,
): Baselines {
  const baselines: Baselines = { backend: null, hosting: null, delivery: null };
  for (const run of runs) {
    if (typeof run.id !== 'number' && typeof run.id !== 'string') continue;
    const runId = String(run.id);
    if (currentRunId && runId === currentRunId) continue;
    if (run.status && run.status !== 'completed') continue;
    if (run.conclusion === 'cancelled' || run.conclusion === 'skipped') continue;
    const headSha = typeof run.head_sha === 'string' ? run.head_sha : '';
    if (!/^[0-9a-f]{40}$/i.test(headSha)) continue;
    const jobs = jobsByRunId[runId] ?? [];
    const stepConclusions = new Map<string, string>();
    for (const job of jobs) {
      const steps = Array.isArray(job.steps) ? job.steps : [];
      for (const step of steps) {
        if (!isRecord(step)) continue;
        const name = typeof step.name === 'string' ? step.name : '';
        const conclusion = typeof step.conclusion === 'string' ? step.conclusion : '';
        if (name && conclusion) stepConclusions.set(name, conclusion);
      }
    }
    (Object.keys(LAYER_STEPS) as Layer[]).forEach((layer) => {
      if (baselines[layer]) return;
      const hit = LAYER_STEPS[layer].some((name) => stepConclusions.get(name) === 'success');
      if (hit) baselines[layer] = headSha;
    });
    if (baselines.backend && baselines.hosting && baselines.delivery) break;
  }
  return baselines;
}

async function githubJson(path: string, token: string, repository: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`GITHUB_API_${response.status}:${path}:${body.slice(0, 300)}`);
    return JSON.parse(body) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

async function loadBaselinesFromGithub(): Promise<Baselines> {
  const token = process.env.GITHUB_TOKEN ?? '';
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const currentRunId = process.env.GITHUB_RUN_ID ?? null;
  if (!token || !repository) return { backend: null, hosting: null, delivery: null };

  const payload = await githubJson(
    'actions/workflows/deploy-firebase.yml/runs?branch=main&per_page=30',
    token,
    repository,
  );
  const runs = isRecord(payload) && Array.isArray(payload.workflow_runs)
    ? payload.workflow_runs.filter((item): item is WorkflowRun => isRecord(item))
    : [];

  const jobsByRunId: Record<string, WorkflowJob[]> = {};
  const baselinesSoFar: Baselines = { backend: null, hosting: null, delivery: null };

  for (const run of runs) {
    if (typeof run.id !== 'number' && typeof run.id !== 'string') continue;
    const runId = String(run.id);
    if (currentRunId && runId === currentRunId) continue;
    const jobsPayload = await githubJson(`actions/runs/${encodeURIComponent(runId)}/jobs`, token, repository);
    const jobs = isRecord(jobsPayload) && Array.isArray(jobsPayload.jobs)
      ? jobsPayload.jobs.filter((item): item is WorkflowJob => isRecord(item))
      : [];
    jobsByRunId[runId] = jobs;
    const next = selectLayerBaselines([run], jobsByRunId, currentRunId);
    for (const layer of ['backend', 'hosting', 'delivery'] as Layer[]) {
      if (!baselinesSoFar[layer] && next[layer]) baselinesSoFar[layer] = next[layer];
    }
    if (baselinesSoFar.backend && baselinesSoFar.hosting && baselinesSoFar.delivery) break;
  }

  return baselinesSoFar;
}

function writeOutput(result: DetectResult): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  const lines = [
    `backend_changed=${result.backend_changed}`,
    `hosting_changed=${result.hosting_changed}`,
    `delivery_changed=${result.delivery_changed}`,
    `runtime_changed=${result.runtime_changed}`,
  ];
  if (outputPath) appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(
    `Runtime decision: backend=${result.backend_changed} hosting=${result.hosting_changed} delivery=${result.delivery_changed} runtime=${result.runtime_changed}`,
  );
  console.log(
    `Runtime baselines: backend=${result.reasons.backend} hosting=${result.reasons.hosting} delivery=${result.reasons.delivery}`,
  );
}

async function runLive(): Promise<void> {
  const eventName = process.env.GITHUB_EVENT_NAME ?? '';
  if (eventName !== 'workflow_dispatch' && !parentRevExists()) {
    throw new Error('KALDI: parent commit bulunamadı; otomatik production deploy kararı verilmiyor.');
  }

  let baselines: Baselines = { backend: null, hosting: null, delivery: null };
  if (eventName !== 'workflow_dispatch') {
    try {
      baselines = await loadBaselinesFromGithub();
    } catch (error) {
      console.log(
        `Runtime baseline lookup failed; hosting fail-closed. ${error instanceof Error ? error.message : String(error)}`,
      );
      baselines = { backend: null, hosting: null, delivery: null };
    }
  }

  const result = detectRuntimeChanges({
    eventName,
    force: {
      backend: parseBool(process.env.INPUT_FORCE_BACKEND),
      hosting: parseBool(process.env.INPUT_FORCE_HOSTING),
      delivery: parseBool(process.env.INPUT_FORCE_DELIVERY),
    },
    baselines,
    pathChangedSince: gitPathsChangedSince,
  });
  writeOutput(result);
}

if (process.argv[1] && process.argv[1].endsWith('detect-runtime-changes.ts')) {
  runLive().catch((error: unknown) => {
    console.error(`RUNTIME DETECT BLOCK — ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
