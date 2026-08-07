'use strict';

process.env.GCLOUD_PROJECT = 'demo-excelarsiv';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-excelarsiv',
  storageBucket: 'demo-excelarsiv.appspot.com',
});

const test = require('node:test');
const assert = require('node:assert/strict');
const functions = require('../main');

test('production Firebase entrypoint exports all commerce functions', () => {
  for (const name of [
    'createCheckout',
    'checkoutStatus',
    'verifyShopierOrder',
    'recoverPurchase',
    'createDownloadToken',
    'downloadFile',
    'requestProofDemo',
    'downloadProofDemo',
  ]) {
    assert.ok(functions[name], `${name} is exported`);
  }
});
