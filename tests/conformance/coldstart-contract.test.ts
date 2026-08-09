import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const config = JSON.parse(readFileSync(resolve(ROOT, 'sites/excelarsiv/seo.config.json'), 'utf8')) as { measurement: { coldStart: boolean } };
const fixture = JSON.parse(readFileSync(resolve(ROOT, 'tests/conformance/fixtures/coldstart-artifact.json'), 'utf8')) as { meta: { coldStart: boolean; confidence: string } };

test('ExcelArsiv explicitly declares cold-start mode', () => {
  assert.equal(config.measurement.coldStart, true);
});

test('coldStart artifact confidence cannot exceed low', () => {
  assert.equal(fixture.meta.coldStart, true);
  assert.equal(fixture.meta.confidence, 'low');
  const invalid = { meta: { ...fixture.meta, confidence: 'high' } };
  assert.notEqual(invalid.meta.confidence, 'low');
});

test('all governed production artifacts obey coldStart=>low confidence', () => {
  const candidates = ['tam_map.json','slo_history.json','calibration_report.json','pnl.json','portfolio_board.json','valuation.json','brand_demand.json','linkable_assets.json','cro_experiments.json'];
  for (const name of candidates) {
    try {
      const artifact = JSON.parse(readFileSync(resolve(ROOT, `data/seo/${name}`), 'utf8')) as { meta?: { coldStart?: boolean; confidence?: string } };
      if (artifact.meta?.coldStart === true) assert.equal(artifact.meta.confidence, 'low', `${name}: coldStart confidence must be low`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
});
