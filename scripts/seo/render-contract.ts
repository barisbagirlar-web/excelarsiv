import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const EXIT=Object.freeze({PASS:0,BLOCK:1,CONFIG:4});
type Snapshot={route:string;rawH1:string|null;renderedH1:string|null;rawCanonical:string|null;renderedCanonical:string|null;rawBodyText:string;renderedBodyText:string};
function validateSnapshot(s:Snapshot):string[]{const e:string[]=[];if(!s.rawH1||!s.rawBodyText.trim())e.push(`INV-4.1 kritik içerik ham HTML'de yok: ${s.route}`);if(s.rawCanonical!==s.renderedCanonical)e.push(`INV-4.2 canonical render sonrası değişti: ${s.route}`);if(s.rawH1!==s.renderedH1)e.push(`INV-4.1 H1 render paritesi bozuk: ${s.route}`);return e;}
function staticSourceErrors():string[]{const e:string[]=[];const product=readFileSync(resolve(ROOT,'src/pages/sablon/[slug].astro'),'utf8');const layout=readFileSync(resolve(ROOT,'src/layouts/CommerceLayout.astro'),'utf8');if(!product.includes('<ProductHeroPremium')||!product.includes('title={`${t.name} — Excel Arşiv`}'))e.push('INV-4.1 ürün kritik içerik static template içinde değil');if(!layout.includes('rel="canonical"')&&!layout.includes("rel='canonical'"))e.push('INV-4.2 canonical layout kaynağı bulunamadı');return e;}
function fixture(name:string):Snapshot{const base:Snapshot={route:'/fixture',rawH1:'Başlık',renderedH1:'Başlık',rawCanonical:'https://excelarsiv.com/fixture',renderedCanonical:'https://excelarsiv.com/fixture',rawBodyText:'Kritik içerik',renderedBodyText:'Kritik içerik'};if(name==='none')return base;if(name==='missing-raw')return{...base,rawH1:null};if(name==='canonical-mutation')return{...base,renderedCanonical:'https://example.com/fixture'};throw new Error(`UNKNOWN_FIXTURE:${name}`);}
function arg(n:string):string|undefined{const i=process.argv.indexOf(n);return i>=0?process.argv[i+1]:undefined;}
function main():void{try{if((arg('--site')??process.env.SITE_ID)!=='excelarsiv')process.exit(EXIT.CONFIG);const f=arg('--fixture')??'none';const errors=[...validateSnapshot(fixture(f)),...(f==='none'?staticSourceErrors():[])];if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}console.log('SEO RENDER CONTRACT PASS — static critical-content/canonical source');process.exit(EXIT.PASS);}catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export{validateSnapshot};
