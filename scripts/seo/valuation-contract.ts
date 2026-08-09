import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, MISSING_DATA: 3, CONFIG: 4 });

type Config = {
  thresholds: { valuationPnlMinMonths:number; valuationCashflowMinMonths:number };
  economics: { valuationMultiples:{ low:number; high:number } };
};
type Method = { status:string; methodology:string|null; multipleLow?:number|null; multipleHigh?:number|null; rangeMinor:number[]|null; requiredMonthsRef?:string };
type Valuation = { publishEligible:boolean; singleValueClaimMinor:number|null; methods:{V1:Method;V2:Method;V3:Method} };
type Manifest = { files:Array<{role:string;path:string}> };

function monthsInPnl(): number {
  const pnl = JSON.parse(readFileSync(resolve(ROOT,'data/seo/pnl.json'),'utf8')) as { series:Array<{date?:string}> };
  return new Set(pnl.series.map(x=>x.date?.slice(0,7)).filter(Boolean)).size;
}
function validateValuation(v:Valuation,c:Config): string[] {
  const errors:string[]=[];
  const hasRange = typeof v.methods.V1.multipleLow==='number' && typeof v.methods.V1.multipleHigh==='number' && v.methods.V1.multipleLow < v.methods.V1.multipleHigh;
  if(v.singleValueClaimMinor!==null && (!v.methods.V1.methodology || !hasRange)) errors.push('INV-19.1 valuation claim without methodology/multiple range');
  if(v.methods.V1.status==='CALCULATED' && !hasRange) errors.push('INV-19.1 calculated V1 without multiple range');
  if(hasRange && (v.methods.V1.multipleLow!==c.economics.valuationMultiples.low || v.methods.V1.multipleHigh!==c.economics.valuationMultiples.high)) errors.push('INV-19.1 valuation multiples diverge from config');
  const pnlMonths=monthsInPnl();
  if(v.methods.V3.status==='CALCULATED' && pnlMonths<c.thresholds.valuationCashflowMinMonths) errors.push('INV-19.4 V3 calculated before required P&L history');
  return errors;
}
function validateDd(m:Manifest): string[] {
  const errors:string[]=[];
  const roles=new Map(m.files.map(x=>[x.role,x.path]));
  for(const role of ['registry_export','pnl_raw_series','redirect_ledger','decision_ledger','conformance_history','structural_breaks']) {
    const p=roles.get(role);
    if(!p || !existsSync(resolve(ROOT,p))) errors.push(`INV-19.3 DD missing ${role}`);
  }
  return errors;
}
function fixture(name:string, current:Valuation, manifest:Manifest): {v:Valuation;m:Manifest} {
  const v=structuredClone(current); const m=structuredClone(manifest);
  if(name==='none') return {v,m};
  if(name==='claim-without-range') { v.singleValueClaimMinor=100; v.methods.V1.methodology=null; v.methods.V1.multipleLow=null; v.methods.V1.multipleHigh=null; return {v,m}; }
  if(name==='dd-missing') { m.files=m.files.filter(x=>x.role!=='decision_ledger'&&x.role!=='conformance_history'); return {v,m}; }
  throw new Error(`UNKNOWN_FIXTURE:${name}`);
}
function arg(name:string):string|undefined { const i=process.argv.indexOf(name); return i>=0?process.argv[i+1]:undefined; }
function main():void {
  try {
    if((arg('--site')??process.env.SITE_ID)!=='excelarsiv') process.exit(EXIT.CONFIG);
    const config=JSON.parse(readFileSync(resolve(ROOT,'seo.config.defaults.json'),'utf8')) as Config;
    const current=JSON.parse(readFileSync(resolve(ROOT,'data/seo/valuation.json'),'utf8')) as Valuation;
    const manifest=JSON.parse(readFileSync(resolve(ROOT,'docs/seo/DD_PAKETI/MANIFEST.json'),'utf8')) as Manifest;
    const name=arg('--fixture')??'none'; const x=fixture(name,current,manifest);
    const errors=[...validateValuation(x.v,config),...validateDd(x.m)];
    if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}
    if(name==='none' && monthsInPnl()<config.thresholds.valuationPnlMinMonths){console.error('VALUATION_GATE_PNL_MONTHS_MISSING');process.exit(EXIT.MISSING_DATA);}
    console.log('SEO VALUATION CONTRACT PASS'); process.exit(EXIT.PASS);
  } catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
export { validateValuation, validateDd };
