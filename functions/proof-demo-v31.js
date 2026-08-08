'use strict';

const crypto = require('node:crypto');
const { deflateRawSync, inflateRawSync } = require('node:zlib');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { PRODUCTS } = require('./catalog');
const { getProofDemoSpec } = require('./proof-demo-specs');
const { _test: v3 } = require('./proof-demo-v3');

const REGION = 'europe-west1';
const VERSION = '3.1';
const SHEET_PASSWORD_HASH = 'CC3D';
const functionDefaults = { region: REGION, maxInstances: 20, timeoutSeconds: 30, memory: '256MiB' };

function sendJson(res, status, payload) {
  res.status(status);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.send(JSON.stringify(payload));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function unzipLocalEntries(buffer) {
  const entries = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) throw new Error(`INVALID_LOCAL_ZIP_HEADER_${offset}`);

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) throw new Error('TRUNCATED_ZIP_ENTRY');

    const path = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const compressed = buffer.subarray(dataStart, dataEnd);
    const data = method === 0 ? Buffer.from(compressed) : method === 8 ? inflateRawSync(compressed) : null;
    if (!data) throw new Error(`UNSUPPORTED_ZIP_METHOD_${method}`);
    entries.push({ path, data });
    offset = dataEnd;
  }
  return entries;
}

function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.path, 'utf8');
    const compressed = deflateRawSync(entry.data);
    const crc = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, compressed);
    central.push({ nameBuf, crc, comp: compressed.length, uncomp: entry.data.length, offset });
    offset += 30 + nameBuf.length + compressed.length;
  }

  const cdStart = offset;
  for (const item of central) {
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(item.crc, 16);
    cd.writeUInt32LE(item.comp, 20);
    cd.writeUInt32LE(item.uncomp, 24);
    cd.writeUInt16LE(item.nameBuf.length, 28);
    cd.writeUInt32LE(item.offset, 42);
    chunks.push(cd, item.nameBuf);
    offset += 46 + item.nameBuf.length;
  }

  const cdSize = offset - cdStart;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(cdStart, 16);
  chunks.push(end);
  return Buffer.concat(chunks);
}

function patchStylesXml(xml) {
  let out = String(xml);
  const fillsStart = '<fills count="11"><fill><patternFill patternType="none"/></fill>';
  if (!out.includes(fillsStart)) throw new Error('UNEXPECTED_STYLES_FILLS');

  out = out.replace(
    fillsStart,
    '<fills count="12"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>',
  );

  out = out.replace(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/, (_all, count, body) => {
    const shifted = body.replace(/fillId="(\d+)"/g, (_m, idText) => {
      const id = Number(idText);
      return `fillId="${id === 0 ? 0 : id + 1}"`;
    });
    return `<cellXfs count="${count}">${shifted}</cellXfs>`;
  });

  return out;
}

function patchWorkbookXml(xml) {
  let out = String(xml);
  if (!out.includes('<bookViews>')) {
    out = out.replace('<workbookPr date1904="0"/>', '<workbookPr date1904="0"/><bookViews><workbookView activeTab="0"/></bookViews>');
  }
  return out;
}

function patchWorksheetXml(xml, sheetNumber) {
  let out = String(xml);

  // Keep protection simple and Excel-compatible. Premium IP is protected by absence,
  // not by relying on worksheet protection as a security boundary.
  out = out.replace(
    /<sheetProtection[^>]*\/>/g,
    `<sheetProtection password="${SHEET_PASSWORD_HASH}" sheet="1" selectLockedCells="1" selectUnlockedCells="0"/>`,
  );

  // DEMO_GIRIS is sheet 3. The v3 generator intentionally copied calculated-column
  // formulas down all 20 demo rows. In empty rows this looked like fabricated data.
  // Remove formulas from rows whose first input cell is empty.
  if (sheetNumber === 3) {
    out = out.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, (rowAll, rowText, rowAttrs, cells) => {
      const row = Number(rowText);
      if (row < 6 || row > 25) return rowAll;
      const firstCell = cells.match(new RegExp(`<c r="A${row}"[^>]*(?:\\/>|>[\\s\\S]*?<\\/c>)`));
      const firstHasValue = firstCell && !/\/>$/.test(firstCell[0]) && (/<v>/.test(firstCell[0]) || /<is>/.test(firstCell[0]));
      if (firstHasValue) return rowAll;
      const cleaned = cells.replace(
        new RegExp(`<c r="([A-Z]+${row})"([^>]*)><f>[\\s\\S]*?<\\/f><\\/c>`, 'g'),
        '<c r="$1"$2/>',
      );
      return `<row r="${row}"${rowAttrs}>${cleaned}</row>`;
    });
  }

  return out;
}

