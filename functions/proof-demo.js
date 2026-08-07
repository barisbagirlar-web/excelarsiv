'use strict';

const crypto = require('node:crypto');
const { deflateRawSync } = require('node:zlib');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { PRODUCTS } = require('./catalog');
const { getProofDemoSpec } = require('./proof-demo-specs');

const REGION = 'europe-west1';
const DEMO_TOKEN_TTL_MS = 10 * 60 * 1000;
const MAX_DEMOS_PER_IP_HOUR = 8;
const MAX_DEMOS_PER_EMAIL_DAY = 5;
const MAX_DEMO_ROWS = 20;
const SHEET_PASSWORD_HASH = 'CC3D'; // Excel legacy hash: 1234. IP koruması değildir; UX korumasıdır.

const functionDefaults = {
  region: REGION,
  maxInstances: 20,
  timeoutSeconds: 30,
  memory: '256MiB',
};

function sendJson(res, status, payload) {
  res.status(status);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.send(JSON.stringify(payload));
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
}

async function enforceDemoRateLimit(req, emailHash) {
  const db = getFirestore();
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const day = Math.floor(now / 86_400_000);
  const ipRef = db.collection('excelarsiv_demo_rate_limits').doc(`ip_${sha256(`${getClientIp(req)}|${hour}`)}`);
  const emailRef = db.collection('excelarsiv_demo_rate_limits').doc(`mail_${sha256(`${emailHash}|${day}`)}`);

  await db.runTransaction(async (tx) => {
    const [ipSnap, emailSnap] = await Promise.all([tx.get(ipRef), tx.get(emailRef)]);
    const ipCount = ipSnap.exists ? Number(ipSnap.data()?.count ?? 0) : 0;
    const emailCount = emailSnap.exists ? Number(emailSnap.data()?.count ?? 0) : 0;
    if (ipCount >= MAX_DEMOS_PER_IP_HOUR || emailCount >= MAX_DEMOS_PER_EMAIL_DAY) {
      const error = new Error('DEMO_RATE_LIMITED');
      error.code = 'DEMO_RATE_LIMITED';
      throw error;
    }
    tx.set(ipRef, {
      count: ipCount + 1,
      expiresAt: Timestamp.fromMillis((hour + 2) * 3_600_000),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(emailRef, {
      count: emailCount + 1,
      expiresAt: Timestamp.fromMillis((day + 2) * 86_400_000),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// ---------------------------------------------------------------------------
// Minimal OOXML / ZIP üretici. Dış bağımlılık yok; demo runtime'da oluşturulur.
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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
  }
  const cdSize = chunks.reduce((sum, b) => sum + b.length, 0) - cdStart;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(cdStart, 16);
  chunks.push(end);
  return Buffer.concat(chunks);
}

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function colRef(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function shiftFormula(formula, delta) {
  if (!formula || !formula.startsWith('=') || delta === 0) return formula;
  return formula.replace(/(\$?[A-Z]{1,3}\$?)(\d+)/g, (_m, col, row) => `${col}${Math.max(1, Number(row) + delta)}`);
}

function cellXml(rowIndex, colIndex, cell) {
  const ref = `${colRef(colIndex)}${rowIndex + 1}`;
  const style = Number.isInteger(cell?.s) ? ` s="${cell.s}"` : '';
  const value = cell?.v;
  if (value === null || value === undefined || value === '') return `<c r="${ref}"${style}/>`;
  if (typeof value === 'number') return `<c r="${ref}"${style} t="n"><v>${value}</v></c>`;
  if (typeof value === 'string' && value.startsWith('=')) {
    return `<c r="${ref}"${style}><f>${esc(value.slice(1))}</f></c>`;
  }
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml(sheet) {
  const lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
  lines.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  lines.push('<sheetViews><sheetView workbookViewId="0" showGridLines="0">');
  if (sheet.freeze) lines.push(`<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/>`);
  lines.push('</sheetView></sheetViews>');
  lines.push('<sheetFormatPr defaultRowHeight="18"/>');
  lines.push('<cols>');
  (sheet.widths ?? [24, 22, 22, 22, 22]).forEach((width, i) => {
    lines.push(`<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`);
  });
  lines.push('</cols><sheetData>');
  sheet.rows.forEach((row, ri) => {
    lines.push(`<row r="${ri + 1}"${ri === 0 ? ' ht="30" customHeight="1"' : ''}>${row.map((cell, ci) => cellXml(ri, ci, cell)).join('')}</row>`);
  });
  lines.push('</sheetData>');
  if (sheet.merges?.length) {
    lines.push(`<mergeCells count="${sheet.merges.length}">${sheet.merges.map((r) => `<mergeCell ref="${r}"/>`).join('')}</mergeCells>`);
  }
  if (sheet.protected) {
    lines.push(`<sheetProtection password="${SHEET_PASSWORD_HASH}" sheet="1" objects="1" scenarios="1" formatCells="1" formatColumns="1" formatRows="1" insertColumns="1" deleteColumns="1" deleteRows="1" selectLockedCells="1"/>`);
  }
  lines.push('</worksheet>');
  return lines.join('');
}

function workbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr date1904="0"/>
  <sheets>${sheets.map((sheet, i) => `<sheet name="${esc(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
  <calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>
</workbook>`;
}

function workbookRels(sheetCount) {
  const rels = [];
  for (let i = 0; i < sheetCount; i++) {
    rels.push(`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`);
  }
  rels.push(`<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
}

function contentTypes(sheetCount) {
  const overrides = [];
  for (let i = 0; i < sheetCount; i++) {
    overrides.push(`<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides.join('')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3">
<numFmt numFmtId="164" formatCode="₺ #,##0.00;[Red](₺ #,##0.00);-"/>
<numFmt numFmtId="165" formatCode="0.0%"/>
<numFmt numFmtId="166" formatCode="0.00"/>
</numFmts>
<fonts count="4">
<font><sz val="10"/><name val="Segoe UI"/></font>
<font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
<font><b/><sz val="11"/><color rgb="FF0F2742"/><name val="Segoe UI"/></font>
</fonts>
<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0F2742"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F7"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFB08948"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF7F9FC"/></patternFill></fill>
</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD6DCE5"/></left><right style="thin"><color rgb="FFD6DCE5"/></right><top style="thin"><color rgb="FFD6DCE5"/></top><bottom style="thin"><color rgb="FFD6DCE5"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
<xf numFmtId="0" fontId="0" fillId="6" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyProtection="1"><protection locked="0"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyProtection="1"><protection locked="0"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0"/>
<xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0"/>
<xf numFmtId="166" fontId="0" fillId="4" borderId="1" xfId="0"/>
<xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
</cellXfs>
</styleSheet>`;
}

function coreXml(productName, demoId) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
<dc:title>${esc(`${productName} — Proof Demo`)}</dc:title><dc:creator>Excel Arşiv</dc:creator><cp:keywords>PROOF DEMO; ${esc(demoId)}; TİCARİ KULLANIM İÇİN DEĞİLDİR</cp:keywords><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${now}</dcterms:created></cp:coreProperties>`;
}

function appXml() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Excel Arşiv Proof Demo Engine</Application></Properties>';
}

const C = (v, s = 0) => ({ v, s });

function formatStyle(type) {
  if (type === 'para') return 6;
  if (type === 'yuzde') return 7;
  if (type === 'oran') return 8;
  return 5;
}

function makeWorkbookModel({ productSlug, productName, priceTL, demoId, emailFingerprint }) {
  const spec = getProofDemoSpec(productSlug);
  if (!spec) throw new Error('UNKNOWN_DEMO_SPEC');
  const watermark = `PROOF DEMO · Ticari kullanım için değildir · Demo ID ${demoId} · E-posta izi ${emailFingerprint}`;
  const lockedFeatures = [
    '1.000+ kayıt kapasiteli üretim tabloları',
    '5.000 satır doğrulanmış ölçek',
    'Tam karar motoru ve makine gerekçesi',
    'Senaryo ve duyarlılık motoru',
    'Anomali / veri kalite analitiği',
    'Tahmin ve eşik-kırılım analizi',
    'Dinamik ilk 3 aksiyon üretici',
    'Yönetici PANO + PDF RAPOR',
    'G01–G24 denetim raporu ve satış lisansı',
  ];

  const sheets = [];
  sheets.push({
    name: 'KAPAK', widths: [28, 82, 20, 20, 20], merges: ['A1:E1', 'A3:E3', 'A5:E5', 'A9:E9'], protected: true,
    rows: [
      [C('EXCEL ARŞİV · PROOF DEMO', 1), C(''), C(''), C(''), C('')],
      [C(''), C(''), C(''), C(''), C('')],
      [C(productName, 9), C(''), C(''), C(''), C('')],
      [C(''), C(''), C(''), C(''), C('')],
      [C(spec.karar, 10), C(''), C(''), C(''), C('')],
      [C('Fiyat'), C(`${Number(priceTL).toLocaleString('tr-TR')} TL`, 6)],
      [C('Demo kimliği'), C(demoId, 5)],
      [C('E-posta izi'), C(emailFingerprint, 5)],
      [C(watermark, 9), C(''), C(''), C(''), C('')],
      [C('Bu dosya değerlendirme amaçlıdır. Premium motor, tam eşikler ve ticari analitikler bu dosyada fiziksel olarak bulunmaz.', 11)],
    ],
  });

  sheets.push({
    name: 'HIZLI_BASLANGIC', widths: [8, 34, 84, 20, 20], merges: ['A1:E1'], protected: true,
    rows: [
      [C('60 SANİYEDE DEMOYU DENE', 1), C(''), C(''), C(''), C('')],
      [C(''), C(''), C(''), C(''), C('')],
      [C('1', 9), C('DEMO_GIRIS'), C('Sarı hücrelerde örnek verileri değiştir. Demo en fazla 20 satırlık değerlendirme alanıdır.')],
      [C('2', 9), C('DEMO_KARAR'), C('Basitleştirilmiş kararın nasıl değiştiğini gör. Bu formüller premium motor değildir.')],
      [C('3', 9), C('DEMO_PANO'), C('Yönetici görünümünde ana KPI ve karar özetini incele.')],
      [C('4', 9), C('TAM_SURUM'), C('Satın alınan sürümde açılan analitik katmanları karşılaştır.')],
      [C(''), C(''), C('')],
      [C(watermark, 10), C(''), C('')],
    ],
  });

  const formulaByCol = new Map();
  spec.ornek.forEach((row, ri) => row.forEach((value, ci) => {
    if (typeof value === 'string' && value.startsWith('=') && !formulaByCol.has(ci)) {
      formulaByCol.set(ci, { formula: value, baseRow: 6 + ri });
    }
  }));
  const inputRows = [
    [C('DEMO GİRİŞ · EN FAZLA 20 KAYIT', 1), C(''), C(''), C(''), C('')],
    [C(spec.karar, 10), C(''), C(''), C(''), C('')],
    [C(watermark, 9), C(''), C(''), C(''), C('')],
    [C('Sarı = değiştirilebilir demo girdisi. Gri = basit demo hesabı. Premium motor burada yok.', 11)],
    spec.girisBasliklari.map((h) => C(h, 2)),
  ];
  for (let i = 0; i < MAX_DEMO_ROWS; i++) {
    const source = spec.ornek[i] ?? [];
    const excelRow = 6 + i;
    inputRows.push(spec.girisBasliklari.map((_h, ci) => {
      let value = source[ci] ?? '';
      let lockedFormula = typeof value === 'string' && value.startsWith('=');
      const calc = formulaByCol.get(ci);
      if (!value && calc && excelRow >= calc.baseRow) {
        value = shiftFormula(calc.formula, excelRow - calc.baseRow);
        lockedFormula = true;
      }
      if (lockedFormula) return C(value, 5);
      const numeric = typeof value === 'number' && (Math.abs(value) >= 1000 || /₺|Tutar|Gelir|Gider|Bakiye|Nakit|Borç|Maliyet|Satış|Tahsilat|Karşılık|ödeme/i.test(spec.girisBasliklari[ci]));
      if (numeric) return C(value, 4);
      return C(value, 3);
    }));
  }
  sheets.push({ name: 'DEMO_GIRIS', widths: [26, 28, 22, 22, 24], freeze: 5, protected: true, rows: inputRows });

  const kararRows = [
    [C('DEMO KARAR · BASİTLEŞTİRİLMİŞ KANIT MOTORU', 1), C(''), C('')],
    [C(spec.karar, 10), C(''), C('')],
    [C(watermark, 9), C(''), C('')],
    [C('Bu sayfadaki hesaplar ürün değerini göstermek içindir; premium eşikler ve analitik motor değildir.', 11)],
    [C('Gösterge', 2), C('Sonuç', 2), C('Açıklama', 2)],
  ];
  spec.metrikler.forEach(([label, formula, type], i) => {
    const isDecision = i === spec.metrikler.length - 1;
    kararRows.push([C(label, isDecision ? 9 : 10), C(formula, isDecision ? 9 : formatStyle(type)), C(isDecision ? 'Demo karar kapısı' : 'Basitleştirilmiş demo metriği', 11)]);
  });
  kararRows.push([C(''), C(''), C('')]);
  spec.aksiyonlar.forEach((action, i) => kararRows.push([C(`Aksiyon ${i + 1}`, 9), C(action, 10), C('')]));
  sheets.push({ name: 'DEMO_KARAR', widths: [30, 44, 52], freeze: 5, protected: true, rows: kararRows });

  const panoRows = [
    [C('DEMO PANO · YÖNETİCİ ÖZETİ', 1), C(''), C(''), C('')],
    [C(watermark, 9), C(''), C(''), C('')],
    [C(''), C(''), C(''), C('')],
    [C('KPI', 2), C('Değer', 2), C('KPI', 2), C('Değer', 2)],
    [C(spec.metrikler[0][0], 10), C('=DEMO_KARAR!B6', formatStyle(spec.metrikler[0][2])), C(spec.metrikler[1][0], 10), C('=DEMO_KARAR!B7', formatStyle(spec.metrikler[1][2]))],
    [C(spec.metrikler[2][0], 10), C('=DEMO_KARAR!B8', formatStyle(spec.metrikler[2][2])), C(spec.metrikler[3][0], 10), C('=DEMO_KARAR!B9', formatStyle(spec.metrikler[3][2]))],
    [C('DEMO KARAR', 9), C('=DEMO_KARAR!B10', 9), C(''), C('')],
    [C(''), C(''), C(''), C('')],
    [C('Tam sürümde bu ekran 6+ grafik, tam senaryo/duyarlılık, veri kalitesi ve dinamik aksiyon motoruyla genişler.', 10), C(''), C(''), C('')],
  ];
  sheets.push({ name: 'DEMO_PANO', widths: [34, 26, 34, 26], merges: ['A1:D1', 'A2:D2', 'A9:D9'], protected: true, rows: panoRows });

  const fullRows = [
    [C('TAM SÜRÜMDE AÇILAN KATMANLAR', 1), C(''), C('')],
    [C(productName, 9), C(''), C('')],
    [C(`Tam sürüm fiyatı: ${Number(priceTL).toLocaleString('tr-TR')} TL`, 10), C(''), C('')],
    [C(''), C(''), C('')],
    [C('Katman', 2), C('Demo', 2), C('Satın alınan sürüm', 2)],
  ];
  lockedFeatures.forEach((feature) => fullRows.push([C(feature, 10), C('Önizleme / sınırlı', 5), C('TAM', 9)]));
  fullRows.push([C(''), C(''), C('')], [C('Satın alma ve güvenli indirme: excelarsiv.com', 9), C(''), C('')]);
  sheets.push({ name: 'TAM_SURUM', widths: [58, 24, 28], protected: true, rows: fullRows });

  sheets.push({
    name: 'LISANS_KILAVUZ', widths: [28, 92, 20], protected: true,
    rows: [
      [C('PROOF DEMO · KULLANIM VE LİSANS BİLGİSİ', 1), C(''), C('')],
      [C('Demo ID', 10), C(demoId, 5)],
      [C('E-posta izi', 10), C(emailFingerprint, 5)],
      [C('Ürün', 10), C(productName, 5)],
      [C('Amaç', 10), C('Yalnızca ürünün kullanıcı akışını ve karar değerini değerlendirmek.', 11)],
      [C('Ticari kullanım', 10), C('İZİN VERİLMEZ. Demo gerçek işletme kararlarında üretim aracı olarak kullanılamaz.', 11)],
      [C('Dağıtım', 10), C('Dosyanın yeniden satılması, toplu paylaşılması veya başka bir ürünün parçası olarak dağıtılması izin kapsamında değildir.', 11)],
      [C('Tersine mühendislik', 10), C('Demo, premium motoru içermez. Ticari motoru yeniden üretmek amacıyla sistematik çıkarım/kopyalama demo kullanım izninin dışındadır.', 11)],
      [C('Fikri mülkiyet', 10), C('Tasarım, metin, ürün kurgusu ve demo yapısı üzerindeki haklar Excel Arşiv / hak sahibine aittir.', 11)],
      [C('Veri', 10), C('Gerçek hassas işletme verisi yerine test/örnek veri kullanın. Demo değerlendirme amaçlıdır.', 11)],
      [C('Sorumluluk', 10), C('Bu araç karar destek amaçlıdır; mali müşavir, hukuk veya diğer uzman görüşünün yerine geçmez.', 11)],
      [C('Tam sürüm', 10), C('excelarsiv.com üzerinden satın alma sonrası güvenli indirme ile teslim edilir.', 11)],
      [C(''), C('')],
      [C(watermark, 9), C('')],
    ],
  });

  return { sheets, watermark };
}

function buildProofDemo(args) {
  const model = makeWorkbookModel(args);
  const entries = [
    { path: '[Content_Types].xml', data: Buffer.from(contentTypes(model.sheets.length), 'utf8') },
    { path: '_rels/.rels', data: Buffer.from(rootRels(), 'utf8') },
    { path: 'xl/workbook.xml', data: Buffer.from(workbookXml(model.sheets), 'utf8') },
    { path: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels(model.sheets.length), 'utf8') },
    { path: 'xl/styles.xml', data: Buffer.from(stylesXml(), 'utf8') },
  ];
  model.sheets.forEach((sheet, i) => entries.push({ path: `xl/worksheets/sheet${i + 1}.xml`, data: Buffer.from(sheetXml(sheet), 'utf8') }));
  entries.push({ path: 'docProps/core.xml', data: Buffer.from(coreXml(args.productName, args.demoId), 'utf8') });
  entries.push({ path: 'docProps/app.xml', data: Buffer.from(appXml(), 'utf8') });
  return zip(entries);
}

exports.requestProofDemo = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  const productSlug = String(req.body?.productSlug ?? '').trim();
  const email = normalizeEmail(req.body?.email);
  const acceptedTerms = req.body?.acceptedTerms === true;
  const product = PRODUCTS[productSlug];
  const spec = getProofDemoSpec(productSlug);
  if (!product || !spec) return sendJson(res, 400, { error: 'UNKNOWN_PRODUCT' });
  if (!validEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });
  if (!acceptedTerms) return sendJson(res, 400, { error: 'DEMO_TERMS_REQUIRED' });

  const emailHash = sha256(email);
  try {
    await enforceDemoRateLimit(req, emailHash);
  } catch (error) {
    if (error?.code === 'DEMO_RATE_LIMITED') return sendJson(res, 429, { error: 'DEMO_RATE_LIMITED' });
    console.error('demo rate limit failed', error?.message);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }

  const db = getFirestore();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  const demoId = `DM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const emailFingerprint = emailHash.slice(0, 12).toUpperCase();
  const now = Date.now();
  await db.collection('excelarsiv_demo_tokens').doc(tokenHash).create({
    productSlug,
    productName: product.name,
    demoId,
    emailFingerprint,
    termsVersion: '2026-08-07-v1',
    used: false,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + DEMO_TOKEN_TTL_MS),
  });

  return sendJson(res, 201, {
    demoId,
    downloadUrl: `/api/demo-download?token=${encodeURIComponent(token)}`,
    expiresInSeconds: Math.floor(DEMO_TOKEN_TTL_MS / 1000),
  });
});

exports.downloadProofDemo = onRequest(functionDefaults, async (req, res) => {
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
        const error = new Error('TOKEN_NOT_FOUND'); error.code = 'TOKEN_NOT_FOUND'; throw error;
      }
      const data = snap.data();
      if (data.used || data.expiresAt?.toMillis?.() <= Date.now()) {
        const error = new Error('TOKEN_EXPIRED'); error.code = 'TOKEN_EXPIRED'; throw error;
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
    console.error('proof demo generation failed', error?.message);
    return sendJson(res, 500, { error: 'DEMO_GENERATION_FAILED' });
  }

  const filename = `${demo.productSlug}-proof-demo.xlsx`;
  res.status(200);
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.set('Content-Length', String(buffer.length));
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('X-ExcelArsiv-Demo-Id', demo.demoId);
  res.end(buffer);
});

exports._test = {
  normalizeEmail,
  validEmail,
  sha256,
  shiftFormula,
  makeWorkbookModel,
  buildProofDemo,
};
