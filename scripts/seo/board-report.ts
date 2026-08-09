import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRehearsalStage } from './rehearsal-engine.ts';
const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const EXIT={PASS:0,BLOCK:1,WARN:2,CONFIG:4} as const;
const required=['DURUM:','1. PARA:','2. VARLIK:','3. PORTFÖY:','4. RİSK:','5. HENDEK:','6. KALİTE:','7. KARAR GEREKTİRENLER:','İBARE:'];
function validate(text:string):string[]{return required.filter(x=>!text.includes(x));}
function arg(n:string){const i=process.argv.indexOf(n);return i>=0?process.argv[i+1]:undefined;}
function main(){try{if((arg('--site')??process.env.SITE_ID)!=='excelarsiv')process.exit(EXIT.CONFIG);if(process.env.SEO_REHEARSAL==='1'){runRehearsalStage('board');process.exit(EXIT.PASS);}let text=readFileSync(resolve(ROOT,'docs/seo/raporlar/BOARD_REPORT.md'),'utf8');if(arg('--fixture')==='missing-field')text=text.replace('6. KALİTE:','6. EKSİK:');const missing=validate(text);if(missing.length){console.error(`INV-19.2 board fields missing: ${missing.join(', ')}`);process.exit(EXIT.WARN)}console.log('SEO BOARD REPORT CONTRACT PASS — Ek I alanları tam');process.exit(EXIT.PASS)}catch(e){console.error(e instanceof Error?e.message:String(e));process.exit(EXIT.CONFIG)}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export{validate};
