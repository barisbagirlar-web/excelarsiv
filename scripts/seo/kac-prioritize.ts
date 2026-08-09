import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });
type Recommendation = 'INVEST' | 'HOLD' | 'HARVEST' | 'DIVEST' | null;
type Cluster = { clusterId:string; primaryQuery:string; ownerRoute:string|null; sourceCtrModel:string|null; state:string|null; priorityScore:number|null; portfolioRecommendation:Recommendation; decisionEligible:boolean; approvalRef?:string|null; similarityToExisting?:number|null };
type Artifact = { meta:{partial:boolean}; clusters:Cluster[] };
type Config = { thresholds:{similarityMax:number} };
function validate(artifact:Artifact, config:Config, ledger:string):string[]{
  const errors:string[]=[];
  const owners=new Map<string,string|null>();
  for(const c of artifact.clusters){
    if(owners.has(c.clusterId) && owners.get(c.clusterId)!==c.ownerRoute) errors.push(`INV-11.1 multi-owner: ${c.clusterId}`); else owners.set(c.clusterId,c.ownerRoute);
    if(c.sourceCtrModel?.toLocaleLowerCase('tr-TR').includes('industry')) errors.push(`INV-11.2 industry CTR: ${c.clusterId}`);
    if(typeof c.similarityToExisting==='number' && c.similarityToExisting>config.thresholds.similarityMax) errors.push(`INV-11.3 similarity gate: ${c.clusterId}`);
    if(c.portfolioRecommendation!==null){
      if(!c.approvalRef || !ledger.includes(c.approvalRef)) errors.push(`INV-11.4 approval missing: ${c.clusterId}`);
      if((artifact.meta.partial || !c.decisionEligible) && c.portfolioRecommendation==='INVEST') errors.push(`INV-11.6 partial INVEST: ${c.clusterId}`);
    }
    if((artifact.meta.partial || !c.decisionEligible) && c.priorityScore!==null) errors.push(`INV-11.6 partial numeric score: ${c.clusterId}`);
  }
  return errors;
}
function fixture(name:string, base:Artifact):Artifact{
  const x=structuredClone(base); const first=x.clusters[0]; if(!first) throw new Error('EMPTY_CLUSTER_MAP');
  if(name==='none') return x;
  if(name==='double-owner'){x.clusters.push({...first,ownerRoute:'/sablon/ikinci-owner'});return x;}
  if(name==='industry-ctr'){first.sourceCtrModel='industry-table';return x;}
  if(name==='similarity'){first.similarityToExisting=1;return x;}
  if(name==='decision-no-approval'){first.portfolioRecommendation='HOLD';first.approvalRef=null;return x;}
  if(name==='partial-invest'){first.portfolioRecommendation='INVEST';first.approvalRef='2026-08-09T14:12:00Z';return x;}
  throw new Error(`UNKNOWN_FIXTURE:${name}`);
}
function arg(name:string):string|undefined{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
function main():void{
  try{
    if((arg('--site')??process.env.SITE_ID)!=='excelarsiv') process.exit(EXIT.CONFIG);
    const artifact=JSON.parse(readFileSync(resolve(ROOT,'data/seo/kac/cluster_map.json'),'utf8')) as Artifact;
    const config=JSON.parse(readFileSync(resolve(ROOT,'seo.config.defaults.json'),'utf8')) as Config;
    const ledger=readFileSync(resolve(ROOT,'docs/seo/KARAR_DEFTERI.md'),'utf8';
    const errors=validate(fixture(arg('--fixture')??'none',artifact),config,ledger);
    if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}
    console.log(`SEO KAC CONTRACT PASS — ${artifact.clusters.length} cluster — partial=${artifact.meta.partial}`);
    process.exit(EXIT.PASS);
  }catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export{validate};
