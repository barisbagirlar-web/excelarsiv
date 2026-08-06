// Bağımlılıksız minimal .xlsx üretici.
// Gerçek ZIP (deflate) + OOXML parçaları; formül, renk kodlu hücre, donmuş başlık destekler.
import { deflateRawSync } from 'node:zlib';

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
  for (const e of entries) {
    const nameBuf = Buffer.from(e.path, 'utf8');
    const compressed = deflateRawSync(e.data);
    const crc = crc32(e.data);
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0x0800, 6);
    lfh.writeUInt16LE(8, 8);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(compressed.length, 18);
    lfh.writeUInt32LE(e.data.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    chunks.push(lfh, nameBuf, compressed);
    central.push({ nameBuf, crc, comp: compressed.length, uncomp: e.data.length, offset });
    offset += 30 + nameBuf.length + compressed.length;
  }
  const cdStart = offset;
  for (const c of central) {
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(c.crc, 16);
    cd.writeUInt32LE(c.comp, 20);
    cd.writeUInt32LE(c.uncomp, 24);
    cd.writeUInt16LE(c.nameBuf.length, 28);
    cd.writeUInt32LE(c.offset, 42);
    chunks.push(cd, c.nameBuf);
  }
  const cdSize = chunks.reduce((s, b) => s + b.length, 0) - cdStart;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  chunks.push(eocd);
  return Buffer.concat(chunks);
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colRef = (i) => {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

const NUM_FMT = 164; // "#,##0 "₺""
const NUM_FMT_DEC = 165; // "#,##0.00"

function cellXml(r, c, value, style) {
  const ref = `${colRef(c)}${r + 1}`;
  const s = style !== undefined ? ` s="${style}"` : '';
  if (value === null || value === undefined) return `<c r="${ref}"${s}/>`;
  if (typeof value === 'number') {
    return `<c r="${ref}"${s} t="n"><v>${value}</v></c>`;
  }
  if (typeof value === 'string' && value.startsWith('=')) {
    return `<c r="${ref}"${s}><f>${esc(value.slice(1))}</f></c>`;
  }
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml({ headers, rows, kind, tabSelected }) {
  const isInput = kind === 'input';
  const isOutput = kind === 'output';
  const headerStyle = isInput ? 4 : isOutput ? 5 : 1;
  const bodyStyle = isInput ? 2 : isOutput ? 3 : 0;
  const numStyle = isInput ? 6 : isOutput ? 7 : 0;

  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  lines.push('<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>');
  lines.push('<cols>');
  for (let i = 0; i < headers.length; i++) {
    lines.push(`<col min="${i + 1}" max="${i + 1}" width="22" customWidth="1"/>`);
  }
  lines.push('</cols>');
  lines.push('<sheetData>');
  lines.push(`<row r="1">${headers.map((h, i) => cellXml(0, i, h, headerStyle)).join('')}</row>`);
  rows.forEach((row, ri) => {
    lines.push(
      `<row r="${ri + 2}">${row
        .map((value, ci) => {
          const numeric = typeof value === 'number';
          const style = numeric ? numStyle : bodyStyle;
          return cellXml(ri + 1, ci, value, style);
        })
        .join('')}</row>`
    );
  });
  lines.push('</sheetData>');
  lines.push('</worksheet>');
  return lines.join('');
}

function workbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheets
  .map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
  .join('\n')}
  </sheets>
</workbook>`;
}

function workbookRels(sheetCount) {
  const items = [];
  for (let i = 0; i < sheetCount; i++) {
    items.push(
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    );
  }
  items.push(
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
  );
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${items.join('\n')}
</Relationships>`;
}

function contentTypes(sheetCount) {
  const sheets = [];
  for (let i = 0; i < sheetCount; i++) {
    sheets.push(
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.join('\n')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="${NUM_FMT}" formatCode="#,##0 &quot;₺&quot;"/>
    <numFmt numFmtId="${NUM_FMT_DEC}" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE5F5F3"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0"/>
    <xf numFmtId="${NUM_FMT}" fontId="0" fillId="2" borderId="0" xfId="0"/>
    <xf numFmtId="${NUM_FMT}" fontId="0" fillId="3" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;
}

function coreXml(title) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
  <dc:title>${esc(title)}</dc:title>
  <dc:creator>Excel Arşiv</dc:creator>
  <cp:lastModifiedBy>Excel Arşiv</cp:lastModifiedBy>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Excel Arşiv</Application>
</Properties>`;
}

/**
 * @param {object} workbook
 * @param {Array<{name:string, headers:string[], rows:(string|number)[][], kind:'input'|'calculation'|'output'}>} workbook.sheets
 */
export function buildXlsx(workbook) {
  const sheetCount = workbook.sheets.length;
  const entries = [
    { path: '[Content_Types].xml', data: Buffer.from(contentTypes(sheetCount), 'utf8') },
    { path: '_rels/.rels', data: Buffer.from(rootRels(), 'utf8') },
    { path: 'xl/workbook.xml', data: Buffer.from(workbookXml(workbook.sheets), 'utf8') },
    { path: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels(sheetCount), 'utf8') },
    { path: 'xl/styles.xml', data: Buffer.from(stylesXml(), 'utf8') },
  ];
  workbook.sheets.forEach((sheet, i) => {
    entries.push({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(sheetXml({ ...sheet, tabSelected: i === 0 }), 'utf8'),
    });
  });
  entries.push({ path: 'docProps/core.xml', data: Buffer.from(coreXml(workbook.name), 'utf8') });
  entries.push({ path: 'docProps/app.xml', data: Buffer.from(appXml(), 'utf8') });
  return zip(entries);
}
