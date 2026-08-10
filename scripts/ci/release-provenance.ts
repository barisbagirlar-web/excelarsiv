type JsonRecord = Record<string, unknown>;

type ProvenanceInput = {
  refName: string;
  sha: string;
  pullRequests: unknown;
  workflowRuns: unknown;
  requiredWorkflows?: readonly string[];
};

type ProvenanceResult = {
  ok: boolean;
  reason: string;
  prNumber?: number;
  prHeadSha?: string;
  checks?: Record<string, string>;
};

const REQUIRED_WORKFLOWS = Object.freeze([
  'Security Gates',
  'Validate',
  'SEO V6 Conformance',
] as const);

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nestedString(record: JsonRecord, key: string, nestedKey: string): string | null {
  const nested = record[key];
  if (!isRecord(nested)) return null;
  const value = nested[nestedKey];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function selectMergedPullRequest(refName: string, sha: string, pullRequests: unknown): JsonRecord | null {
  if (refName !== 'main' || !Array.isArray(pullRequests)) return null;
  const matches = pullRequests.filter((value): value is JsonRecord => {
    if (!isRecord(value)) return false;
    const baseRef = nestedString(value, 'base', 'ref');
    return baseRef === 'main'
      && typeof value.merged_at === 'string'
      && value.merged_at.length > 0
      && value.merge_commit_sha === sha;
  });
  return matches.length === 1 ? matches[0] : null;
}

function workflowRunList(value: unknown): JsonRecord[] {
  if (!isRecord(value) || !Array.isArray(value.workflow_runs)) return [];
  return value.workflow_runs.filter((item): item is JsonRecord => isRecord(item));
}

function timestamp(record: JsonRecord): number {
  for (const key of ['updated_at', 'run_started_at', 'created_at']) {
    const value = record[key];
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function evaluateReleaseProvenance(input: ProvenanceInput): ProvenanceResult {
  if (input.refName !== 'main') {
    return { ok: false, reason: `DEPLOY_REF_NOT_MAIN:${input.refName || 'EMPTY'}` };
  }
  if (!/^[0-9a-f]{40}$/i.test(input.sha)) {
    return { ok: false, reason: 'DEPLOY_SHA_INVALID' };
  }

  const pr = selectMergedPullRequest(input.refName, input.sha, input.pullRequests);
  if (!pr) return { ok: false, reason: 'MERGED_PR_PROVENANCE_MISSING_OR_AMBIGUOUS' };

  const prNumber = typeof pr.number === 'number' ? pr.number : null;
  const prHeadSha = nestedString(pr, 'head', 'sha');
  if (!prNumber || !prHeadSha) return { ok: false, reason: 'MERGED_PR_METADATA_INCOMPLETE' };

  const required = input.requiredWorkflows ?? REQUIRED_WORKFLOWS;
  const runs = workflowRunList(input.workflowRuns)
    .filter((run) => run.event === 'pull_request' && run.head_sha === prHeadSha);
  const checks: Record<string, string> = {};

  for (const workflowName of required) {
    const latest = runs
      .filter((run) => run.name === workflowName)
      .sort((a, b) => timestamp(b) - timestamp(a))[0];
    if (!latest) {
      return { ok: false, reason: `REQUIRED_WORKFLOW_MISSING:${workflowName}`, prNumber, prHeadSha, checks };
    }
    const status = typeof latest.status === 'string' ? latest.status : 'unknown';
    const conclusion = typeof latest.conclusion === 'string' ? latest.conclusion : 'null';
    checks[workflowName] = `${status}/${conclusion}`;
    if (status !== 'completed' || conclusion !== 'success') {
      return { ok: false, reason: `REQUIRED_WORKFLOW_NOT_GREEN:${workflowName}:${status}/${conclusion}`, prNumber, prHeadSha, checks };
    }
  }

  return { ok: true, reason: 'PASS', prNumber, prHeadSha, checks };
}

async function githubJson(path: string, token: string, repository: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutMs = Number.parseInt(process.env.RELEASE_PROVENANCE_HTTP_TIMEOUT_MS ?? '20000', 10);
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000);
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

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function runLive(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA ?? '';
  const refName = process.env.GITHUB_REF_NAME ?? '';
  if (!token || !repository) throw new Error('GITHUB_CONTEXT_MISSING');
  if (refName !== 'main') throw new Error(`DEPLOY_REF_NOT_MAIN:${refName || 'EMPTY'}`);

  const retries = positiveInteger(process.env.RELEASE_PROVENANCE_RETRIES, 6);
  const delayMs = positiveInteger(process.env.RELEASE_PROVENANCE_RETRY_DELAY_MS, 1500);
  let pullRequests: unknown = [];
  let selected: JsonRecord | null = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    pullRequests = await githubJson(`commits/${sha}/pulls`, token, repository);
    selected = selectMergedPullRequest(refName, sha, pullRequests);
    if (selected) break;
    if (attempt === retries) break;
    console.log(`RELEASE PROVENANCE RETRY ${attempt}/${retries}: merged PR association not visible yet.`);
    await sleep(delayMs);
  }
  if (!selected) throw new Error('MERGED_PR_PROVENANCE_MISSING_OR_AMBIGUOUS');

  const prHeadSha = nestedString(selected, 'head', 'sha');
  if (!prHeadSha) throw new Error('MERGED_PR_HEAD_SHA_MISSING');
  const workflowRuns = await githubJson(
    `actions/runs?head_sha=${encodeURIComponent(prHeadSha)}&event=pull_request&per_page=100`,
    token,
    repository,
  );
  const result = evaluateReleaseProvenance({ refName, sha, pullRequests, workflowRuns });
  if (!result.ok) throw new Error(result.reason);

  const evidence = Object.entries(result.checks ?? {}).map(([name, status]) => `${name}=${status}`).join(', ');
  console.log(`RELEASE PROVENANCE PASS — PR #${result.prNumber}; ${evidence}`);
}

if (process.argv[1] && process.argv[1].endsWith('release-provenance.ts')) {
  runLive().catch((error: unknown) => {
    console.error(`RELEASE PROVENANCE BLOCK — ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

export { REQUIRED_WORKFLOWS, evaluateReleaseProvenance, selectMergedPullRequest };
