import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const FLOOR = '2025-09-11';

type Evidence = { date: string; historicalContextOnly?: boolean };
function violatesHistoricalTrend(evidence: Evidence): boolean {
  return evidence.date < FLOOR && evidence.historicalContextOnly !== true;
}

test('INV-0.1 negatif fixture: tarihsel veri trend girdisi olamaz', () => {
  assert.equal(violatesHistoricalTrend({ date: '2025-09-10' }), true);
  assert.equal(violatesHistoricalTrend({ date: '2025-09-10', historicalContextOnly: true }), false);
  const tam = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/tam_map.json'), 'utf8')) as { meta: { inputWindow: { start: string } } };
  assert.ok(tam.meta.inputWindow.start >= FLOOR);
});
