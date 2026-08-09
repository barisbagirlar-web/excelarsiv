import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });
type Entry = { route:string; status:'live'|'retired'; httpStatus:number; indexable:boolean; robotsBlocked:boolean; inSitemap:boolean; lastmod:string|null; lastSignificantChangeAt:string|null };
type Registry = { records:Array<Record<string,unknown>> };
function validateEntries(entries: Entry[]): string[] {
  const errors:string[]=[];
  for(const entry of entries){
    if(entry.inSitemap && (entry.httpStatus!==200 || !entry.indexable || entry.status!=='live')) errors.push(`INV-3.1 sitemap state invalid: ${entry.route}`);
    if(entry.inSitemap && entry.robotsBlocked) errors.push(`INV-3.2 robots-blocked sitemap URL: ${entry.route}`);
    if(entry.inSitemap && !entry.indexable) errors.push(`INV-3.3 noindex sitemap URL: ${entry.route}`);
    if(entry.inSitemap && entry.lastmod && entry.lastSignificantChangeAt && entry.lastmod!==entry.lastSignificantChangeAt) errors.push(`INV-3.4a fake/stale lastmod: ${entry.route}`);
  }
  return errors;
}
function staticInputErrors(): string[] {
  const errors:string[]=[];
  const robots=readFileSync(resolve(ROOT,'public/robots.txt'),'utf8');
  if(!robots.includes('Sitemap: https://excelarsiv.com/sitemap.xml')) errors.push('INV-3.1 canonical sitemap root robots içinde yok');
  if(!robots.includes('Disallow: /api') || !robots.includes('Disallow: /demo')) errors.push('INV-3.2 blockedSections robots ile uyumsuz');
  const registry=JSON.parse(readFileSync(resolve(ROOT,'data/seo/registry/excelarsiv_seo_registry.json'),'utf8')) as Registry;
  for(const record of registry.records){ if(record.status==='retired') errors.push(`INV-3.1 retired registry kaydı: ${String(record.route)}`); }
  return errors;
}
function fixture(name:string): Entry[] {
  const base:Entry={route:'/fixture',status:'live',httpStatus:200,indexable:true,robotsBlocked:false,inSitemap:true,lastmod:'2026-08-09',lastSignificantChangeAt:'2026-08-09'};
  if(name==='none') return [base];
  if(name==='bad-state') return [{...base,status:'retired'}];
  if(name==='robots') return [{...base,robotsBlocked:true}];
  if(name==='noindex') return [{...base,indexable:false}];
  if(name==='lastmod') return [{...base,lastmod:'2026-08-09',lastSignificantChangeAt:'2026-08-08'}];
  throw new Error(`UNKNOWN_FIXTURE:${name}`);
}
function arg(name:string):string|undefined{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
function main():void{
  try{
    if((arg('--site')??process.env.SITE_ID)!=='excelarsiv') process.exit(EXIT.CONFIG);
    const fixtureName=arg('--fixture')??'none';
    const errors=[...validateEntries(fixture(fixtureName)),...(fixtureName==='none'?staticInputErrors():[])];
    if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}
    console.log('SEO SITEMAP CONTRACT PASS — root /sitemap.xml preserved');
    process.exit(EXIT.PASS);
  }catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export {validateEntries};
