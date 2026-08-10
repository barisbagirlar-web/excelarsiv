import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseProvenance } from '../../scripts/ci/release-provenance.ts';

const mergeSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const headSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const pullRequests = [{
  number: 92,
  merged_at: '2026-08-10T12:30:00Z',
  merge_commit_sha: mergeSha,
  base: { ref: 'main' },
  head: { sha: headSha },
}];

function greenRuns() {
  return {
    workflow_runs: [
      { name: 'Security Gates', event: 'pull_request', head_sha: headSha, status: 'completed', conclusion: 'success', updated_at: '2026-08-10T12:25:00Z' },
      { name: 'Validate', event: 'pull_request', head_sha: headSha, status: 'completed', conclusion: 'success', updated_at: '2026-08-10T12:26:00Z' },
      { name: 'SEO V6 Conformance', event: 'pull_request', head_sha: headSha, status: 'completed', conclusion: 'success', updated_at: '2026-08-10T12:27:00Z' },
    ],
  };
}

test('release provenance — merged PR + required green workflows PASS', () => {
  const result = evaluateReleaseProvenance({ refName: 'main', sha: mergeSha, pullRequests, workflowRuns: greenRuns() });
  assert.equal(result.ok, true);
  assert.equal(result.prNumber, 92);
});

test('release provenance — direct main push BLOCK', () => {
  const result = evaluateReleaseProvenance({ refName: 'main', sha: mergeSha, pullRequests: [], workflowRuns: greenRuns() });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'MERGED_PR_PROVENANCE_MISSING_OR_AMBIGUOUS');
});

test('release provenance — failed required workflow BLOCK', () => {
  const runs = greenRuns();
  runs.workflow_runs[2] = { ...runs.workflow_runs[2], conclusion: 'failure', updated_at: '2026-08-10T12:28:00Z' };
  const result = evaluateReleaseProvenance({ refName: 'main', sha: mergeSha, pullRequests, workflowRuns: runs });
  assert.equal(result.ok, false);
  assert.match(result.reason, /^REQUIRED_WORKFLOW_NOT_GREEN:SEO V6 Conformance:/);
});

test('release provenance — feature branch manual dispatch BLOCK', () => {
  const result = evaluateReleaseProvenance({ refName: 'feature/x', sha: mergeSha, pullRequests, workflowRuns: greenRuns() });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'DEPLOY_REF_NOT_MAIN:feature/x');
});

test('release provenance — latest workflow attempt wins', () => {
  const runs = greenRuns();
  runs.workflow_runs.push({ name: 'SEO V6 Conformance', event: 'pull_request', head_sha: headSha, status: 'completed', conclusion: 'failure', updated_at: '2026-08-10T12:20:00Z' });
  const result = evaluateReleaseProvenance({ refName: 'main', sha: mergeSha, pullRequests, workflowRuns: runs });
  assert.equal(result.ok, true);
});
