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
const SHEET_PASSWORD_HASH = 'CC3D';
const VERSION = '3.0';

const functionDefaults = { region: REGION, maxInstances: 20, timeoutSeconds: 30, memory: '256MiB' };

const PALETTE = Object.freeze({
  canvas: 'FFF7F9FC', card: 'FFFFFFFF', navy: 'FF0F2742', accent: 'FFB08948',
  positive: 'FF1F7A4D', warning: 'FFB7791F', risk: 'FFB3261E', input: 'FFFFF2CC',
  locked: 'FFEEF2F7', line: 'FFD6DCE5', ink: 'FF17202A', muted: 'FF667085', pale: 'FFF2F4F7',
});

const PRODUCT_UI = Object.freeze({
  'akilli-kasa-defteri-ve-nakit-kontrol-sistemi': ['Nakit Nabzı', 'Giriş–çıkış dengesi', 'Yakın ödeme baskısı'],
  '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi': ['13 Hafta Görünümü', 'Haftalık nakit hareketi', 'Açık oluşan dönemler'],
  'cari-hesap-tahsilat-ve-musteri-risk-takip-sistemi': ['Tahsilat Radarı', 'Müşteri risk yoğunluğu', 'Gecikme ve teminat dengesi'],
  'banka-kredi-ve-taksit-takip-sistemi': ['Borç Servisi', 'Kredi yükü görünümü', 'Yaklaşan taksit baskısı'],
  'cek-senet-ve-vade-risk-sistemi': ['Vade Radarı', 'Vade yükü ve karşılık', 'Yoğunlaşma riski'],
  'gunluk-gelir-gider-ve-gercek-karlilik-sistemi': ['Gerçek Kârlılık', 'Ciro–gider dengesi', 'Tahsilat farkı'],
  'vergi-sgk-ve-maas-karsilik-ayirma-sistemi': ['Zorunlu Karşılık', 'Görünen–harcanabilir nakit', 'Zorunlu ödeme baskısı'],
  'stok-satis-ve-nakit-baglanma-sistemi': ['Stok Verimliliği', 'Stok–satış dengesi', 'Nakit bağlanma riski'],
  'pos-komisyon-ve-net-tahsilat-kontrol-sistemi': ['POS Net Tahsilat', 'Brüt–net tahsilat', 'Komisyon etkisi'],
  'aylik-patron-finans-paneli': ['Patron Özeti', 'Aylık finans nabzı', 'Kritik karar göstergeleri'],
  'proje-ve-is-bazinda-gercek-karlilik-sistemi': ['Proje Kârlılığı', 'Gelir–maliyet dengesi', 'Gerçek proje sonucu'],
  'kobi-finans-yonetim-paketi': ['KOBİ Finans Kokpiti', 'Finansal denge görünümü', 'Yönetici karar özeti'],
  'asiri-dusuk-teklif-savunma-robotu': ['Aşırı Düşük Savunma', 'Açıklama kapsama oranı', 'Belgesiz kalem riski'],
  'ihaleye-kac-tl-teklif-vermeliyim': ['Sınır Değer Radarı', 'Rakip teklif dağılımı', 'Aşırı düşük sorgusu'],
  'hakedis-fiyat-farki-hak-kaybi-cetveli': ['Fiyat Farkı Cetveli', 'Endeks etkisi', 'Hak kaybı riski'],
  'yillara-sari-insaat-stopaj-nakit-akis-planlayici': ['Stopaj Nakit Planı', 'Stopaj yükü görünümü', 'Nakit açığı dönemleri'],
  'taseron-hakedis-kesinti-mutabakati': ['Mutabakat Radarı', 'Kesinti ve ödenen dengesi', 'İhtilaf riski'],
  'kacirilan-sgk-tesvikleri-ve-gercek-iscilik-maliyeti-analizi': ['SGK Teşvik Radarı', 'Teşvik kullanım oranı', 'Kaçırılan teşvik'],
  'kidem-ihbar-yuku-ve-personel-cikarma-maliyeti-hesaplayici': ['Çıkarma Maliyeti', 'Kıdem–ihbar yükü', 'Yük yoğunlaşması'],
  'fazla-mesai-ve-isci-dava-riski-tespit-dosyasi': ['Dava Risk Radarı', 'Fazla mesai karşılığı', 'Eksik ödeme oranı'],
  'asgari-ucret-zam-etkisi-fiyat-ayarlama-cetveli': ['Zam Etki Cetveli', 'İşçilik payı etkisi', 'Fiyat ayarlama ihtiyacı'],
  'ithalat-depo-teslim-rafa-gelen-net-birim-maliyet': ['İthalat Maliyet Radarı', 'Vergi yükü görünümü', 'Birim maliyet etkisi'],
});

function sendJson(res, status, payload) {
  res.status(status); res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8'); res.set('X-Robots-Tag', 'noindex, nofollow');
  res.send(JSON.stringify(payload));
}
function normalizeEmail(v) { return String(v ?? '').trim().toLowerCase(); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254; }
function sha256(v) { return crypto.createHash('sha256').update(String(v)).digest('hex'); }
function getClientIp(req) { return String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.ip || 'unknown'; }

