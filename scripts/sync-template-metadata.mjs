#!/usr/bin/env node
/**
 * MDX teknik metadata ← delivery/paid-products gerçek xlsx senkronu.
 * sheetCount / sizeMB / fileFormat / hasMacros / sheetMap ad sırasını gerçek dosyaya hizalar.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const templatesDir = join(root, 'src/content/templates');
const deliveryProc = spawnSync(process.execPath, [join('scripts', 'read-delivery-metadata.mjs'), '--json'], {
  cwd: root,
  encoding: 'utf8',
});
if (deliveryProc.status !== 0) {
  console.error(deliveryProc.stderr || deliveryProc.stdout);
  process.exit(1);
}
const delivery = JSON.parse(deliveryProc.stdout);

function inferKind(name) {
  const n = name.toLocaleUpperCase('tr-TR');
  if (/(GIRIS|GIRDİ|GIRDI|VERI|VERİ|PUANTAJ|HAREKET|LISTE|LISTELER|AYAR|PARAM|ORNEK)/.test(n)) return 'input';
  if (/(MOTOR|HESAP|KONTROL|KARAR|SENARYO|DUYARLILIK|MOTORU)/.test(n)) return 'calculation';
  return 'output';
}

function inferPurpose(name) {
  return `${name.replaceAll('_', ' ')} çalışma sayfası`;
}

function syncFrontmatter(source, real) {
  let next = source;
  next = next.replace(/^sheetCount:\s*\d+\s*$/m, `sheetCount: ${real.sheetCount}`);
  next = next.replace(/^sizeMB:\s*[\d.]+\s*$/m, `sizeMB: ${real.sizeMB}`);
  next = next.replace(/^fileFormat:\s*['"]?(xlsx|xlsm)['"]?\s*$/m, `fileFormat: ${real.fileFormat}`);
  next = next.replace(/^hasMacros:\s*(true|false)\s*$/m, `hasMacros: ${real.hasMacros}`);

  const existing = new Map();
  for (const match of source.matchAll(/- name:\s*'([^']+)'\s*\n\s*purpose:\s*'([^']*)'\s*\n\s*kind:\s*'([^']+)'/g)) {
    existing.set(match[1], { purpose: match[2], kind: match[3] });
  }

  const sheetMapBlock = real.sheetNames
    .map((name) => {
      const prev = existing.get(name);
      const purpose = prev?.purpose ?? inferPurpose(name);
      const kind = prev?.kind ?? inferKind(name);
      return `  - name: '${name}'\n    purpose: '${purpose.replaceAll("'", "''")}'\n    kind: '${kind}'`;
    })
    .join('\n');

  if (!/^sheetMap:\s*$/m.test(next) && !/^sheetMap:\s*\n/m.test(next)) {
    throw new Error('sheetMap bloğu bulunamadı');
  }

  next = next.replace(
    /^sheetMap:\s*\n(?:[ \t]+- name:.*\n(?:[ \t]+(?:purpose|kind):.*\n)*)+/m,
    `sheetMap:\n${sheetMapBlock}\n`,
  );
  return next;
}

let changed = 0;
for (const file of readdirSync(templatesDir).filter((f) => f.endsWith('.mdx')).sort()) {
  const slug = file.replace(/\.mdx$/, '');
  const real = delivery[slug];
  if (!real) continue;
  const path = join(templatesDir, file);
  const source = readFileSync(path, 'utf8');
  const next = syncFrontmatter(source, real);
  if (next !== source) {
    writeFileSync(path, next);
    changed += 1;
    console.log(`SYNC ${slug} → sheets=${real.sheetCount} sizeMB=${real.sizeMB}`);
  }
}
console.log(`TEMPLATE METADATA SYNC — ${changed} dosya güncellendi`);
