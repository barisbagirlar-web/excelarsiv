'use strict';

const crypto = require('node:crypto');
const { deflateRawSync } = require('node:zlib');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { PRODUCTS } = require('./catalog');
const { getProofDemoSpec } = require('./proof-demo-specs');
const { _test: v31 } = require('./proof-demo-v31');

const REGION = 'europe-west1';
const VERSION = '3.2';
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

const SHEET_PROTECTION_RE = /<sheetProtection\b[^>]*(?:\/>|>[\s\S]*?<\/sheetProtection>)/g;
const ELEMENT_AFTER_PROTECTION_RE = /<(?:protectedRanges|scenarios|autoFilter|sortState|dataConsolidate|customSheetViews|mergeCells|phoneticPr|conditionalFormatting|dataValidations|hyperlinks|printOptions|pageMargins|pageSetup|headerFooter|rowBreaks|colBreaks|customProperties|cellWatches|ignoredErrors|smartTags|drawing|legacyDrawing|legacyDrawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b/;

function normalizeWorksheetProtectionOrder(xml) {
  const source = String(xml);
  const protections = source.match(SHEET_PROTECTION_RE) || [];
  if (protections.length === 0) return source;
  if (protections.length !== 1) throw new Error('MULTIPLE_SHEET_PROTECTION_NODES');
  if (!source.includes('</sheetData>')) throw new Error('MISSING_SHEET_DATA');

  const withoutProtection = source.replace(SHEET_PROTECTION_RE, '');
  const normalized = withoutProtection.replace('</sheetData>', `</sheetData>${protections[0]}`);
  assertWorksheetProtectionOrder(normalized);
  return normalized;
}

function assertWorksheetProtectionOrder(xml) {
  const source = String(xml);
  const protectionIndex = source.search(/<sheetProtection\b/);
  if (protectionIndex < 0) return true;

  const sheetDataEnd = source.indexOf('</sheetData>');
  if (sheetDataEnd < 0 || protectionIndex < sheetDataEnd) throw new Error('SHEET_PROTECTION_BEFORE_SHEET_DATA_END');

  const tail = source.slice(sheetDataEnd + '</sheetData>'.length);
  const protectionOffset = tail.search(/<sheetProtection\b/);
  const followingElementOffset = tail.search(ELEMENT_AFTER_PROTECTION_RE);
  if (followingElementOffset >= 0 && followingElementOffset < protectionOffset) {
    throw new Error('SHEET_PROTECTION_SCHEMA_ORDER_INVALID');
  }
  return true;
}

function normalizeDxfChildOrder(stylesXml) {
  // ECMA-376 CT_Dxf sequence: font, numFmt, fill, alignment, border, protection.
  // fill-before-font triggers Microsoft Excel "recover workbook" dialog.
  return String(stylesXml).replace(/<dxf>([\s\S]*?)<\/dxf>/g, (all, body) => {
    const font = body.match(/<font\b[\s\S]*?<\/font>/);
    const fill = body.match(/<fill\b[\s\S]*?<\/fill>/);
    if (!font || !fill) return all;
    const fontIndex = body.indexOf(font[0]);
    const fillIndex = body.indexOf(fill[0]);
    if (fontIndex < fillIndex) return all;
    const rest = body.replace(font[0], '').replace(fill[0], '');
    return `<dxf>${font[0]}${fill[0]}${rest}</dxf>`;
  });
}

function assertDxfChildOrder(stylesXml) {
  const source = String(stylesXml);
  for (const match of source.matchAll(/<dxf>([\s\S]*?)<\/dxf>/g)) {
    const body = match[1];
    const fontIndex = body.search(/<font\b/);
    const fillIndex = body.search(/<fill\b/);
    if (fontIndex >= 0 && fillIndex >= 0 && fillIndex < fontIndex) {
      throw new Error('DXF_CHILD_ORDER_INVALID');
    }
  }
  return true;
}

function normalizeWorkbookElementOrder(xml) {
  let out = String(xml);
  // ECMA-376: workbookPr → workbookProtection → bookViews → sheets
  out = out.replace(
    /(<bookViews>[\s\S]*?<\/bookViews>)(<workbookProtection\b[^>]*\/>)/,
    '$2$1',
  );
  return out;
}

function assertWorkbookElementOrder(xml) {
  const source = String(xml);
  const pr = source.search(/<workbookPr\b/);
  const protection = source.search(/<workbookProtection\b/);
  const views = source.search(/<bookViews\b/);
  const sheets = source.search(/<sheets\b/);
  if (pr < 0 || sheets < 0) throw new Error('WORKBOOK_MISSING_REQUIRED_NODES');
  if (protection >= 0 && views >= 0 && views < protection) {
    throw new Error('WORKBOOK_PROTECTION_SCHEMA_ORDER_INVALID');
  }
  if (protection >= 0 && protection < pr) throw new Error('WORKBOOK_PROTECTION_BEFORE_WORKBOOK_PR');
  if (views >= 0 && views > sheets) throw new Error('BOOK_VIEWS_AFTER_SHEETS');
  return true;
}

function normalizeProofDemoBuffer(buffer) {
  const entries = v31.unzipLocalEntries(buffer);
  const worksheetPaths = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.path));
  if (worksheetPaths.length !== 8) throw new Error(`UNEXPECTED_WORKSHEET_COUNT_${worksheetPaths.length}`);

  const normalized = entries.map((entry) => {
    if (entry.path === 'xl/styles.xml') {
      const xml = normalizeDxfChildOrder(entry.data.toString('utf8'));
      assertDxfChildOrder(xml);
      return { ...entry, data: Buffer.from(xml, 'utf8') };
    }
    if (entry.path === 'xl/workbook.xml') {
      const xml = normalizeWorkbookElementOrder(entry.data.toString('utf8'));
      assertWorkbookElementOrder(xml);
      return { ...entry, data: Buffer.from(xml, 'utf8') };
    }
    if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(entry.path)) return entry;
    const xml = normalizeWorksheetProtectionOrder(entry.data.toString('utf8'));
    return { ...entry, data: Buffer.from(xml, 'utf8') };
  });

  for (const entry of normalized) {
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(entry.path)) {
      assertWorksheetProtectionOrder(entry.data.toString('utf8'));
    }
    if (entry.path === 'xl/styles.xml') assertDxfChildOrder(entry.data.toString('utf8'));
    if (entry.path === 'xl/workbook.xml') assertWorkbookElementOrder(entry.data.toString('utf8'));
  }
  return zip(normalized);
}

function buildProofDemo(args) {
  return normalizeProofDemoBuffer(v31.buildProofDemo(args));
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
    console.error('proof demo v3.2 generation failed', error?.message);
    return sendJson(res, 500, { error: 'DEMO_GENERATION_FAILED' });
  }

  const filename = `${demo.productSlug}-proof-demo-v3-2.xlsx`;
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
    normalizeWorksheetProtectionOrder,
    assertWorksheetProtectionOrder,
    normalizeDxfChildOrder,
    assertDxfChildOrder,
    normalizeWorkbookElementOrder,
    assertWorkbookElementOrder,
    normalizeProofDemoBuffer,
    buildProofDemo,
  },
};
