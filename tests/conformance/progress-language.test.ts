import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT=resolve(import.meta.dirname,'../..');
const text=readFileSync(resolve(ROOT,'docs/seo/PROGRESS.md'),'utf8');

test('progress keeps machine metadata parseable',()=>{
  const match=text.match(/<!--\s*SEO_PROGRESS\s+(\{[^\n]+\})\s*-->/);
  assert.ok(match?.[1],'SEO_PROGRESS metadata');
  const meta=JSON.parse(match![1]!);
  assert.equal(meta.siteId,'excelarsiv');
  assert.equal(meta.bootstrap,'completed');
});

test('phase table has exactly 20 unique phase rows with approved two-dimensional states',()=>{
  const rows=[...text.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+)\|\s*([^|]+)\|/gm)].map(m=>({phase:Number(m[1]),implementation:m[2]!.trim(),measurement:m[3]!.trim()}));
  assert.equal(rows.length,20,'20 phase rows');
  assert.deepEqual(rows.map(r=>r.phase),Array.from({length:20},(_,i)=>i),'ordered phases 0..19');
  for(const row of rows){
    if(row.phase<=8){assert.equal(row.implementation,'scaffold_complete');assert.equal(row.measurement,'measurement_active');}
    else if(row.phase<=16){assert.equal(row.implementation,'scaffold_complete');assert.equal(row.measurement,'measurement_dormant');}
    else {assert.equal(row.implementation,'readiness_fail_closed');assert.equal(row.measurement,'measurement_dormant');}
  }
});

test('report cannot collapse scaffold into completed measurement language',()=>{
  assert.doesNotMatch(text,/IMPLEMENTATION COMPLETED/);
  assert.match(text,/saha ölçümü tamamlandı anlamında kullanmaz/);
  assert.match(text,/measurement_dormant/);
});
