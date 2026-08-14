import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, mergeDeep } from './preflight.ts';
import { evaluateColdStart } from './conformance-rules.ts';

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type ColdStartConfig = { measurement: { coldStart: boolean; dataWindowStart: string }; thresholds: { coldStartMinDays: number } };
type Coverage = { availableDays: number; dataWindowStart?: string };
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
function readJson<T>(path: string): T { return JSON.parse(readFileSync(path, 'utf8')) as T; }
function siteArg(): string { const index=process.argv.indexOf('--site'); return (index>=0?process.argv[index+1]:process.env.SITE_ID) ?? 'excelarsiv'; }
const site=siteArg(); const dryRun=process.argv.includes('--dry-run');
if(!site){console.error('SITE_ID_MISSING');process.exit(EXIT.CONFIG);}
const localPath=resolve(ROOT,`sites/${site}/seo.config.json`);
if(!existsSync(localPath)){console.error(`SITE_CONFIG_MISSING: ${localPath}`);process.exit(EXIT.CONFIG);}
const config=mergeDeep(readJson<JsonObject>(resolve(ROOT,'seo.config.defaults.json')),readJson<JsonObject>(localPath)) as unknown as ColdStartConfig;
const thresholdDays=config.thresholds.coldStartMinDays;
if(!Number.isInteger(thresholdDays)||thresholdDays<1){console.error('COLDSTART_THRESHOLD_INVALID');process.exit(EXIT.CONFIG);}
const coveragePath=resolve(ROOT,`data/seo/gsc_coverage_${site}.json`);
if(!existsSync(coveragePath)){
  const output={siteId:site,coldStart:config.measurement.coldStart,confidence:config.measurement.coldStart?'low':'high',availableDays:null,thresholdDays,dataWindowStart:config.measurement.dataWindowStart,dryRun,status:'SKIP_NO_DATA',prRecommendation:null};
  if(dryRun){console.log(JSON.stringify(output));process.exit(EXIT.PASS);}
  console.error(`GSC_COVERAGE_MISSING: ${coveragePath}`);process.exit(EXIT.MISSING_DATA);
}
const coverage=readJson<Coverage>(coveragePath);
if(!Number.isInteger(coverage.availableDays)||coverage.availableDays<0){console.error('GSC_COVERAGE_INVALID');process.exit(EXIT.CONFIG);}
if(coverage.dataWindowStart&&coverage.dataWindowStart!==config.measurement.dataWindowStart){console.error('GSC_COVERAGE_WINDOW_MISMATCH');process.exit(EXIT.CONFIG);}
const result=evaluateColdStart(coverage.availableDays,thresholdDays);
const shouldClose=config.measurement.coldStart===true&&result.coldStart===false;
const prRecommendation=shouldClose?{readyToOpen:true,branch:`seo/coldstart-exit-${site}`,title:`seo: exit cold-start mode for ${site}`,change:`sites/${site}/seo.config.json measurement.coldStart true -> false`,automaticConfigWrite:false}:null;
console.log(JSON.stringify({siteId:site,availableDays:coverage.availableDays,dataWindowStart:config.measurement.dataWindowStart,configuredColdStart:config.measurement.coldStart,...result,dryRun,prRecommendation}));
process.exit(EXIT.PASS);
