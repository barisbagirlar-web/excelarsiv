import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRehearsalStage } from './rehearsal-engine.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, WARN: 2, CONFIG: 4 });
type Status = 'PASS'|'FAIL'|'SKIP_NO_DATA';
type Row = { slo:string; measured:number|null; thresholdRef:string|null; status:Status; ts:string; issueOpened:boolean; consecutiveViolations:number; freezeEscalated?:boolean };
type Kill = { id:string; triggeredAt:string; decisionRecorded:boolean };
type Artifact = { meta:{partial:boolean}; rows:Row[]; killQueue:Kill[] };
type Config = { thresholds:Record<string,number> };

function thresholdValue(config:Config, ref:string|null):number|null {
  if (!ref) return null;
  const match = ref.match(/^thresholds\.([A-Za-z0-9_]+)$/);
  if (!match?.[1]) return null;
  const value = config.thresholds[match[1]];
  return typeof value === 'number' ? value : null;
}
function daysBetween(a:string,b:string):number { return Math.floor((Date.parse(b)-Date.parse(a))/86400000); }
function validate(artifact:Artifact, config:Config, now:string):{errors:string[];warnings:string[]} {
  const errors:string[]=[]; const warnings:string[]=[];
  for (const row of artifact.rows) {
    if (row.measured !== null && row.thresholdRef === null) errors.push(`INV-12.2 measured SLO thresholdRef yok: ${row.slo}`);
    if (row.thresholdRef !== null && thresholdValue(config,row.thresholdRef) === null) errors.push(`INV-12.2 config threshold bulunamadı: ${row.slo} ${row.thresholdRef}`);
    if (row.status === 'FAIL' && !row.issueOpened) errors.push(`INV-12.1 sessiz SLO ihlali: ${row.slo}`);
    if (row.consecutiveViolations >= 2 && !row.freezeEscalated) warnings.push(`INV-12.3 freeze eskalasyonu bekliyor: ${row.slo}`);
  }
  const maxDays=config.thresholds.killDecisionMaxDays;
  if (typeof maxDays !== 'number') errors.push('INV-12.2 thresholds.killDecisionMaxDays yok');
  else for (const item of artifact.killQueue) if (!item.decisionRecorded && daysBetween(item.triggeredAt,now) > maxDays) errors.push(`INV-12.5 askıda kill kararı: ${item.id}`);
  return {errors,warnings};
}
function fixture(name:string, base:Artifact, config:Config):Artifact {
  const x=structuredClone(base);
  if(name==='none') return x;
  if(name==='silent-violation'){x.rows.push({slo:'fixture',measured:1,thresholdRef:'thresholds.crisisTrafficDropPct',status:'FAIL',ts:'2026-08-01T00:00:00Z',issueOpened:false,consecutiveViolations:1});return x;}
  if(name==='hardcoded-threshold'){x.rows.push({slo:'fixture',measured:1,thresholdRef:null,status:'PASS',ts:'2026-08-01T00:00:00Z',issueOpened:false,consecutiveViolations:0});return x;}
  if(name==='kill-pending'){const max=config.thresholds.killDecisionMaxDays;x.killQueue.push({id:'fixture-kill',triggeredAt:new Date(Date.parse('2026-08-09T00:00:00Z')-(max+1)*86400000).toISOString(),decisionRecorded:false});return x;}
  throw new Error(`UNKNOWN_FIXTURE:${name}`);
}
function arg(name:string):string|undefined { const i=process.argv.indexOf(name); return i>=0?process.argv[i+1]:undefined; }
function main():void {
  try {
    if((arg('--site')??process.env.SITE_ID)!=='excelarsiv') process.exit(EXIT.CONFIG);
    if(process.env.SEO_REHEARSAL==='1'){runRehearsalStage('slo');process.exit(EXIT.PASS);}
    const artifact=JSON.parse(readFileSync(resolve(ROOT,'data/seo/slo_history.json'),'utf8')) as Artifact;
    const config=JSON.parse(readFileSync(resolve(ROOT,'seo.config.defaults.json'),'utf8')) as Config;
    const now=arg('--now')??new Date().toISOString();
    const result=validate(fixture(arg('--fixture')??'none',artifact,config),config,now);
    if(result.errors.length){console.error(result.errors.join('\n'));process.exit(EXIT.BLOCK);}
    if(result.warnings.length){console.error(result.warnings.join('\n'));process.exit(EXIT.WARN);}
    console.log(`SEO SLO CONTRACT PASS — ${artifact.rows.length} SLO row — partial=${artifact.meta.partial}`);
    process.exit(EXIT.PASS);
  } catch(error) { console.error(error instanceof Error?error.message:String(error)); process.exit(EXIT.CONFIG); }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
export {validate,thresholdValue};
