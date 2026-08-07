'use strict';

process.env.GCLOUD_PROJECT = 'demo-excelarsiv';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-excelarsiv',
  storageBucket: 'demo-excelarsiv.appspot.com',
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTS } = require('../catalog');
const { SPECS } = require('../proof-demo-specs');
const { _test } = require('../proof-demo-v3');

const ALLOWED_SHEETS = [
  'KAPAK',
  'HIZLI_BASLANGIC',
  'DEMO_GIRIS',
  'DEMO_ANALIZ',
  'DEMO_KARAR',
  'DEMO_PANO',
  'TAM_SURUM',
  'LISANS_KILAVUZ',
];

const FORBIDDEN_PREMIUM_SHEETS = ['MOTOR', 'AYARLAR', 'LISTELER', 'KONTROL', 'RAPOR', 'SENARYO_DUYARLILIK'];
const FORBIDDEN_FORMULAS = ['XLOOKUP(', 'XMATCH(', 'FILTER(', 'SORT(', 'UNIQUE(', 'LAMBDA(', 'LET(', 'VSTACK(', 'HSTACK('];

function modelFor(slug) {
  const product = PRODUCTS[slug];
  return _test.makeWorkbookModel({
    productSlug: slug,
    productName: product.name,
    priceTL: product.priceTL,
    demoId: 'DM-ABCDEF123456',
    emailFingerprint: 'A1B2C3D4E5F6',
  });
}

test('all 12 catalog products have a Proof Demo contract', () => {
  assert.equal(Object.keys(PRODUCTS).length, 12);
  assert.deepEqual(Object.keys(SPECS).sort(), Object.keys(PRODUCTS).sort());
});

test('Proof Demo v3 has the approved premium evaluation flow and no premium engine sheets', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const model = modelFor(slug);
    const names = model.sheets.map((sheet) => sheet.name);
    assert.deepEqual(names, ALLOWED_SHEETS, slug);
    assert.equal(model.quality.version, '3.0', slug);
    assert.equal(model.quality.sheetCount, 8, slug);
    assert.equal(model.quality.productUi.length, 3, slug);
    for (const forbidden of FORBIDDEN_PREMIUM_SHEETS) {
      assert.ok(!names.includes(forbidden), `${slug}: forbidden sheet ${forbidden}`);
    }
  }
});

test('Proof Demo v3 keeps 20 editable evaluation rows but adds validation and visual feedback', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const model = modelFor(slug);
    const input = model.sheets.find((sheet) => sheet.name === 'DEMO_GIRIS');
    assert.ok(input, slug);
    assert.equal(input.rows.length, 25, `${slug}: 5 header rows + 20 demo rows`);
    assert.equal(input.dataValidations.length, 5, `${slug}: every input column validated`);
    assert.ok(input.conditionalFormats.length >= 5, `${slug}: live input visual rules`);
    assert.ok(model.quality.validations >= 6, `${slug}: validation floor`);
    assert.ok(model.quality.conditionalFormats >= 10, `${slug}: conditional formatting floor`);
    assert.match(model.watermark, /DM-ABCDEF123456/);
    assert.match(model.watermark, /A1B2C3D4E5F6/);
  }
});

test('Proof Demo v3 has analysis, decision and print-ready manager presentation', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const model = modelFor(slug);
    const analysis = model.sheets.find((sheet) => sheet.name === 'DEMO_ANALIZ');
    const decision = model.sheets.find((sheet) => sheet.name === 'DEMO_KARAR');
    const dashboard = model.sheets.find((sheet) => sheet.name === 'DEMO_PANO');
    const full = model.sheets.find((sheet) => sheet.name === 'TAM_SURUM');
    assert.ok(analysis?.dataValidations?.length >= 1, slug);
    assert.ok(decision?.conditionalFormats?.length >= 3, slug);
    assert.ok(dashboard?.conditionalFormats?.length >= 6, slug);
    assert.ok(dashboard?.print, `${slug}: dashboard print config`);
    assert.ok(full?.print, `${slug}: full-version comparison print config`);
  }
});

test('Proof Demo formulas avoid banned modern/spill functions and premium sheet references', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const model = modelFor(slug);
    const formulas = model.sheets
      .flatMap((sheet) => sheet.rows)
      .flatMap((row) => row)
      .map((cell) => cell?.v)
      .filter((value) => typeof value === 'string' && value.startsWith('='))
      .map((value) => value.toUpperCase());

    for (const formula of formulas) {
      for (const fn of FORBIDDEN_FORMULAS) assert.ok(!formula.includes(fn), `${slug}: ${fn}`);
      for (const sheet of FORBIDDEN_PREMIUM_SHEETS) assert.ok(!formula.includes(`${sheet}!`), `${slug}: ${sheet} ref`);
    }
  }
});

test('runtime-generated Proof Demo v3 is a compact XLSX ZIP for all 12 products', () => {
  for (const slug of Object.keys(PRODUCTS)) {
    const product = PRODUCTS[slug];
    const buffer = _test.buildProofDemo({
      productSlug: slug,
      productName: product.name,
      priceTL: product.priceTL,
      demoId: 'DM-ABCDEF123456',
      emailFingerprint: 'A1B2C3D4E5F6',
    });
    assert.equal(buffer.subarray(0, 2).toString('ascii'), 'PK', `${slug}: zip signature`);
    assert.ok(buffer.length < 900 * 1024, `${slug}: demo must stay <900 KB`);
  }
});

test('date-like demo inputs are true Excel serial dates, not presentation-only text', () => {
  assert.equal(_test.excelDateSerial('01.08.2026'), 46235);
  assert.equal(_test.excelDateSerial('not-a-date'), null);
});

test('email handling never requires raw email in the workbook fingerprint', () => {
  const email = _test.normalizeEmail('  Demo.User@Example.COM ');
  assert.equal(email, 'demo.user@example.com');
  assert.equal(_test.validEmail(email), true);
  const fingerprint = _test.sha256(email).slice(0, 12).toUpperCase();
  assert.equal(fingerprint.length, 12);
  assert.ok(!fingerprint.includes('@'));
});
