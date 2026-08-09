import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SITE_CONFIG = resolve(ROOT, 'sites/excelarsiv/seo.config.json');
const BREAKS_PATH = resolve(ROOT, 'data/seo/structural_breaks.json');
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, MISSING_DATA: 3, CONFIG: 4 });

type BreakRecord = { date: string; type: string; note: string };
type SiteConfig = { measurement?: { launchDate?: string | null; [key: string]: unknown }; [key: string]: unknown };

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function seedLaunchBreak(launchDate: string | null | undefined, existing: BreakRecord[]): BreakRecord[] | null {
  if (!launchDate) return null;
  if (!validDate(launchDate)) throw new Error('INVALID_LAUNCH_DATE');
  const launch: BreakRecord = { date: launchDate, type: 'site_launch', note: 'ExcelArsiv canlıya çıktı' };
  const withoutLaunch = existing.filter((item) => item.type !== 'site_launch');
  return [launch, ...withoutLaunch].sort((a, b) => a.date.localeCompare(b.date));
}

function setLaunchDate(config: SiteConfig, launchDate: string): SiteConfig {
  if (!validDate(launchDate)) throw new Error('INVALID_LAUNCH_DATE');
  return {
    ...config,
    measurement: {
      ...(config.measurement ?? {}),
      launchDate,
    },
  };
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main(): void {
  try {
    let config = JSON.parse(readFileSync(SITE_CONFIG, 'utf8')) as SiteConfig;
    const existing = JSON.parse(readFileSync(BREAKS_PATH, 'utf8')) as BreakRecord[];
    const setDate = arg('--set-launch-date');
    const dryRun = process.argv.includes('--dry-run');

    if (setDate) config = setLaunchDate(config, setDate);
    const launchDate = config.measurement?.launchDate;
    const seeded = seedLaunchBreak(launchDate, existing);

    if (!seeded) {
      console.log('STRUCTURAL BREAKS SKIP_NO_DATA — measurement.launchDate=null');
      console.log(`CURRENT BREAKS ${JSON.stringify(existing)}`);
      process.exit(EXIT.MISSING_DATA);
    }

    console.log(`LAUNCH DATE ${launchDate}`);
    console.log(`SEEDED BREAKS ${JSON.stringify(seeded)}`);
    if (dryRun) {
      console.log('DRY_RUN PASS — dosya yazılmadı');
      process.exit(EXIT.PASS);
    }

    if (setDate) writeFileSync(SITE_CONFIG, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    writeFileSync(BREAKS_PATH, `${JSON.stringify(seeded, null, 2)}\n`, 'utf8');
    console.log('STRUCTURAL BREAKS WRITE PASS');
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EXIT, seedLaunchBreak, setLaunchDate, validDate };
