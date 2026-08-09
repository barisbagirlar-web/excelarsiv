import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
type Stage='pnl'|'kac'|'slo'|'board';
type Fixture={synthetic:boolean;dataset:string;startDate:string;days?:number;weeks?:number;pageTypes?:string[];generator:any};
const read=(name:string)=>JSON.parse(readFileSync(resolve(ROOT,'tests/fixtures/seo-rehearsal',name),'utf8')) as Fixture;
function meta(stage:Stage){return {artifact:`rehearsal_${stage}`,schemaVersion:'6.0-rehearsal',synthetic:true,coldStart:true,confidence:'low',siteId:'excelarsiv'};}
function outDir(){const dir=process.env.SEO_REHEARSAL_OUT;if(!dir)throw new Error('SEO_REHEARSAL_OUT_MISSING');mkdirSync(dir,{recursive:true});return dir;}
function dateAt(start:string,offset:number){return new Date(Date.parse(`${start}T00:00:00Z`)+offset*86400000).toISOString().slice(0,10);}
function expandGsc(f:Fixture){const rows:any[]=[];for(let d=0;d<(f.days??0);d++)for(let p=0;p<(f.pageTypes??[]).length;p++){const pageType=f.pageTypes![p]!;rows.push({date:dateAt(f.startDate,d),pageType,impressions:f.generator.baseImpressions+d*f.generator.dailyImpressionIncrement+p*f.generator.pageTypeImpressionOffset,clicks:f.generator.baseClicks+d*f.generator.dailyClickIncrement+p*f.generator.pageTypeClickOffset});}return rows;}
function expandSessions(f:Fixture){const rows:any[]=[];for(let d=0;d<(f.days??0);d++)for(let p=0;p<(f.pageTypes??[]).length;p++)rows.push({date:dateAt(f.startDate,d),pageType:f.pageTypes![p]!,sessions:f.generator.baseSessions+d*f.generator.dailyIncrement+p*f.generator.pageTypeOffset});return rows;}
function expandConversions(f:Fixture){const rows:any[]=[];for(let d=0;d<(f.days??0);d++)for(let p=0;p<(f.pageTypes??[]).length;p++){const conversions=f.generator.baseConversions+(d%f.generator.conversionCycle)+p*f.generator.pageTypeConversionOffset;const conversionValueMinor=f.generator.conversionValueMinorByPageType[p];if(!Number.isInteger(conversionValueMinor))throw new Error('REHEARSAL_MONEY_NOT_INTEGER');rows.push({date:dateAt(f.startDate,d),pageType:f.pageTypes![p]!,conversions,conversionValueMinor});}return rows;}
function expandCrux(f:Fixture){const rows:any[]=[];for(let w=0;w<(f.weeks??0);w++)rows.push({week:dateAt(f.startDate,w*7),lcpMs:f.generator.lcpP75Ms[w%f.generator.lcpP75Ms.length],inpMs:f.generator.inpP75Ms[w%f.generator.inpP75Ms.length],cls:f.generator.clsP75[w%f.generator.clsP75.length]});return rows;}
export function runRehearsalStage(stage:Stage):void{
  const gscF=read('gsc_query_daily.json');const sessionsF=read('ga4_sessions_daily.json');const convF=read('ga4_conversions_daily.json');const cruxF=read('crux_p75_weekly.json');
  if(![gscF,sessionsF,convF,cruxF].every(x=>x.synthetic===true))throw new Error('REHEARSAL_FIXTURE_NOT_SYNTHETIC');
  if(gscF.days!==90||sessionsF.days!==90||convF.days!==90||cruxF.weeks!==13)throw new Error('REHEARSAL_WINDOW_INVALID');
  const gsc=expandGsc(gscF),sessions=expandSessions(sessionsF),conv=expandConversions(convF),crux=expandCrux(cruxF);
  const revenue=conv.reduce((s,r)=>s+r.conversions*r.conversionValueMinor,0);const conversions=conv.reduce((s,r)=>s+r.conversions,0);const totalSessions=sessions.reduce((s,r)=>s+r.sessions,0);
  const queryTotals=new Map<string,number>();for(const r of gsc)queryTotals.set(r.pageType,(queryTotals.get(r.pageType)??0)+r.clicks);
  const ranking=[...queryTotals.entries()].map(([pageType,clicks])=>({pageType,clicks})).sort((a,b)=>b.clicks-a.clicks||a.pageType.localeCompare(b.pageType));
  const p75=crux.at(-1)!;
  const artifacts:any={
    pnl:{meta:meta('pnl'),totals:{revenueMinor:revenue,conversions,sessions:totalSessions,valuePerConversionMinor:conversions?Math.trunc(revenue/conversions):0}},
    kac:{meta:meta('kac'),ranking},
    slo:{meta:meta('slo'),p75:{lcpMs:p75.lcpMs,inpMs:p75.inpMs,cls:p75.cls},status:{lcp:p75.lcpMs<=2500?'PASS':'FAIL',inp:p75.inpMs<=200?'PASS':'FAIL',cls:p75.cls<=0.1?'PASS':'FAIL'}},
    board:{meta:meta('board'),summary:{revenueMinor:revenue,conversions,sessions:totalSessions,topPageType:ranking[0]?.pageType??null,sloPass:p75.lcpMs<=2500&&p75.inpMs<=200&&p75.cls<=0.1}}
  };
  writeFileSync(resolve(outDir(),`${stage}.json`),JSON.stringify(artifacts[stage],null,2)+'\n','utf8');
  console.log(`SEO REHEARSAL ${stage.toUpperCase()} PASS`);
}
