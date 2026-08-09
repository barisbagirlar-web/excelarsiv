import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateInpLab, evaluateLighthouseReport, extractCanonical, extractTagText, isNoindex, normalizeCanonical, normalizeRoute, parseSitemapLocs, setDiff } from '../../scripts/seo/staging-proof.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const thresholds = { lcpP75Ms: 2500, inpP75Ms: 200, clsP75: 0.1 };

test('C2 raw HTML render proof extracts title, H1, canonical and noindex safely', () => {
  const html = '<title>  Excel Arşiv </title><h1><span>Kasa</span> Defteri</h1><link rel="canonical" href="https://excelarsiv.com/sablon/x"><meta name="robots" content="index,follow">';
  assert.equal(extractTagText(html, 'title'), 'Excel Arşiv');
  assert.equal(extractTagText(html, 'h1'), 'Kasa Defteri');
  assert.equal(extractCanonical(html), 'https://excelarsiv.com/sablon/x');
  assert.equal(isNoindex(html), false);
  assert.equal(isNoindex('<meta content="noindex,follow" name="robots">'), true);
});

test('C2 canonical normalization treats root serialization slash as equivalent but preserves path slash drift', () => {
  assert.equal(normalizeCanonical('https://excelarsiv.com'), 'https://excelarsiv.com/');
  assert.equal(normalizeCanonical('https://excelarsiv.com/'), 'https://excelarsiv.com/');
  assert.notEqual(normalizeCanonical('https://excelarsiv.com/sablon/x'), normalizeCanonical('https://excelarsiv.com/sablon/x/'));
  assert.equal(normalizeCanonical('not a valid url'), null);
});

test('C2 sitemap parser normalizes child URLs and set parity', () => {
  assert.deepEqual(parseSitemapLocs('<urlset><url><loc>https://excelarsiv.com/a/</loc></url><url><loc>https://excelarsiv.com/b</loc></url></urlset>'), ['https://excelarsiv.com/a/', 'https://excelarsiv.com/b']);
  assert.equal(normalizeRoute('https://excelarsiv.com/a/?x=1#y'), '/a');
  assert.deepEqual(setDiff(['/a','/b'], ['/b','/c']), { missing:['/a'], extra:['/c'] });
});

test('C2 Lighthouse budget uses config-provided LCP and CLS thresholds', () => {
  const pass = evaluateLighthouseReport({ finalUrl:'https://stage.example/', audits:{ 'largest-contentful-paint':{numericValue:2200}, 'cumulative-layout-shift':{numericValue:0.05} } }, thresholds);
  assert.equal(pass.pass, true);
  const fail = evaluateLighthouseReport({ finalUrl:'https://stage.example/', audits:{ 'largest-contentful-paint':{numericValue:2600}, 'cumulative-layout-shift':{numericValue:0.05} } }, thresholds);
  assert.equal(fail.pass, false);
});

test('C2 synthetic INP lab is explicit and thresholded without field-data claim', () => {
  assert.deepEqual(evaluateInpLab({ inpLabMs:120, eventCount:4, measurementMode:'event-timing-observed' }, thresholds), {
    inpLabMs:120,
    inpBudgetMs:200,
    inpEventCount:4,
    inpMeasurementMode:'event-timing-observed',
    pass:true,
  });
  assert.equal(evaluateInpLab({ inpLabMs:240, eventCount:2 }, thresholds).pass, false);
  assert.throws(() => evaluateInpLab({ inpLabMs:null }, thresholds), /INP_LAB_MISSING/);
});

test('C2 workflow resolves Puppeteer through public package API and captures consent network gate', () => {
  const workflow = readFileSync(resolve(ROOT, '.github/workflows/seo-staging-proof.yml'), 'utf8');
  assert.match(workflow, /NODE_PATH="\$\(npm root -g\)"/);
  assert.match(workflow, /require\('puppeteer-core'\)/);
  assert.doesNotMatch(workflow, /puppeteer-core\/lib\/esm\/puppeteer\/puppeteer-core\.js/);
  assert.match(workflow, /\(async \(\) => \{/);
  assert.match(workflow, /\}\)\(\)\.catch\(\(error\) => \{/);
  assert.match(workflow, /CONSENT_PRECHOICE_ANALYTICS_REQUESTS/);
  assert.match(workflow, /CONSENT_REJECT_ANALYTICS_REQUESTS/);
  assert.match(workflow, /CONSENT_ACCEPT_GOOGLE_TAG_REQUEST_MISSING/);
  assert.match(workflow, /consent-network\.json/);
});

test('C2 embedded CommonJS browser proof is syntax-valid before merge', () => {
  const workflow = readFileSync(resolve(ROOT, '.github/workflows/seo-staging-proof.yml'), 'utf8');
  const match = workflow.match(/node --input-type=commonjs <<'NODE'\n([\s\S]*?)\n\s+NODE/);
  assert.ok(match?.[1], 'embedded CommonJS proof block missing');
  const script = match[1].replace(/^\s{10}/gm, '');
  const checked = spawnSync(process.execPath, ['--check', '--input-type=commonjs'], {
    input: script,
    encoding: 'utf8',
  });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
});
