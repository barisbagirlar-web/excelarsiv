#!/usr/bin/env node
// Firebase Hosting predeploy sarmalayıcısı (CommonJS).
// firebase CLI'nin paketli node'u .mjs girişini require edemediği için
// ESM girişini dynamic import ile buradan başlatır ve iç komutların
// gerçek sistem node'unu kullanmasını sağlar.
'use strict';
const { resolve } = require('node:path');
const { execSync } = require('node:child_process');

const gercekNode = (() => {
  const adaylar = execSync('which -a node 2>/dev/null', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const gercek = adaylar.find((p) => !p.includes('.cache/firebase/runtime'));
  if (gercek) return gercek;
  return execSync('command -v node', { encoding: 'utf8' }).trim();
})();
process.env.PREDEPLOY_NODE = gercekNode;

const girilen = resolve(__dirname, 'hosting-predeploy.mjs');
process.argv[1] = girilen;

import(girilen).catch((hata) => {
  console.error(hata);
  process.exit(1);
});
