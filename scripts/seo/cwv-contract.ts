import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const EXIT=Object.freeze({PASS:0,BLOCK:1,MISSING_DATA:3,CONFIG:4});
type Config={thresholds:{lcpP75Ms:number;inpP75Ms:number;clsP75:number}};
type Field={lcpP75Ms:number;inpP75Ms:number;clsP75:number;remediationPr:boolean};
function breaches(field:Field,config:Config):boolean{return field.lcpP75Ms>config.thresholds.lcpP75Ms||field.inpP75Ms>config.thresholds.inpP75Ms||field.clsP75>config.thresholds.clsP75;}
function arg(name:string):string|undefined{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
function main():void{try{if((arg('--site')??process.env.SITE_ID)!=='excelarsiv')process.exit(EXIT.CONFIG);const config=JSON.parse(readFileSync(resolve(ROOT,'seo.config.defaults.json'),'utf8')) as Config;const fixture=arg('--fixture');let field:Field|null=null;if(fixture==='breach-no-remediation')field={lcpP75Ms:config.thresholds.lcpP75Ms+1,inpP75Ms:config.thresholds.inpP75Ms,clsP75:config.thresholds.clsP75,remediationPr:false};else if(fixture==='breach-remediated')field={lcpP75Ms:config.thresholds.lcpP75Ms+1,inpP75Ms:config.thresholds.inpP75Ms,clsP75:config.thresholds.clsP75,remediationPr:true};else if(fixture)throw new Error(`UNKNOWN_FIXTURE:${fixture}`);else{const path=resolve(ROOT,'data/seo/cwv_field.json');if(!existsSync(path)){console.error('CWV_FIELD_DATA_MISSING');process.exit(EXIT.MISSING_DATA);}field=JSON.parse(readFileSync(path,'utf8')) as Field;}if(breaches(field,config)&&!field.remediationPr){console.error('INV-7.2 CWV breach + remediation PR yok');process.exit(EXIT.BLOCK);}console.log('SEO CWV CONTRACT PASS');process.exit(EXIT.PASS);}catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export{breaches};
