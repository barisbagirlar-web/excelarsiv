import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
test('INV-X.5 negatif fixture gerçek exit 1',()=>{const r=spawnSync(process.execPath,['--experimental-strip-types',resolve(ROOT,'scripts/seo/rule-probe.ts'),'--rule','hardcoded-threshold','--value','if (inpP75Ms > 200) fail()'],{cwd:ROOT,encoding:'utf8'});assert.equal(r.status,1,r.stderr);});
