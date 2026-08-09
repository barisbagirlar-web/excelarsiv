import test from 'node:test';
import assert from 'node:assert/strict';
import { seedLaunchBreak, setLaunchDate, validDate } from '../../scripts/seo/structural-breaks.ts';

test('A3 launch date validation is strict ISO date', () => {
  assert.equal(validDate('2026-08-09'), true);
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('09-08-2026'), false);
});

test('A3 missing launch date fails closed instead of inventing a date', () => {
  assert.equal(seedLaunchBreak(null, [{ date: '2026-08-09', type: 'measurement_change', note: 'consent v2 live' }]), null);
});

test('A3 launch seed is deterministic and preserves other structural breaks', () => {
  const seeded = seedLaunchBreak('2026-08-01', [
    { date: '2026-08-09', type: 'measurement_change', note: 'consent v2 live' },
    { date: '2026-07-01', type: 'site_launch', note: 'old launch' },
  ]);
  assert.deepEqual(seeded, [
    { date: '2026-08-01', type: 'site_launch', note: 'ExcelArsiv canlıya çıktı' },
    { date: '2026-08-09', type: 'measurement_change', note: 'consent v2 live' },
  ]);
});

test('A3 one-command date setter writes the date only into config model', () => {
  const config = setLaunchDate({ measurement: { coldStart: true, launchDate: null } }, '2026-08-01');
  assert.equal(config.measurement?.launchDate, '2026-08-01');
  assert.equal(config.measurement?.coldStart, true);
});