function patchProofDemoBuffer(buffer) {
  const entries = unzipLocalEntries(buffer);
  const seen = new Set(entries.map((entry) => entry.path));
  const required = [
    'xl/workbook.xml',
    'xl/styles.xml',
    ...Array.from({ length: 8 }, (_unused, index) => `xl/worksheets/sheet${index + 1}.xml`),
  ];
  for (const path of required) if (!seen.has(path)) throw new Error(`MISSING_REQUIRED_PART_${path}`);

  const patched = entries.map((entry) => {
    if (entry.path === 'xl/styles.xml') return { ...entry, data: Buffer.from(patchStylesXml(entry.data.toString('utf8')), 'utf8') };
    if (entry.path === 'xl/workbook.xml') return { ...entry, data: Buffer.from(patchWorkbookXml(entry.data.toString('utf8')), 'utf8') };
    const match = /^xl\/worksheets\/sheet(\d+)\.xml$/.exec(entry.path);
    if (match) return { ...entry, data: Buffer.from(patchWorksheetXml(entry.data.toString('utf8'), Number(match[1])), 'utf8') };
    return entry;
  });

  return zip(patched);
}

function buildProofDemo(args) {
  return patchProofDemoBuffer(v3.buildProofDemo(args));
}

const downloadProofDemo = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  const token = String(req.query?.token ?? '');
  if (token.length < 32 || token.length > 128) return sendJson(res, 400, { error: 'INVALID_TOKEN' });

  const db = getFirestore();
  const tokenHash = sha256(token);
  const ref = db.collection('excelarsiv_demo_tokens').doc(tokenHash);
  let demo = null;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const error = new Error('TOKEN_NOT_FOUND');
        error.code = 'TOKEN_NOT_FOUND';
        throw error;
      }
      const data = snap.data();
      if (data.used || data.expiresAt?.toMillis?.() <= Date.now()) {
        const error = new Error('TOKEN_EXPIRED');
        error.code = 'TOKEN_EXPIRED';
        throw error;
      }
      demo = data;
      tx.update(ref, { used: true, usedAt: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error?.code === 'TOKEN_NOT_FOUND') return sendJson(res, 404, { error: 'TOKEN_NOT_FOUND' });
    if (error?.code === 'TOKEN_EXPIRED') return sendJson(res, 410, { error: 'TOKEN_EXPIRED' });
    console.error('demo token transaction failed', error?.message);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }

  const product = PRODUCTS[demo.productSlug];
  const spec = getProofDemoSpec(demo.productSlug);
  if (!product || !spec || product.name !== demo.productName) return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });

  let buffer;
  try {
    buffer = buildProofDemo({
      productSlug: demo.productSlug,
      productName: product.name,
      priceTL: product.priceTL,
      demoId: demo.demoId,
      emailFingerprint: demo.emailFingerprint,
    });
  } catch (error) {
    console.error('proof demo v3.1 generation failed', error?.message);
    return sendJson(res, 500, { error: 'DEMO_GENERATION_FAILED' });
  }

  const filename = `${demo.productSlug}-proof-demo-v3-1.xlsx`;
  res.status(200);
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.set('Content-Length', String(buffer.length));
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('X-ExcelArsiv-Demo-Id', demo.demoId);
  res.set('X-ExcelArsiv-Demo-Version', VERSION);
  res.end(buffer);
});

module.exports = {
  downloadProofDemo,
  _test: {
    unzipLocalEntries,
    patchStylesXml,
    patchWorkbookXml,
    patchWorksheetXml,
    patchProofDemoBuffer,
    buildProofDemo,
  },
};
