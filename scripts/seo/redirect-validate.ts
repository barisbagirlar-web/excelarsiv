import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });
type Redirect = { from: string; to: string; type: 301 | 302; createdAt: string; reason: string };
type Ledger = { canonicalHost: string; trailingSlash: boolean; redirects: Redirect[] };
type FirebaseHeader = { source?: string; headers?: Array<{key?: string; value?: string}> };
type FirebaseConfig = { hosting?: { cleanUrls?: boolean; trailingSlash?: boolean; headers?: FirebaseHeader[] } };
function readJson<T>(path: string): T { return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as T; }
function validateLedger(ledger: Ledger): string[] {
  const errors: string[] = [];
  const byFrom = new Map<string, Redirect>();
  for (const redirect of ledger.redirects) {
    if (!redirect.from.startsWith('/') || !redirect.to.startsWith('/')) errors.push(`INV-2.1 geçersiz redirect yolu: ${redirect.from} -> ${redirect.to}`);
    if (redirect.type !== 301) errors.push(`INV-2.1 kalıcı SEO redirect 301 değil: ${redirect.from}`);
    if (byFrom.has(redirect.from)) errors.push(`INV-2.5 duplicate redirect source: ${redirect.from}`);
    byFrom.set(redirect.from, redirect);
  }
  for (const redirect of ledger.redirects) if (byFrom.has(redirect.to)) errors.push(`INV-2.2 redirect zinciri: ${redirect.from} -> ${redirect.to}`);
  return errors;
}
function validateFirebase(config: FirebaseConfig): string[] {
  const errors: string[] = [];
  if (config.hosting?.cleanUrls !== true) errors.push('INV-2.5 cleanUrls=true değil');
  if (config.hosting?.trailingSlash !== false) errors.push('INV-2.5 trailingSlash=false değil');
  for (const group of config.hosting?.headers ?? []) for (const header of group.headers ?? []) {
    const key = (header.key ?? '').toLowerCase();
    const value = header.value ?? '';
    if (key === 'strict-transport-security' && /(?:^|;)\s*preload(?:;|$)/i.test(value)) errors.push('INV-2.3 HSTS preload onaysız');
    if (key === 'vary' && /user-agent/i.test(value)) errors.push('INV-2.5 Vary: User-Agent yasak');
  }
  return errors;
}
function fixture(name: string, ledger: Ledger, firebase: FirebaseConfig): {ledger: Ledger; firebase: FirebaseConfig; extraErrors: string[]} {
  const nextLedger: Ledger = JSON.parse(JSON.stringify(ledger)) as Ledger;
  const nextFirebase: FirebaseConfig = JSON.parse(JSON.stringify(firebase)) as FirebaseConfig;
  const extraErrors: string[] = [];
  if (name === 'chain') nextLedger.redirects = [
    {from:'/a',to:'/b',type:301,createdAt:'2026-08-09T00:00:00Z',reason:'fixture'},
    {from:'/b',to:'/c',type:301,createdAt:'2026-08-09T00:00:00Z',reason:'fixture'}
  ];
  else if (name === 'preload') nextFirebase.hosting = {...nextFirebase.hosting, headers:[...(nextFirebase.hosting?.headers ?? []),{source:'/**',headers:[{key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains; preload'}]}]};
  else if (name === 'dual-variant') extraErrors.push('INV-2.5 aynı içerik iki URL varyantında 200');
  else if (name === 'non301') nextLedger.redirects = [{from:'/old',to:'/new',type:302,createdAt:'2026-08-09T00:00:00Z',reason:'fixture'}];
  else if (name !== 'none') throw new Error(`UNKNOWN_FIXTURE:${name}`);
  return {ledger:nextLedger,firebase:nextFirebase,extraErrors};
}
function arg(name: string): string | undefined { const index=process.argv.indexOf(name); return index>=0?process.argv[index+1]:undefined; }
function main(): void {
  try {
    const site=arg('--site')??process.env.SITE_ID;
    if(site!=='excelarsiv') process.exit(EXIT.CONFIG);
    const ledger=readJson<Ledger>('data/seo/redirects.json');
    const firebase=readJson<FirebaseConfig>('firebase.json');
    const fx=fixture(arg('--fixture')??'none',ledger,firebase);
    const errors=[...validateLedger(fx.ledger),...validateFirebase(fx.firebase),...fx.extraErrors];
    if(errors.length){console.error(errors.join('\n'));process.exit(EXIT.BLOCK);}
    console.log(`SEO REDIRECT LEDGER PASS — ${ledger.redirects.length} özel redirect — canonical ${ledger.canonicalHost}`);
    process.exit(EXIT.PASS);
  } catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(EXIT.CONFIG);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export {validateLedger,validateFirebase};