async function enforceDemoRateLimit(req, emailHash) {
  const db = getFirestore(); const now = Date.now(); const hour = Math.floor(now / 3_600_000); const day = Math.floor(now / 86_400_000);
  const ipRef = db.collection('excelarsiv_demo_rate_limits').doc(`ip_${sha256(`${getClientIp(req)}|${hour}`)}`);
  const emailRef = db.collection('excelarsiv_demo_rate_limits').doc(`mail_${sha256(`${emailHash}|${day}`)}`);
  await db.runTransaction(async (tx) => {
    const [ipSnap, emailSnap] = await Promise.all([tx.get(ipRef), tx.get(emailRef)]);
    const ipCount = ipSnap.exists ? Number(ipSnap.data()?.count ?? 0) : 0;
    const emailCount = emailSnap.exists ? Number(emailSnap.data()?.count ?? 0) : 0;
    if (ipCount >= MAX_DEMOS_PER_IP_HOUR || emailCount >= MAX_DEMOS_PER_EMAIL_DAY) {
      const e = new Error('DEMO_RATE_LIMITED'); e.code = 'DEMO_RATE_LIMITED'; throw e;
    }
    tx.set(ipRef, { count: ipCount + 1, expiresAt: Timestamp.fromMillis((hour + 2) * 3_600_000), updatedAt: FieldValue.serverTimestamp() });
    tx.set(emailRef, { count: emailCount + 1, expiresAt: Timestamp.fromMillis((day + 2) * 86_400_000), updatedAt: FieldValue.serverTimestamp() });
  });
}

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(entries) {
  const chunks = []; const central = []; let offset = 0;
  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.path, 'utf8'); const compressed = deflateRawSync(entry.data); const crc = crc32(entry.data); const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(entry.data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, compressed); central.push({ nameBuf, crc, comp: compressed.length, uncomp: entry.data.length, offset }); offset += 30 + nameBuf.length + compressed.length;
  }
  const cdStart = offset;
  for (const item of central) {
    const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0x0800, 8); cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(item.crc, 16); cd.writeUInt32LE(item.comp, 20); cd.writeUInt32LE(item.uncomp, 24); cd.writeUInt16LE(item.nameBuf.length, 28); cd.writeUInt32LE(item.offset, 42);
    chunks.push(cd, item.nameBuf);
  }
  const cdSize = chunks.reduce((sum, b) => sum + b.length, 0) - cdStart; const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length, 8); end.writeUInt16LE(central.length, 10); end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(cdStart, 16); chunks.push(end);
  return Buffer.concat(chunks);
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function colRef(index) { let s = ''; let n = index; while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } return s; }
function shiftFormula(formula, delta) { if (!formula || !formula.startsWith('=') || delta === 0) return formula; return formula.replace(/(\$?[A-Z]{1,3}\$?)(\d+)/g, (_m, col, row) => `${col}${Math.max(1, Number(row) + delta)}`); }
function excelDateSerial(text) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(text)); if (!m) return null;
  const utc = Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])); return Math.floor((utc - Date.UTC(1899, 11, 30)) / 86400000);
}

const S = Object.freeze({
  canvas: 0, title: 1, header: 2, inputText: 3, inputMoney: 4, lockedText: 5, lockedMoney: 6, lockedPct: 7, lockedNum: 8,
  accentCard: 9, card: 10, note: 11, kpiLabel: 12, kpiMoney: 13, kpiPct: 14, kpiNum: 15, positive: 16, warning: 17, risk: 18,
  section: 19, inputDate: 20, inputPct: 21, inputNum: 22, subtle: 23, bigDecision: 24,
});
const C = (v, s = S.canvas, extra = {}) => ({ v, s, ...extra });

function cellXml(rowIndex, colIndex, cell) {
  const ref = `${colRef(colIndex)}${rowIndex + 1}`; const style = Number.isInteger(cell?.s) ? ` s="${cell.s}"` : ''; const value = cell?.v;
  if (value === null || value === undefined || value === '') return `<c r="${ref}"${style}/>`;
  if (typeof value === 'number') return `<c r="${ref}"${style} t="n"><v>${value}</v></c>`;
  if (typeof value === 'string' && value.startsWith('=')) return `<c r="${ref}"${style}><f>${esc(value.slice(1))}</f></c>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}
function validationXml(v) {
  const attrs = [`type="${v.type}"`, `allowBlank="${v.allowBlank === false ? 0 : 1}"`, 'showInputMessage="1"', 'showErrorMessage="1"', `sqref="${v.sqref}"`];
  if (v.operator) attrs.push(`operator="${v.operator}"`);
  if (v.promptTitle) attrs.push(`promptTitle="${esc(v.promptTitle)}"`); if (v.prompt) attrs.push(`prompt="${esc(v.prompt)}"`);
  if (v.errorTitle) attrs.push(`errorTitle="${esc(v.errorTitle)}"`); if (v.error) attrs.push(`error="${esc(v.error)}"`);
  return `<dataValidation ${attrs.join(' ')}>${v.formula1 ? `<formula1>${esc(v.formula1)}</formula1>` : ''}${v.formula2 ? `<formula2>${esc(v.formula2)}</formula2>` : ''}</dataValidation>`;
}
function cfXml(cf, priority) {
  if (cf.kind === 'dataBar') return `<conditionalFormatting sqref="${cf.range}"><cfRule type="dataBar" priority="${priority}"><dataBar showValue="1"><cfvo type="min"/><cfvo type="max"/><color rgb="${cf.color || PALETTE.accent}"/></dataBar></cfRule></conditionalFormatting>`;
  if (cf.kind === 'colorScale') return `<conditionalFormatting sqref="${cf.range}"><cfRule type="colorScale" priority="${priority}"><colorScale><cfvo type="min"/><cfvo type="percentile" val="50"/><cfvo type="max"/><color rgb="FFFDECEC"/><color rgb="FFFFF4D6"/><color rgb="FFE5F5EC"/></colorScale></cfRule></conditionalFormatting>`;
  if (cf.kind === 'duplicate') return `<conditionalFormatting sqref="${cf.range}"><cfRule type="duplicateValues" dxfId="3" priority="${priority}"/></conditionalFormatting>`;
  if (cf.kind === 'formula') return `<conditionalFormatting sqref="${cf.range}"><cfRule type="expression" dxfId="${cf.dxfId}" priority="${priority}"><formula>${esc(cf.formula)}</formula></cfRule></conditionalFormatting>`;
  if (cf.kind === 'cellText') return `<conditionalFormatting sqref="${cf.range}"><cfRule type="cellIs" dxfId="${cf.dxfId}" priority="${priority}" operator="equal"><formula>"${esc(cf.text)}"</formula></cfRule></conditionalFormatting>`;
  return '';
}
function sheetXml(sheet) {
  const lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
  lines.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  lines.push(`<sheetViews><sheetView workbookViewId="0" showGridLines="${sheet.gridLines === false ? 0 : 1}">`);
  if (sheet.freeze) lines.push(`<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/>`); lines.push('</sheetView></sheetViews>');
  lines.push('<sheetFormatPr defaultRowHeight="18"/>'); lines.push('<cols>');
  (sheet.widths ?? [24, 22, 22, 22, 22]).forEach((width, i) => lines.push(`<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)); lines.push('</cols><sheetData>');
  sheet.rows.forEach((row, ri) => { const ht = sheet.rowHeights?.[ri]; lines.push(`<row r="${ri + 1}"${ht ? ` ht="${ht}" customHeight="1"` : ''}>${row.map((cell, ci) => cellXml(ri, ci, cell)).join('')}</row>`); }); lines.push('</sheetData>');
  if (sheet.autoFilter) lines.push(`<autoFilter ref="${sheet.autoFilter}"/>`);
  if (sheet.merges?.length) lines.push(`<mergeCells count="${sheet.merges.length}">${sheet.merges.map((r) => `<mergeCell ref="${r}"/>`).join('')}</mergeCells>`);
  (sheet.conditionalFormats ?? []).forEach((cf, i) => lines.push(cfXml(cf, i + 1)));
  if (sheet.dataValidations?.length) lines.push(`<dataValidations count="${sheet.dataValidations.length}">${sheet.dataValidations.map(validationXml).join('')}</dataValidations>`);
  if (sheet.protected) lines.push(`<sheetProtection password="${SHEET_PASSWORD_HASH}" sheet="1" objects="1" scenarios="1" formatCells="1" formatColumns="1" formatRows="1" insertColumns="1" deleteColumns="1" deleteRows="1" selectLockedCells="1" selectUnlockedCells="0"/>`);
  if (sheet.print) {
    lines.push('<printOptions horizontalCentered="1"/>');
    lines.push('<pageMargins left="0.3" right="0.3" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>');
    lines.push(`<pageSetup paperSize="9" orientation="${sheet.print.orientation || 'landscape'}" fitToWidth="1" fitToHeight="1"/>`);
    lines.push(`<headerFooter><oddFooter>&amp;LExcel Arşiv · Proof Demo v${VERSION}&amp;C${esc(sheet.print.footer || '')}&amp;R&amp;P / &amp;N</oddFooter></headerFooter>`);
  }
  lines.push('</worksheet>'); return lines.join('');
}

