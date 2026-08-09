import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
type Stage='pnl'|'kac'|'slo'|'board';
const read=(name:string)=>JSON.parse(readFileSync(resolve(ROOT,'tests/fixtures/seo-rehearsal',name),'utf8')) as any;
function meta(stage:Stage){return {artifact:`rehearsal_${stage}`,schemaVersion:'6.0-rehearsal',synthetic:true,coldStart:true,confidence:'low',siteId:'excelarsiv'};}
function outDir(){const dir=process.env.SEO_REHEARSAL_OUT;if(!dir)throw new Error('SEO_REHEARSAL_OUT_MISSING');mkdirSync(dir,{recursive:true});return dir;}
export function runRehearsalStage(stage:Stage):void{
  const gsc=read('gsc_query_daily.json'); const sessions=read('ga4_sessions_daily.json'); const conv=read('ga4_conversions_daily.json'); const crux=read('crux_p75_weekly.json');
  if(![gsc,sessions,conv,crux].every(x=>x.synthetic===true)) throw new Error('REHEARSAL_FIXTURE_NOT_SYNTHETIC');
  const revenue=conv.rows.reduce((s:number,r:any)=>s+r.conversionValueMinor,0);
  const conversions=conv.rows.reduce((s:number,r:any)=>s+r.conversions,0);
  const totalSessions=sessions.rows.reduce((s:number,r:any)=>s+r.sessions,0);
  const queryTotals=new Map<string,number>(); for(const r of gsc.rows)queryTotals.set(r.pageType,(queryTotals.get(r.pageType)??0)+r.clicks);
  const ranking=[...queryTotals.entries()].map(([pageType,clicks])=>({pageType,clicks})).sort((a,b)=>b.clicks-a.clicks||a.pageType.localeCompare(b.pageType));
  const p75=crux.rows.at(-1);
  const artifacts:any={
    pnl:{meta:meta('pnl'),totals:{revenueMinor:revenue,conversions,sessions:totalSessions,valuePerConversionMinor:conversions?Math.trunc(revenue/conversions):0}},
    kac:{meta:meta('kac'),ranking},
    slo:{meta:meta('slo'),p75:{lcpMs:p75.lcpMs,inpMs:p75.inpMs,cls:p75.cls},status:{lcp:p75.lcpMs<=2500?'PASS':'FAIL',inp:p75.inpMs<=200?'PASS':'FAIL',cls:p75.cls<=0.1?'PASS':'FAIL'}},
    board:{meta:meta('board'),summary:{revenueMinor:revenue,conversions,sessions:totalSessions,topPageType:ranking[0]?.pageType??null,sloPass:p75.lcpMs<=2500&&p75.inpMs<=200&&p75.cls<=0.1}}
  };
  writeFileSync(resolve(outDir(),`${stage}.json`),JSON.stringify(artifacts[stage],null,2)+'\n','utf8');
  console.log(`SEO REHEARSAL ${stage.toUpperCase()} PASS`);
}
