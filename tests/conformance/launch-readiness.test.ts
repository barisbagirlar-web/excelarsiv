import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT=resolve(import.meta.dirname,'../..');
const layout=readFileSync(resolve(ROOT,'src/layouts/CommerceLayout.astro'),'utf8');
const runbook=readFileSync(resolve(ROOT,'docs/seo/LANSMAN_RUNBOOK.md'),'utf8');

test('GSC verification is env-backed and not hardcoded',()=>{
  assert.match(layout,/process\.env\.GSC_VERIFICATION_TOKEN/);
  assert.match(layout,/name="google-site-verification" content=\{gscVerification\}/);
  assert.doesNotMatch(layout,/name="google-site-verification"\s+content="[^"]+"/);
});

test('launch runbook contains all required checkpoints and fail routes',()=>{
  for(const marker of ['T-0','T+0','T+1 hour','T+24 hours','T+72 hours','T+28 days'])assert.ok(runbook.includes(marker),marker);
  for(const command of ['npm run seo:preflight','npm run seo:conformance','curl -fsS https://excelarsiv.com/robots.txt','https://excelarsiv.com/sitemap.xml','npm run seo:coldstart-check'])assert.ok(runbook.includes(command),command);
  assert.match(runbook,/On failure:/);
  assert.match(runbook,/Runtime changes deploy only after merge/);
});
