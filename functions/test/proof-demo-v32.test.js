'use strict';

process.env.GCLOUD_PROJECT = 'demo-excelarsiv';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-excelarsiv',
  storageBucket: 'demo-excelarsiv.appspot.com',
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTS } = require('../catalog');
const { _test: v31 } = require('../proof-demo-v31');
const { _test } = require('../proof-demo-v32');

function build(slug) {
  const product = PRODUCTS[slug];
  return _test.buildProofDemo({
    productSlug: slug,
    productName: product.name,
    priceTL: product.priceTL,
    demoId: 'DM-OOXMLSAFE32',
    emailFingerprint: 'ABCDEF123456',
  });
}

function entryMap(buffer) {
  return new Map(v31.unzipLocalEntries(buffer).map((entry) => [entry.path, entry.data.toString('utf8')]));
}

test('v3.2 rejects workbookProtection after bookViews (Excel repair trigger)', () => {
  const invalid = '<workbook><workbookPr/><bookViews><workbookView/></bookViews><workbookProtection workbookPassword="CC3D"/><sheets/></workbook>';
  assert.throws(() => _test.assertWorkbookElementOrder(invalid), /WORKBOOK_PROTECTION_SCHEMA_ORDER_INVALID/);
  const fixed = _test.normalizeWorkbookElementOrder(invalid);
  assert.ok(fixed.indexOf('<workbookProtection') < fixed.indexOf('<bookViews'));
  assert.equal(_test.assertWorkbookElementOrder(fixed), true);
  const valid = '<workbook><workbookPr/><workbookProtection workbookPassword="CC3D"/><bookViews><workbookView/></bookViews><sheets/></workbook>';
  assert.equal(_test.assertWorkbookElementOrder(valid), true);
});

test('v3.2 rejects dxf fill-before-font order that triggers Excel repair', () => {
  const invalid = '<dxfs><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFE5F5EC"/></patternFill></fill><font><b/><color rgb="FF1F7A4D"/></font></dxf></dxfs>';
  assert.throws(() => _test.assertDxfChildOrder(invalid), /DXF_CHILD_ORDER_INVALID/);
  const fixed = _test.normalizeDxfChildOrder(invalid);
  assert.ok(fixed.indexOf('<font') < fixed.indexOf('<fill'));
  assert.equal(_test.assertDxfChildOrder(fixed), true);
});

test('all proof-demo products emit styles.xml with valid dxf child order', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const entries = entryMap(build(slug));
    const styles = entries.get('xl/styles.xml');
    assert.ok(styles, `${slug}: styles`);
    assert.equal(_test.assertDxfChildOrder(styles), true, `${slug}: dxf order`);
  }
});

test('v3.2 moves sheetProtection immediately after sheetData and before later worksheet elements', () => {
  const invalid = '<worksheet><sheetData><row r="1"/></sheetData><mergeCells count="1"/><conditionalFormatting sqref="A1"/><sheetProtection password="CC3D" sheet="1"/></worksheet>';
  const fixed = _test.normalizeWorksheetProtectionOrder(invalid);
  assert.ok(fixed.indexOf('</sheetData>') < fixed.indexOf('<sheetProtection'));
  assert.ok(fixed.indexOf('<sheetProtection') < fixed.indexOf('<mergeCells'));
  assert.ok(fixed.indexOf('<sheetProtection') < fixed.indexOf('<conditionalFormatting'));
  assert.equal((fixed.match(/<sheetProtection\b/g) || []).length, 1);
  assert.equal(_test.assertWorksheetProtectionOrder(fixed), true);
});

test('v3.2 rejects the exact schema-order defect that triggered Excel repair', () => {
  const invalid = '<worksheet><sheetData></sheetData><mergeCells/><sheetProtection password="CC3D"/></worksheet>';
  assert.throws(() => _test.assertWorksheetProtectionOrder(invalid), /SHEET_PROTECTION_SCHEMA_ORDER_INVALID/);
});

test('all proof-demo products emit eight worksheet parts with valid protection order', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const entries = entryMap(build(slug));
    for (let index = 1; index <= 8; index += 1) {
      const path = `xl/worksheets/sheet${index}.xml`;
      const xml = entries.get(path);
      assert.ok(xml, `${slug}: ${path}`);
      assert.equal(_test.assertWorksheetProtectionOrder(xml), true, `${slug}: ${path}`);
      const protection = xml.indexOf('<sheetProtection');
      if (protection >= 0) {
        assert.ok(xml.indexOf('</sheetData>') < protection, `${slug}: protection after sheetData`);
        for (const later of ['<autoFilter', '<mergeCells', '<conditionalFormatting', '<dataValidations', '<printOptions', '<pageMargins', '<pageSetup', '<headerFooter']) {
          const laterIndex = xml.indexOf(later);
          if (laterIndex >= 0) assert.ok(protection < laterIndex, `${slug}: protection before ${later}`);
        }
      }
    }
  }
});

test('v3.2 preserves v3.1 workbook content fixes while changing only worksheet order contract', () => {
  const slug = '13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi';
  const entries = entryMap(build(slug));
  const styles = entries.get('xl/styles.xml');
  const workbook = entries.get('xl/workbook.xml');
  const input = entries.get('xl/worksheets/sheet3.xml');
  assert.match(styles, /patternType="gray125"/);
  assert.match(workbook, /<bookViews><workbookView activeTab="0"\/><\/bookViews>/);
  assert.ok(workbook.indexOf('<workbookProtection') < workbook.indexOf('<bookViews'));
  assert.equal(_test.assertWorkbookElementOrder(workbook), true);
  const row12 = input.match(/<row r="12"[^>]*>([\s\S]*?)<\/row>/);
  assert.ok(row12);
  assert.ok(!row12[1].includes('<f>'), 'empty demo row must stay formula-free');
});
