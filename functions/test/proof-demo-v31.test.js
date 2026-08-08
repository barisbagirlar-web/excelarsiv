'use strict';

process.env.GCLOUD_PROJECT = 'demo-excelarsiv';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-excelarsiv',
  storageBucket: 'demo-excelarsiv.appspot.com',
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTS } = require('../catalog');
const { _test } = require('../proof-demo-v31');

function build(slug) {
  const product = PRODUCTS[slug];
  return _test.buildProofDemo({
    productSlug: slug,
    productName: product.name,
    priceTL: product.priceTL,
    demoId: 'DM-EXCELSAFE01',
    emailFingerprint: 'ABCDEF123456',
  });
}

function entryMap(buffer) {
  return new Map(_test.unzipLocalEntries(buffer).map((entry) => [entry.path, entry.data.toString('utf8')]));
}

test('v3.1 styles include Excel-required gray125 reserved fill and shifted fill ids', () => {
  const buffer = build('13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi');
  const entries = entryMap(buffer);
  const styles = entries.get('xl/styles.xml');
  assert.ok(styles);
  assert.match(styles, /<fills count="12"><fill><patternFill patternType="none"\/><\/fill><fill><patternFill patternType="gray125"\/><\/fill>/);
  assert.match(styles, /<cellXfs count="25">/);
  assert.match(styles, /fillId="7"/); // canvas fill was 6 in v3 and must shift after gray125 insertion
});

test('v3.1 workbook exposes all eight required sheets including DEMO_ANALIZ', () => {
  const buffer = build('13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi');
  const entries = entryMap(buffer);
  const workbook = entries.get('xl/workbook.xml');
  assert.ok(workbook);
  for (const name of ['KAPAK','HIZLI_BASLANGIC','DEMO_GIRIS','DEMO_ANALIZ','DEMO_KARAR','DEMO_PANO','TAM_SURUM','LISANS_KILAVUZ']) {
    assert.ok(workbook.includes(`name="${name}"`), name);
  }
  assert.match(workbook, /<bookViews><workbookView activeTab="0"\/><\/bookViews>/);
});

test('v3.1 mandatory presentation sheets contain visible content, not empty worksheet shells', () => {
  const buffer = build('13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi');
  const entries = entryMap(buffer);
  const expected = [
    ['xl/worksheets/sheet1.xml', 'EXCEL ARŞİV · 10/10 PROOF DEMO'],
    ['xl/worksheets/sheet2.xml', '60 SANİYEDE DEĞERİ GÖR'],
    ['xl/worksheets/sheet4.xml', 'DEMO ANALİZ · VERİ KALİTESİ VE RİSK ÖNİZLEMESİ'],
    ['xl/worksheets/sheet5.xml', 'DEMO KARAR · KARAR KAPISI'],
    ['xl/worksheets/sheet6.xml', 'YÖNETİCİ PANO'],
    ['xl/worksheets/sheet7.xml', 'TAM SÜRÜMDE NE AÇILIYOR?'],
    ['xl/worksheets/sheet8.xml', 'PROOF DEMO · KULLANIM BİLGİSİ'],
  ];
  for (const [path, text] of expected) {
    const xml = entries.get(path);
    assert.ok(xml, path);
    assert.ok(xml.includes(text), `${path}: ${text}`);
    assert.ok((xml.match(/<row /g) || []).length >= 5, `${path}: visible row floor`);
  }
});

test('v3.1 empty input rows do not retain copied formulas or fabricated output values', () => {
  const buffer = build('13-haftalik-nakit-akisi-ve-odeme-planlama-sistemi');
  const entries = entryMap(buffer);
  const input = entries.get('xl/worksheets/sheet3.xml');
  assert.ok(input);
  const row12 = input.match(/<row r="12"[^>]*>([\s\S]*?)<\/row>/);
  assert.ok(row12);
  assert.ok(!row12[1].includes('<f>'), 'first empty demo row must not contain formulas');
});

test('all 12 v3.1 products preserve eight populated worksheet parts', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const entries = entryMap(build(slug));
    for (let index = 1; index <= 8; index += 1) {
      const xml = entries.get(`xl/worksheets/sheet${index}.xml`);
      assert.ok(xml, `${slug}: sheet${index}`);
      assert.ok(xml.includes('<sheetData>'), `${slug}: sheet${index} sheetData`);
      assert.ok((xml.match(/<row /g) || []).length >= 5, `${slug}: sheet${index} populated`);
    }
  }
});
