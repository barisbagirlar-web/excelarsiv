// Smoke test — dist/ HTML'lerini render + kırık iç link + içerik için doğrular.
// Bağımlılıksız (node >= 18). Kullanım: npm test
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (extname(full) === '.html') {
      out.push(full);
    }
  }
  return out;
}

const pages = walk(dist).map((file) => file.replace(dist + '/', ''));
const failures = [];

function existsAsFile(base) {
  try {
    return statSync(base).isFile();
  } catch {
    return false;
  }
}

for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');

  if (!/<title>[\s\S]*<\/title>/.test(html)) {
    failures.push(`${page}: <title> eksik`);
  }
  if (!/<main[\s>]/.test(html)) {
    failures.push(`${page}: <main> eksik`);
  }

  // Kırık iç link kontrolü: yalnızca kök-relative href'ler (dış linkler hariç)
  const links = [...html.matchAll(/href="\/([^"#]*?)(?:#[\s\S]*?)?"/g)]
    .map((m) => m[1].replace(/\/+$/, ''))
    .filter((p) => p.length > 0);
  for (const target of [...new Set(links)]) {
    if (target.includes('.')) {
      // Statik varlık: doğrudan dosya olarak kontrol et
      if (existsAsFile(join(dist, target))) continue;
      failures.push(`${page}: kırık link -> /${target}`);
      continue;
    }
    const exists =
      existsAsFile(join(dist, `${target}.html`)) || existsAsFile(join(dist, target, 'index.html'));
    if (!exists) {
      failures.push(`${page}: kırık link -> /${target}`);
    }
  }

  // İnline client script sözdizimi: dist'e geçersiz JS sızmamalı
  // (JSON-LD dışındaki inline script'ler tarayıcıda olduğu gibi çalışır)
  const scripts = [...html.matchAll(/<script(?!\s+type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => ({ src: /src=/.test(m[0]), body: m[1] }))
    .filter((s) => !s.src && s.body.trim().length > 0);
  for (const s of scripts) {
    try {
      new Function(s.body);
    } catch (e) {
      failures.push(`${page}: geçersiz inline JS -> ${e.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error('SMOKE TEST KALDI');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log(`SMOKE TEST GEÇTİ — ${pages.length} sayfa render, kırık iç link yok`);
