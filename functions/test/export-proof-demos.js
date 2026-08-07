'use strict';

process.env.GCLOUD_PROJECT = 'demo-excelarsiv';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-excelarsiv',
  storageBucket: 'demo-excelarsiv.appspot.com',
});

const fs = require('node:fs');
const path = require('node:path');
const { PRODUCTS } = require('../catalog');
const { _test } = require('../proof-demo');

const outDir = process.argv[2] || '/tmp/excelarsiv-proof-demos';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const [slug, product] of Object.entries(PRODUCTS)) {
  const buffer = _test.buildProofDemo({
    productSlug: slug,
    productName: product.name,
    priceTL: product.priceTL,
    demoId: 'DM-CI0000000001',
    emailFingerprint: 'C1C1C1C1C1C1',
  });
  const file = path.join(outDir, `${slug}.xlsx`);
  fs.writeFileSync(file, buffer);
  process.stdout.write(`${path.basename(file)}\t${buffer.length}\n`);
}
