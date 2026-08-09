import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRehearsalStage } from './rehearsal-engine.ts';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const EXIT=Object.freeze({PASS:0,BLOCK:1,MISSING_DATA:3,CONFIG:4});
const MONEY_FIELDS=['firstTouchValueMinor','assistedValueMinor','aiReferralValueMinor','productionCostMinor'] as const;
type MoneyField=typeof MONEY_FIELDS[number];
type RecordRow={date:string;structuralPeriodId:string;joinedAcrossStructuralBreak?:boolean;firstTouchValueMinor:number;assistedValueMinor:number;aiReferralValueMinor:number;productionCostMinor:number};
type Incrementality={ciLow:number|null;ciHigh:number|null;effectSize:number|null};
type Input={records:RecordRow[];incrementality:Incrementality};
function validate(input:Input):string[]{const errors:string[]=[];for(const row of input.records){for(const field of MONEY_FIELDS){const value=row[field as MoneyField];if(!Number.isInteger(value))errors.push(`INV-9.1 ${field} integer değil: ${row.date}`);}if(row.joinedAcrossStructuralBreak)errors.push(`INV-9.2 structural break üzerinden birleşik trend: ${row.date}`);}if(input.incrementality.effectSize!==null&&(input.incrementality.ciLow===null||input.incrementality.ciHigh===null))errors.push('INV-9.3 incrementality CI eksik');return errors;}
function fixture(name:string):Input{const base:Input={records:[{date:'2026-08-01',structuralPeriodId:'p1',firstTouchValueMinor:0,assistedValueMinor:0,aiReferralValueMinor:0,productionCostMinor:0}],incrementality:{ciLow:null,ciHigh:null,effectSize:null}};if(name==='none')return base;if(name==='float-money'){base.records[0]!.firstTouchValueMinor=1.5;return base;}if(name==='structural-mix'){base.records[0]!.joinedAcrossStructuralBreak=true;return base;}if(name==='no-ci'){base.incrementality.effectSize=0.1;return base;}throw new Error(`UNKNOWN_FIXTURE:${name}`);}
function arg(name:string):string|undefined{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
function main():void{try{if((arg('--site')??process.env.SITE_ID)!=='excelarsiv')process.exit(EXIT.CONFIG);if(process.env.SEO_REHEARSAL==='1'){runRehearsalStage('pnl');process.exit(EXIT.PASS);}const fixtureName=arg('--fixture');let input:Input;if(fixtureName)input=fixture(fixtureName);else{const path=resolve(ROOT,'data/seo/pnl_input.json');if(!existsSync(path)){console.error('SEO_PNL_INPUT_MISSING: authenticated GSC/GA4 required');process.exit(EXIT.MISSING_DATA);}input=JSON.parse(readFileSync(path,'utf8')) as Input;}const errors=validate(input);if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}console.log(`SEO PNL CONTRACT PASS — ${input.records.length} kayıt`);process.exit(EXIT.PASS);}catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export{validate};