function stylesXml() {
  const xfs = [
    [0,0,6,0,''], [0,1,2,0,'<alignment vertical="center"/>'], [0,2,2,1,'<alignment horizontal="center" vertical="center" wrapText="1"/>'],
    [0,0,3,1,'<alignment vertical="center"/><protection locked="0"/>'], [164,0,3,1,'<alignment horizontal="right"/><protection locked="0"/>'],
    [0,0,4,1,'<alignment vertical="center" wrapText="1"/>'], [164,0,4,1,'<alignment horizontal="right"/>'], [165,0,4,1,'<alignment horizontal="right"/>'], [166,0,4,1,'<alignment horizontal="right"/>'],
    [0,3,5,1,'<alignment wrapText="1" vertical="center"/>'], [0,3,1,1,'<alignment wrapText="1" vertical="center"/>'], [0,4,6,0,'<alignment wrapText="1" vertical="top"/>'],
    [0,5,1,1,'<alignment vertical="center"/>'], [164,6,1,1,'<alignment horizontal="right" vertical="center"/>'], [165,6,1,1,'<alignment horizontal="right" vertical="center"/>'], [166,6,1,1,'<alignment horizontal="right" vertical="center"/>'],
    [0,3,7,1,'<alignment horizontal="center" vertical="center"/>'], [0,3,8,1,'<alignment horizontal="center" vertical="center"/>'], [0,3,9,1,'<alignment horizontal="center" vertical="center"/>'],
    [0,5,4,1,'<alignment wrapText="1" vertical="center"/>'], [14,0,3,1,'<alignment horizontal="center"/><protection locked="0"/>'], [165,0,3,1,'<alignment horizontal="right"/><protection locked="0"/>'],
    [166,0,3,1,'<alignment horizontal="right"/><protection locked="0"/>'], [0,4,10,0,'<alignment wrapText="1" vertical="center"/>'], [0,7,5,2,'<alignment horizontal="center" vertical="center" wrapText="1"/>'],
  ];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4"><numFmt numFmtId="164" formatCode="₺ #,##0.00;[Red](₺ #,##0.00);-"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="0.00"/><numFmt numFmtId="167" formatCode="dd.mm.yyyy"/></numFmts>
<fonts count="8"><font><sz val="10"/><color rgb="${PALETTE.ink}"/><name val="Segoe UI"/></font><font><b/><sz val="19"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font><font><b/><sz val="11"/><color rgb="${PALETTE.navy}"/><name val="Segoe UI"/></font><font><sz val="9"/><color rgb="${PALETTE.muted}"/><name val="Segoe UI"/></font><font><b/><sz val="10"/><color rgb="${PALETTE.navy}"/><name val="Segoe UI"/></font><font><b/><sz val="24"/><color rgb="${PALETTE.navy}"/><name val="Segoe UI"/></font><font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font></fonts>
<fills count="11"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.card}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.navy}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.input}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.locked}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.accent}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.canvas}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.positive}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.warning}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.risk}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PALETTE.pale}"/></patternFill></fill></fills>
<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="${PALETTE.line}"/></left><right style="thin"><color rgb="${PALETTE.line}"/></right><top style="thin"><color rgb="${PALETTE.line}"/></top><bottom style="thin"><color rgb="${PALETTE.line}"/></bottom><diagonal/></border><border><left style="medium"><color rgb="${PALETTE.accent}"/></left><right style="medium"><color rgb="${PALETTE.accent}"/></right><top style="medium"><color rgb="${PALETTE.accent}"/></top><bottom style="medium"><color rgb="${PALETTE.accent}"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.map(([nf,f,fill,border,align]) => `<xf numFmtId="${nf}" fontId="${f}" fillId="${fill}" borderId="${border}" xfId="0" applyAlignment="1" applyProtection="1">${align}</xf>`).join('')}</cellXfs>
<dxfs count="4"><dxf><font><b/><color rgb="${PALETTE.positive}"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFE5F5EC"/></patternFill></fill></dxf><dxf><font><b/><color rgb="${PALETTE.warning}"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFFFF4D6"/></patternFill></fill></dxf><dxf><font><b/><color rgb="${PALETTE.risk}"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFFDECEC"/></patternFill></fill></dxf><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFFE6E6"/></patternFill></fill></dxf></dxfs>
</styleSheet>`;
}
function workbookXml(sheets) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="0"/><workbookProtection workbookPassword="${SHEET_PASSWORD_HASH}" lockStructure="1"/><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`; }
function workbookRels(n) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${Array.from({length:n},(_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`; }
function contentTypes(n) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${Array.from({length:n},(_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`; }
function rootRels() { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'; }
function coreXml(productName, demoId) { const now = new Date().toISOString(); return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(`${productName} — Proof Demo v${VERSION}`)}</dc:title><dc:creator>Excel Arşiv</dc:creator><cp:keywords>Proof Demo; ${esc(demoId)}; değerlendirme</cp:keywords><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`; }
function appXml() { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Excel Arşiv Proof Demo v${VERSION}</Application></Properties>`; }

function inferColumns(spec) {
  const infos = spec.girisBasliklari.map((header, ci) => {
    const values = spec.ornek.map(r => r[ci]).filter(v => v !== '' && v !== null && v !== undefined);
    const numericCount = values.filter(v => typeof v === 'number' || (typeof v === 'string' && v.startsWith('='))).length;
    const dateLike = /Tarih|Vade/i.test(header) || values.some(v => excelDateSerial(v) !== null);
    const pctLike = /%|oran|marj/i.test(header); const moneyLike = /₺|Tutar|Gelir|Gider|Bakiye|Nakit|Borç|Maliyet|Satış|Tahsilat|Karşılık|ödeme|Ciro|Taksit|Komisyon/i.test(header);
    const integerLike = /gün|adet|süre|hafta sayısı/i.test(header);
    return { ci, header, numeric: numericCount >= Math.max(1, Math.ceil(values.length * 0.5)), dateLike, pctLike, moneyLike, integerLike };
  });
  const numeric = infos.filter(x => x.numeric && !x.dateLike);
  const money = numeric.filter(x => x.moneyLike && !x.pctLike);
  const primary = (money[0] ?? numeric[0])?.ci ?? 1;
  const secondary = money[1]?.ci ?? primary;
  return { infos, primary, secondary };
}
function inputStyle(info, value) {
  if (typeof value === 'string' && value.startsWith('=')) return S.lockedNum;
  if (info.dateLike) return S.inputDate; if (info.pctLike) return S.inputPct; if (info.moneyLike) return S.inputMoney; if (info.numeric) return S.inputNum; return S.inputText;
}
function formatStyle(type, kpi = false) { if (type === 'para') return kpi ? S.kpiMoney : S.lockedMoney; if (type === 'yuzde') return kpi ? S.kpiPct : S.lockedPct; if (type === 'oran') return kpi ? S.kpiNum : S.lockedNum; if (type === 'sayi') return kpi ? S.kpiNum : S.lockedNum; return kpi ? S.kpiLabel : S.lockedText; }
function validationFor(info, colLetter) {
  const range = `${colLetter}6:${colLetter}25`; const base = { sqref: range, promptTitle: info.header.slice(0, 32), prompt: `Bu alan: ${info.header}. Örnek değerleri değiştirerek sonucu test edin.`, errorTitle: 'Geçersiz giriş', error: `${info.header} alanına uygun bir değer girin.` };
  if (info.dateLike) return { ...base, type: 'date', operator: 'between', formula1: 'DATE(2020,1,1)', formula2: 'DATE(2035,12,31)' };
  if (info.pctLike) return { ...base, type: 'decimal', operator: 'between', formula1: '0', formula2: '1' };
  if (info.numeric) return { ...base, type: info.integerLike ? 'whole' : 'decimal', operator: 'greaterThanOrEqual', formula1: '0' };
  return { ...base, type: 'textLength', operator: 'between', formula1: '0', formula2: '120' };
}

function makeWorkbookModel({ productSlug, productName, priceTL, demoId, emailFingerprint }) {
  const spec = getProofDemoSpec(productSlug); if (!spec) throw new Error('UNKNOWN_DEMO_SPEC');
  const ui = PRODUCT_UI[productSlug] || ['Yönetici Özeti', 'Ana gösterge görünümü', 'Karar odağı']; const cols = inferColumns(spec);
  const watermark = `Proof Demo v${VERSION} · ${demoId} · E-posta izi ${emailFingerprint}`;
  const colA = colRef(cols.primary); const colB = colRef(cols.secondary);
  const sheets = [];

  sheets.push({ name:'KAPAK', widths:[24,68,18,18,18], merges:['A1:E1','A3:E3','A5:E5','A11:E11'], protected:true, gridLines:false, rowHeights:{0:34,2:28,4:42,10:32}, rows:[
    [C('EXCEL ARŞİV · 10/10 PROOF DEMO',S.title),C(''),C(''),C(''),C('')], [C(''),C(''),C(''),C(''),C('')], [C(productName,S.accentCard),C(''),C(''),C(''),C('')], [C(''),C(''),C(''),C(''),C('')],
    [C(spec.karar,S.card),C(''),C(''),C(''),C(''),C('')], [C('Demo odağı',S.section),C(ui[0],S.card),C(''),C(''),C('')], [C('Tam sürüm fiyatı',S.section),C(`${Number(priceTL).toLocaleString('tr-TR')} TL`,S.card),C(''),C(''),C('')],
    [C('Demo kapasitesi',S.section),C('20 kayıt · güvenli değerlendirme',S.card),C(''),C(''),C('')], [C('Excel uyumu',S.section),C('Makrosuz .xlsx · masaüstü Excel',S.card),C(''),C(''),C('')], [C(''),C(''),C(''),C(''),C('')],
    [C('3 adım: DEMO_GIRIS → DEMO_KARAR → DEMO_PANO. Sarı alanları değiştirin; sonuçlar otomatik güncellenir.',S.accentCard),C(''),C(''),C(''),C('')],
    [C('Not',S.section),C('Bu demo ürün deneyimini kanıtlar; premium eşik seti, tam analitik motor ve üretim kapasitesi fiziksel olarak demo içinde bulunmaz.',S.note),C(''),C(''),C('')],
  ]});

  sheets.push({ name:'HIZLI_BASLANGIC', widths:[8,28,74,28,20], merges:['A1:E1','A8:E8'], protected:true, gridLines:false, rowHeights:{0:32,2:30,3:30,4:30,5:30,7:28}, rows:[
    [C('60 SANİYEDE DEĞERİ GÖR',S.title),C(''),C(''),C(''),C('')], [C(''),C(''),C(''),C(''),C('')],
    [C('1',S.accentCard),C('DEMO_GIRIS',S.section),C('Sarı hücrelerde örnek verileri değiştir. Veri çubukları ve uyarılar anında tepki verir.',S.card),C('20 satır',S.subtle),C('')],
    [C('2',S.accentCard),C('DEMO_ANALIZ',S.section),C('Veri doluluğu, yoğunlaşma ve senaryo önizlemesini kontrol et.',S.card),C('Canlı',S.subtle),C('')],
    [C('3',S.accentCard),C('DEMO_KARAR',S.section),C('Ana KPI’ları, karar kapısını ve aksiyonları incele.',S.card),C('Canlı',S.subtle),C('')],
    [C('4',S.accentCard),C('DEMO_PANO',S.section),C('Tek ekran yönetici özetinde risk, kalite ve karar görünümünü değerlendir.',S.card),C('Tek ekran',S.subtle),C('')],
    [C(''),C(''),C(''),C(''),C('')], [C('İPUCU · Bir sarı hücreyi değiştirip DEMO_PANO’ya dönün. Demo değerini en hızlı böyle görürsünüz.',S.accentCard),C(''),C(''),C(''),C('')],
    [C('Demo kimliği',S.section),C(demoId,S.subtle),C('E-posta izi',S.section),C(emailFingerprint,S.subtle),C('')],
  ]});

  const formulaByCol = new Map(); spec.ornek.forEach((row,ri)=>row.forEach((v,ci)=>{ if(typeof v==='string'&&v.startsWith('=')&&!formulaByCol.has(ci)) formulaByCol.set(ci,{formula:v,baseRow:6+ri}); }));
  const inputRows = [[C(`DEMO GİRİŞ · ${ui[1].toUpperCase()}`,S.title),C(''),C(''),C(''),C('')],[C(spec.karar,S.card),C(''),C(''),C(''),C('')],[C('Sarı = giriş · Gri = otomatik demo hesabı',S.note),C(''),C(''),C(''),C('')],[C('Değerleri değiştirin. Geçersiz girişler engellenir; veri çubukları yoğunluğu gösterir.',S.subtle),C(''),C(''),C(''),C('')],spec.girisBasliklari.map(h=>C(h,S.header))];
  for(let i=0;i<MAX_DEMO_ROWS;i++){
    const src=spec.ornek[i]??[]; const excelRow=6+i;
    inputRows.push(spec.girisBasliklari.map((_h,ci)=>{ const info=cols.infos[ci]; let v=src[ci]??''; const calc=formulaByCol.get(ci); if(!v&&calc&&excelRow>=calc.baseRow) v=shiftFormula(calc.formula,excelRow-calc.baseRow); if(typeof v==='string'&&v.startsWith('=')) return C(v,S.lockedNum); const serial=info.dateLike?excelDateSerial(v):null; if(serial!==null) v=serial; return C(v,inputStyle(info,v)); }));
  }
  const validations = cols.infos.map((info,ci)=>validationFor(info,colRef(ci)));
  const cfs = [{kind:'duplicate',range:'A6:A25'},{kind:'formula',range:'A6:E25',formula:'AND(COUNTA($A6:$E6)>0,COUNTBLANK($A6:$E6)>0)',dxfId:3}];
  cols.infos.forEach((info,ci)=>{ const r=`${colRef(ci)}6:${colRef(ci)}25`; if(info.moneyLike||info.numeric) cfs.push({kind:'dataBar',range:r,color:PALETTE.accent}); if(info.pctLike) cfs.push({kind:'colorScale',range:r}); if(info.dateLike) cfs.push({kind:'formula',range:r,formula:`${colRef(ci)}6>TODAY()+365`,dxfId:1}); });
  sheets.push({ name:'DEMO_GIRIS', widths:[24,30,20,20,22], merges:['A1:E1','A2:E2','A3:E3','A4:E4'], freeze:5, protected:true, gridLines:true, rows:inputRows, autoFilter:'A5:E25', dataValidations:validations, conditionalFormats:cfs });

  const analysisRows = [[C('DEMO ANALİZ · VERİ KALİTESİ VE RİSK ÖNİZLEMESİ',S.title),C(''),C(''),C(''),C('')],[C(ui[2],S.card),C(''),C(''),C(''),C('')],[C(''),C(''),C(''),C(''),C('')],[C('Senaryo oynama oranı',S.section),C(0.10,S.inputPct),C('Demo satır kapasitesi',S.section),C(MAX_DEMO_ROWS,S.lockedNum),C('')],[C('Analiz',S.header),C('Sonuç',S.header),C('Yorum',S.header),C('Görsel',S.header),C('')],
    [C('Dolu kayıt',S.card),C('=COUNTA(DEMO_GIRIS!A6:A25)',S.kpiNum),C('Demo alanında kullanılan kayıt sayısı.',S.note),C('=REPT("█",MIN(20,B6))',S.card),C('')],
    [C('Veri doluluk oranı',S.card),C('=COUNTA(DEMO_GIRIS!A6:E25)/(20*5)',S.kpiPct),C('Boş alan azaldıkça karar güveni artar.',S.note),C('=REPT("█",ROUND(B7*20,0))',S.card),C('')],
    [C('Ana kalem yoğunlaşması',S.card),C(`=IFERROR(MAX(DEMO_GIRIS!${colA}6:${colA}25)/SUM(DEMO_GIRIS!${colA}6:${colA}25),0)`,S.kpiPct),C('Tek kayda aşırı yığılmayı gösterir.',S.note),C('=REPT("█",ROUND(B8*20,0))',S.card),C('')],
    [C('İkincil / ana oran',S.card),C(`=IFERROR(SUM(DEMO_GIRIS!${colB}6:${colB}25)/SUM(DEMO_GIRIS!${colA}6:${colA}25),0)`,S.kpiPct),C('İki temel sayısal alanın ilişkisini gösterir.',S.note),C('=REPT("█",MIN(20,ROUND(ABS(B9)*10,0)))',S.card),C('')],
    [C(''),C(''),C(''),C(''),C('')],[C('SENARYO ÖNİZLEMESİ',S.section),C(''),C(''),C(''),C('')],[C('Kötümser',S.card),C('=DEMO_KARAR!B6*(1-$B$4)',formatStyle(spec.metrikler[0][2])),C('Ana KPI üzerinde -%10 örnek etki',S.note),C(''),C('')],[C('Baz',S.card),C('=DEMO_KARAR!B6',formatStyle(spec.metrikler[0][2])),C('Mevcut demo sonucu',S.note),C(''),C('')],[C('İyimser',S.card),C('=DEMO_KARAR!B6*(1+$B$4)',formatStyle(spec.metrikler[0][2])),C('Ana KPI üzerinde +%10 örnek etki',S.note),C(''),C('')]
  ];
  sheets.push({ name:'DEMO_ANALIZ', widths:[28,24,52,28,4], merges:['A1:E1','A2:E2','A11:E11'], freeze:5, protected:true, gridLines:false, rows:analysisRows, dataValidations:[{type:'decimal',operator:'between',sqref:'B4',formula1:'0',formula2:'0.25',promptTitle:'Senaryo oranı',prompt:'0 ile %25 arasında bir oran girin.',errorTitle:'Geçersiz oran',error:'0 ile %25 arasında bir oran kullanın.'}], conditionalFormats:[{kind:'dataBar',range:'B7:B9',color:PALETTE.accent},{kind:'colorScale',range:'B7:B9'}] });

  const decisionRows=[[C('DEMO KARAR · KARAR KAPISI',S.title),C(''),C(''),C('')],[C(spec.karar,S.card),C(''),C(''),C('')],[C(''),C(''),C(''),C('')],[C('Bu sayfa sınırlı demo mantığıdır; tam sürümün eşik setini ve analitik motorunu içermez.',S.note),C(''),C(''),C('')],[C('Gösterge',S.header),C('Sonuç',S.header),C('Ne anlatıyor?',S.header),C('')]];
  spec.metrikler.forEach(([label,formula,type],i)=>decisionRows.push([C(label,i===spec.metrikler.length-1?S.accentCard:S.card),C(formula,i===spec.metrikler.length-1?S.bigDecision:formatStyle(type,true)),C(i===spec.metrikler.length-1?'Karar kapısı: UYGUN / İNCELE / DURDUR':'Ana demo göstergesi',S.note),C('')]));
  decisionRows.push([C(''),C(''),C(''),C('')],[C('ÖNERİLEN AKSİYONLAR',S.section),C(''),C(''),C('')]); spec.aksiyonlar.forEach((a,i)=>decisionRows.push([C(`${i+1}.`,S.accentCard),C(a,S.card),C(''),C('')]));
  sheets.push({ name:'DEMO_KARAR', widths:[30,32,56,4], merges:['A1:D1','A2:D2','A4:D4','A12:D12'], freeze:5, protected:true, gridLines:false, rows:decisionRows, conditionalFormats:[{kind:'cellText',range:'B10',text:'UYGUN',dxfId:0},{kind:'cellText',range:'B10',text:'İNCELE',dxfId:1},{kind:'cellText',range:'B10',text:'DURDUR',dxfId:2}] });

  const panoRows=[[C(`${ui[0].toUpperCase()} · YÖNETİCİ PANO`,S.title),C(''),C(''),C(''),C(''),C('')],[C(productName,S.accentCard),C(''),C(''),C(''),C(''),C('')],[C(''),C(''),C(''),C(''),C(''),C('')],
    [C(spec.metrikler[0][0],S.kpiLabel),C('=DEMO_KARAR!B6',formatStyle(spec.metrikler[0][2],true)),C(spec.metrikler[1][0],S.kpiLabel),C('=DEMO_KARAR!B7',formatStyle(spec.metrikler[1][2],true)),C('Veri doluluğu',S.kpiLabel),C('=DEMO_ANALIZ!B7',S.kpiPct)],
    [C(spec.metrikler[2][0],S.kpiLabel),C('=DEMO_KARAR!B8',formatStyle(spec.metrikler[2][2],true)),C(spec.metrikler[3][0],S.kpiLabel),C('=DEMO_KARAR!B9',formatStyle(spec.metrikler[3][2],true)),C('Yoğunlaşma',S.kpiLabel),C('=DEMO_ANALIZ!B8',S.kpiPct)],
    [C(''),C(''),C(''),C(''),C(''),C('')],[C('KARAR',S.section),C(''),C('=DEMO_KARAR!B10',S.bigDecision),C(''),C(''),C('')],[C(''),C(''),C(''),C(''),C(''),C('')],
    [C('GÖRSEL RİSK ŞERİDİ',S.section),C(''),C(''),C(''),C(''),C('')],[C('Veri kalitesi',S.card),C('=DEMO_ANALIZ!B7',S.kpiPct),C('Yoğunlaşma riski',S.card),C('=DEMO_ANALIZ!B8',S.kpiPct),C('İkincil / ana',S.card),C('=DEMO_ANALIZ!B9',S.kpiPct)],
    [C(''),C(''),C(''),C(''),C(''),C('')],[C('İLK 3 AKSİYON',S.section),C(''),C(''),C(''),C(''),C('')],[C('1',S.accentCard),C(spec.aksiyonlar[0]||'',S.card),C('2',S.accentCard),C(spec.aksiyonlar[1]||'',S.card),C('3',S.accentCard),C(spec.aksiyonlar[2]||'',S.card)],
    [C(''),C(''),C(''),C(''),C(''),C('')],[C(`Demo ${demoId} · Tam sürümde üretim kapasitesi, tam karar motoru, senaryo/duyarlılık, anomali ve rapor katmanı açılır.`,S.note),C(''),C(''),C(''),C(''),C('')]
  ];
  sheets.push({ name:'DEMO_PANO', widths:[24,25,24,25,24,25], merges:['A1:F1','A2:F2','A7:B7','C7:F7','A9:F9','A12:F12','A15:F15'], protected:true, gridLines:false, rows:panoRows, rowHeights:{0:34,1:28,3:42,4:42,6:38,9:34,12:48}, conditionalFormats:[{kind:'cellText',range:'C7',text:'UYGUN',dxfId:0},{kind:'cellText',range:'C7',text:'İNCELE',dxfId:1},{kind:'cellText',range:'C7',text:'DURDUR',dxfId:2},{kind:'dataBar',range:'B10',color:PALETTE.positive},{kind:'dataBar',range:'D10',color:PALETTE.warning},{kind:'dataBar',range:'F10',color:PALETTE.accent}], print:{footer:productName} });

  const features=['1.000+ kayıt üretim kapasitesi','5.000 satır ölçek testi','Tam karar motoru + gerekçe','Senaryo ve duyarlılık motoru','Anomali + veri kalite analitiği','Tahmin ve eşik-kırılım analizi','Dinamik aksiyon üretici','6+ grafik yönetici PANO','PDF’e hazır RAPOR','G01–G24 denetim kanıtı'];
  const fullRows=[[C('TAM SÜRÜMDE NE AÇILIYOR?',S.title),C(''),C(''),C('')],[C(productName,S.accentCard),C(''),C(''),C('')],[C(`Tam sürüm: ${Number(priceTL).toLocaleString('tr-TR')} TL`,S.card),C(''),C(''),C('')],[C(''),C(''),C(''),C('')],[C('Yetkinlik',S.header),C('Proof Demo',S.header),C('Tam sürüm',S.header),C('')]];
  features.forEach((f,i)=>fullRows.push([C(f,S.card),C(i<3?'Sınırlı kanıt':'Kapalı',S.lockedText),C('TAM',S.accentCard),C('')])); fullRows.push([C(''),C(''),C(''),C('')],[C('Satın alma sonrası dosya ExcelArşiv güvenli teslim akışıyla indirilir.',S.section),C(''),C(''),C('')]);
  sheets.push({ name:'TAM_SURUM', widths:[56,24,24,4], protected:true, gridLines:false, rows:fullRows, print:{footer:`${productName} · Karşılaştırma`} });

  sheets.push({ name:'LISANS_KILAVUZ', widths:[28,92,4], protected:true, gridLines:false, rows:[[C('PROOF DEMO · KULLANIM BİLGİSİ',S.title),C(''),C('')],[C('Demo ID',S.section),C(demoId,S.subtle),C('')],[C('E-posta izi',S.section),C(emailFingerprint,S.subtle),C('')],[C('Ürün',S.section),C(productName,S.card),C('')],[C('Sürüm',S.section),C(`Proof Demo v${VERSION}`,S.card),C('')],[C('Amaç',S.section),C('Ürünün kullanım akışını, veri giriş disiplinini, karar mantığını ve yönetici görünümünü değerlendirmek.',S.note),C('')],[C('Ticari kullanım',S.section),C('İzin verilmez. Gerçek işletme kararlarında üretim aracı olarak kullanmayın.',S.note),C('')],[C('Veri güvenliği',S.section),C('Demo için gerçek hassas işletme verisi yerine test veya anonimleştirilmiş veri kullanın.',S.note),C('')],[C('Fikri mülkiyet',S.section),C('Premium motor bu dosyada bulunmaz. Demo yapısının yeniden satılması veya toplu dağıtılması izin kapsamında değildir.',S.note),C('')],[C('Karar desteği',S.section),C('Bu araç karar destek amaçlıdır; mali müşavir, hukuk danışmanı veya diğer uzman görüşünün yerine geçmez.',S.note),C('')],[C('Kaynak',S.section),C('excelarsiv.com',S.accentCard),C('')],[C(''),C(''),C('')],[C(watermark,S.subtle),C(''),C('')]] });

  return { sheets, watermark, quality: { version: VERSION, sheetCount: sheets.length, inputRows: MAX_DEMO_ROWS, validations: validations.length + 1, conditionalFormats: sheets.reduce((n,s)=>n+(s.conditionalFormats?.length||0),0), productUi: ui } };
}

function buildProofDemo(args) {
  const model = makeWorkbookModel(args); const entries=[{path:'[Content_Types].xml',data:Buffer.from(contentTypes(model.sheets.length))},{path:'_rels/.rels',data:Buffer.from(rootRels())},{path:'xl/workbook.xml',data:Buffer.from(workbookXml(model.sheets))},{path:'xl/_rels/workbook.xml.rels',data:Buffer.from(workbookRels(model.sheets.length))},{path:'xl/styles.xml',data:Buffer.from(stylesXml())}];
  model.sheets.forEach((s,i)=>entries.push({path:`xl/worksheets/sheet${i+1}.xml`,data:Buffer.from(sheetXml(s))})); entries.push({path:'docProps/core.xml',data:Buffer.from(coreXml(args.productName,args.demoId))},{path:'docProps/app.xml',data:Buffer.from(appXml())}); return zip(entries);
}

const requestProofDemo = onRequest(functionDefaults, async (req,res)=>{
  if(req.method!=='POST') return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'}); const productSlug=String(req.body?.productSlug??'').trim(); const email=normalizeEmail(req.body?.email); const acceptedTerms=req.body?.acceptedTerms===true; const product=PRODUCTS[productSlug]; const spec=getProofDemoSpec(productSlug);
  if(!product||!spec) return sendJson(res,400,{error:'UNKNOWN_PRODUCT'}); if(!validEmail(email)) return sendJson(res,400,{error:'INVALID_EMAIL'}); if(!acceptedTerms) return sendJson(res,400,{error:'DEMO_TERMS_REQUIRED'}); const emailHash=sha256(email);
  try{await enforceDemoRateLimit(req,emailHash);}catch(error){if(error?.code==='DEMO_RATE_LIMITED') return sendJson(res,429,{error:'DEMO_RATE_LIMITED'}); console.error('demo rate limit failed',error?.message); return sendJson(res,500,{error:'INTERNAL_ERROR'});}
  const db=getFirestore(); const token=crypto.randomBytes(32).toString('base64url'); const tokenHash=sha256(token); const demoId=`DM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`; const emailFingerprint=emailHash.slice(0,12).toUpperCase(); const now=Date.now();
  await db.collection('excelarsiv_demo_tokens').doc(tokenHash).create({productSlug,productName:product.name,demoId,emailFingerprint,termsVersion:'2026-08-08-v3',used:false,createdAt:Timestamp.fromMillis(now),expiresAt:Timestamp.fromMillis(now+DEMO_TOKEN_TTL_MS)});
  return sendJson(res,201,{demoId,downloadUrl:`/api/demo-download?token=${encodeURIComponent(token)}`,expiresInSeconds:Math.floor(DEMO_TOKEN_TTL_MS/1000)});
});

const downloadProofDemo = onRequest(functionDefaults, async (req,res)=>{
  if(req.method!=='GET') return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'}); const token=String(req.query?.token??''); if(token.length<32||token.length>128) return sendJson(res,400,{error:'INVALID_TOKEN'}); const db=getFirestore(); const tokenHash=sha256(token); const ref=db.collection('excelarsiv_demo_tokens').doc(tokenHash); let demo=null;
  try{await db.runTransaction(async tx=>{const snap=await tx.get(ref); if(!snap.exists){const e=new Error('TOKEN_NOT_FOUND');e.code='TOKEN_NOT_FOUND';throw e;} const data=snap.data(); if(data.used||data.expiresAt?.toMillis?.()<=Date.now()){const e=new Error('TOKEN_EXPIRED');e.code='TOKEN_EXPIRED';throw e;} demo=data; tx.update(ref,{used:true,usedAt:FieldValue.serverTimestamp()});});}catch(error){if(error?.code==='TOKEN_NOT_FOUND') return sendJson(res,404,{error:'TOKEN_NOT_FOUND'}); if(error?.code==='TOKEN_EXPIRED') return sendJson(res,410,{error:'TOKEN_EXPIRED'}); console.error('demo token transaction failed',error?.message); return sendJson(res,500,{error:'INTERNAL_ERROR'});}
  const product=PRODUCTS[demo.productSlug]; const spec=getProofDemoSpec(demo.productSlug); if(!product||!spec||product.name!==demo.productName) return sendJson(res,500,{error:'CATALOG_MISMATCH'}); let buffer;
  try{buffer=buildProofDemo({productSlug:demo.productSlug,productName:product.name,priceTL:product.priceTL,demoId:demo.demoId,emailFingerprint:demo.emailFingerprint});}catch(error){console.error('proof demo v3 generation failed',error?.message);return sendJson(res,500,{error:'DEMO_GENERATION_FAILED'});}
  const filename=`${demo.productSlug}-proof-demo-v3.xlsx`; res.status(200); res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.set('Content-Disposition',`attachment; filename="${filename}"`); res.set('Content-Length',String(buffer.length)); res.set('Cache-Control','private, no-store, max-age=0'); res.set('Pragma','no-cache'); res.set('X-Content-Type-Options','nosniff'); res.set('X-Robots-Tag','noindex, nofollow'); res.set('X-ExcelArsiv-Demo-Id',demo.demoId); res.set('X-ExcelArsiv-Demo-Version',VERSION); res.end(buffer);
});

module.exports={requestProofDemo,downloadProofDemo,_test:{normalizeEmail,validEmail,sha256,shiftFormula,excelDateSerial,inferColumns,makeWorkbookModel,buildProofDemo}};
