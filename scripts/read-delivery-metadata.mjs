#!/usr/bin/env node
/**
 * TESLİMAT METADATA OKUYUCU — deterministik, bağımlılıksız.
 *
 * delivery/paid-products/<slug>/current.xlsx içindeki GERÇEK satış dosyasından
 * teknik metadata okur. Web'deki tüm teknik iddiaların kaynağı bu çıktıdır;
 * manuel/hardcoded değer build gate'inde bu çıktıyla karşılaştırılır.
 *
 * Çıktı (stdout): <slug> → { fileFormat, sizeBytes, sizeMB, sheetCount,
 * sheetNames[], hasMacros, storageKey }
 *
 * Kullanım:
 *   node scripts/read-delivery-metadata.mjs
 *   node scripts/read-delivery-metadata.mjs --json   # tek JSON obje
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import process from 'node:process';

const root = process.cwd();
const DELIVERY_DIR = join(root, 'delivery/paid-products');

/** ZIP central directory'den entry listesi + içerik çıkarır (xlsx OOXML). */
function readZipEntry(buffer, targetPath) {
  // EOCD: dosya sonundaki PK\x05\x06
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 65535); i--) {
    if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b && buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error('EOCD bulunamadı');

  const entryCount = buffer.readUInt16LE(eocd + 10);
  const cdOffset = buffer.readUInt32LE(eocd + 16);

  const names = [];
  const contents = new Map();
  let offset = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (buffer[offset] !== 0x50 || buffer[offset + 1] !== 0x4b || buffer[offset + 2] !== 0x01 || buffer[offset + 3] !== 0x02) {
      throw new Error(`Geçersiz central directory girişi @${offset}`);
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    names.push(name);

    const localHeader = localOffset;
    const localNameLen = buffer.readUInt16LE(localHeader + 26);
    const localExtraLen = buffer.readUInt16LE(localHeader + 28);
    const dataStart = localHeader + 30 + localNameLen + localExtraLen;
    const data = buffer.subarray(dataStart, dataStart + compSize);
    contents.set(
      name,
      method === 0 ? data : inflateRawSync(data),
    );
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return { names, contents };
}

function parseSheetNames(workbookXml) {
  // <sheet name="X" sheetId="N" r:id="rIdM"/> sıralı listesi
  const matches = [...workbookXml.toString('utf8').matchAll(/<sheet\s+name="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

function readProduct(slug) {
  const dir = join(DELIVERY_DIR, slug);
  const candidates = ['current.xlsx', 'current.xlsm'];
  const filePath = candidates.map((c) => join(dir, c)).find((p) => existsSync(p));
  if (!filePath) {
    throw new Error(`${slug}: delivery/paid-products/${slug}/current.xlsx bulunamadı. Gerçek satış dosyası eksik.`);
  }
  const bytes = readFileSync(filePath);
  const { names, contents } = readZipEntry(bytes, 'xl/workbook.xml');
  const workbookXml = contents.get('xl/workbook.xml');
  if (!workbookXml) {
    throw new Error(`${slug}: xl/workbook.xml okunamadı — geçersiz xlsx.`);
  }
  const sheetNames = parseSheetNames(workbookXml);
  const hasMacros = names.some((n) => n.includes('vbaProject.bin'));
  const fileFormat = filePath.endsWith('.xlsm') || hasMacros ? 'xlsm' : 'xlsx';
  return {
    slug,
    fileFormat,
    sizeBytes: statSync(filePath).size,
    sizeMB: Math.round((statSync(filePath).size / (1024 * 1024)) * 100) / 100,
    sheetCount: sheetNames.length,
    sheetNames,
    hasMacros,
    storageKey: `paid-products/${slug}/current.${fileFormat}`,
  };
}

const slugs = readdirSync(DELIVERY_DIR)
  .filter((name) => statSync(join(DELIVERY_DIR, name)).isDirectory())
  .sort();

const results = {};
for (const slug of slugs) {
  results[slug] = readProduct(slug);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const pad = (text, width) => String(text ?? '').padEnd(width);
  console.log(`${pad('SLUG', 46)} | ${pad('FMT', 5)} | ${pad('SIZE(MB)', 9)} | ${pad('SHEET', 5)} | ${pad('MACRO', 5)}`);
  console.log('-'.repeat(46 + 5 + 9 + 5 + 5 + 12));
  for (const r of Object.values(results)) {
    console.log(`${pad(r.slug, 46)} | ${pad(r.fileFormat, 5)} | ${pad(String(r.sizeMB), 9)} | ${pad(String(r.sheetCount), 5)} | ${pad(r.hasMacros ? 'EVET' : 'HAYIR', 5)}`);
  }
  console.log('-'.repeat(46 + 5 + 9 + 5 + 5 + 12));
  console.log(`TESLİMAT: ${Object.keys(results).length} dosya okundu.`);
}
