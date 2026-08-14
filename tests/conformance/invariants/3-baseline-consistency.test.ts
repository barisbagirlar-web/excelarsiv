import test from 'node:test';
import assert from 'node:assert/strict';
import {
  baselineSnapshotFingerprint,
  fetchLiveBaseline,
  validateBaselineIndexEntries,
} from '../../../scripts/seo/finalize-sitemap-index.mjs';

const SITE = 'https://excelarsiv.com';
const LM = '2026-08-10T02:44:06.136Z';
const CHILD = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc><lastmod>2026-08-10</lastmod></url></urlset>`;
function index(lastmod=LM){return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE}/sitemap-pages.xml</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}</sitemap></sitemapindex>`;}
function response(status:number,text:string){return {status,text:async()=>text} as Response;}

test('S23 semantic baseline: missing child lastmod is rejected before preserve logic',()=>{
  assert.throws(()=>validateBaselineIndexEntries([{loc:`${SITE}/sitemap-pages.xml`,lastmod:null}],{baseUrl:SITE,nowMs:Date.parse('2026-08-10T03:00:00Z')}),/BASELINE_UNKNOWN/);
});

test('S23 semantic baseline: fingerprint is order deterministic and content sensitive',()=>{
  const a={kind:'ready',baseline:{index:{children:[{loc:`${SITE}/b.xml`,lastmod:LM,sha256:'b',urlCount:1},{loc:`${SITE}/a.xml`,lastmod:LM,sha256:'a',urlCount:1}]}}};
  const b={kind:'ready',baseline:{index:{children:[{loc:`${SITE}/a.xml`,lastmod:LM,sha256:'a',urlCount:1},{loc:`${SITE}/b.xml`,lastmod:LM,sha256:'b',urlCount:1}]}}};
  const c={kind:'ready',baseline:{index:{children:[{loc:`${SITE}/a.xml`,lastmod:LM,sha256:'changed',urlCount:1},{loc:`${SITE}/b.xml`,lastmod:LM,sha256:'b',urlCount:1}]}}};
  assert.equal(baselineSnapshotFingerprint(a),baselineSnapshotFingerprint(b));
  assert.notEqual(baselineSnapshotFingerprint(a),baselineSnapshotFingerprint(c));
});

test('S23 semantic baseline: stale HTTP 200 is retried until two consecutive valid identical snapshots',async()=>{
  const original=globalThis.fetch;
  let rootCalls=0;
  globalThis.fetch=async(input)=>{
    const url=String(input);
    if(url===`${SITE}/sitemap.xml`){
      rootCalls++;
      if(rootCalls===1)return response(200,index(''));
      return response(200,index());
    }
    if(url===`${SITE}/sitemap-pages.xml`)return response(200,CHILD);
    return response(404,'');
  };
  try{
    const baseline=await fetchLiveBaseline({baseUrl:SITE,logger:{...console,log:()=>{}},attempts:4,delayMs:0,timeoutMs:1000});
    assert.equal(rootCalls,3);
    assert.equal(baseline.index.children.length,1);
    assert.equal(baseline.index.children[0]?.lastmod,LM);
  }finally{globalThis.fetch=original;}
});

test('S23 semantic baseline: alternating edge snapshots never become trusted baseline',async()=>{
  const original=globalThis.fetch;
  let rootCalls=0;
  globalThis.fetch=async(input)=>{
    const url=String(input);
    if(url===`${SITE}/sitemap.xml`){
      rootCalls++;
      const lm=rootCalls%2?LM:'2026-08-10T02:45:06.136Z';
      return response(200,index(lm));
    }
    if(url===`${SITE}/sitemap-pages.xml`)return response(200,CHILD);
    return response(404,'');
  };
  try{
    await assert.rejects(fetchLiveBaseline({baseUrl:SITE,logger:{...console,log:()=>{}},attempts:4,delayMs:0,timeoutMs:1000}),/BASELINE_UNKNOWN/);
  }finally{globalThis.fetch=original;}
});
