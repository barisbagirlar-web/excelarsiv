import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('../../../',import.meta.url)));

test('package içindeki SEO script hedeflerinin tamamı repoda vardır',()=>{
  const pkg=JSON.parse(readFileSync(resolve(ROOT,'package.json'),'utf8')) as {scripts:Record<string,string>};
  const missing:string[]=[];
  for(const [name,command] of Object.entries(pkg.scripts)){
    if(!name.startsWith('seo:')) continue;
    const targets=[...command.matchAll(/scripts\/seo\/[A-Za-z0-9._-]+\.(?:ts|mjs)/g)].map(x=>x[0]);
    for(const target of targets) if(!existsSync(resolve(ROOT,target))) missing.push(`${name}:${target}`);
  }
  assert.deepEqual(missing,[]);
});
