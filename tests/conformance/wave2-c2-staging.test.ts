import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateInpLab, evaluateLighthouseReport, extractCanonical, extractTagText, isNoindex, normalizeRoute, parseSitemapLocs, setDiff } from '../../scripts/seo/staging-proof.ts';

const thresholds = { lcpP75Ms: 2500, inpP75Ms: 200, clsP75: 0.1 };

test('C2 raw HTML render proof extracts title, H1, canonical and noindex safely', () => {
  const html = '<title>  Excel Arşiv </title><h1><span>Kasa</span> Defteri</h1><link rel="canonical" href="https://excelarsiv.com/sablon/x"><meta name="robots" content="index,follow">';
  assert.equal(extractTagText(html, 'title'), 'Excel Arşiv');
  assert.equal(extractTagText(html, 'h1'), 'Kasa Defteri');
  assert.equal(extractCanonical(html), 'https://excelarsiv.com/sablon/x');
  assert.equal(isNoindex(html), false);
  assert.equal(isNoindex('<meta content="noindex,follow" name="robots">'), true);
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
