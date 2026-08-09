import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT=resolve(import.meta.dirname,'../..');
const expected=JSON.parse(readFileSync(resolve(ROOT,'tests/fixtures/seo-rehearsal/expected.json'),'utf8')) as any;
function jsonFiles(dir:string):string[]{const out:string[]=[];for(const name of readdirSync(dir)){const path=join(dir,name);const st=statSync(path);if(st.isDirectory())out.push(...jsonFiles(path));else if(name.endsWith('.json'))out.push(path);}return out;}
function run(script:string,out:string){const r=spawnSync('npm',['run',script],{cwd:ROOT,encoding:'utf8',env:{...process.env,SEO_REHEARSAL:'1',SEO_REHEARSAL_OUT:out}});assert.equal(r.status,0,`${script}\n${r.stdout}\n${r.stderr}`);}

test('rehearsal runs pnl -> kac -> slo -> board and matches deterministic snapshot',()=>{
  const out=mkdtempSync(join(tmpdir(),'excelarsiv-seo-rehearsal-'));
  try{
    for(const script of ['seo:pnl','seo:kac','seo:slo','seo:board'])run(script,out);
    for(const stage of ['pnl','kac','slo','board']){
      const actual=JSON.parse(readFileSync(join(out,`${stage}.json`),'utf8')) as any;
      assert.equal(actual.meta.synthetic,true,`${stage}: synthetic flag`);
      assert.equal(actual.meta.coldStart,true,`${stage}: coldStart flag`);
      assert.equal(actual.meta.confidence,'low',`${stage}: cold-start confidence`);
      assert.equal(actual.meta.siteId,'excelarsiv',`${stage}: siteId`);
      if(stage==='pnl')assert.deepEqual(actual.totals,expected.pnl.totals);
      if(stage==='kac')assert.deepEqual(actual.ranking,expected.kac.ranking);
      if(stage==='slo'){assert.deepEqual(actual.p75,expected.slo.p75);assert.deepEqual(actual.status,expected.slo.status);}
      if(stage==='board')assert.deepEqual(actual.summary,expected.board.summary);
    }
  }finally{rmSync(out,{recursive:true,force:true});}
});

test('production SEO artifacts reject synthetic leakage',()=>{
  const root=resolve(ROOT,'data/seo');
  for(const path of jsonFiles(root)){
    const value=JSON.parse(readFileSync(path,'utf8')) as any;
    assert.notEqual(value?.synthetic,true,`${path}: top-level synthetic leak`);
    assert.notEqual(value?.meta?.synthetic,true,`${path}: production artifact synthetic leak`);
  }
});
