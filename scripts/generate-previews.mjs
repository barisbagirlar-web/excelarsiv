// 12 ürünün 3'er screenshot'ını public/screenshots/ altına üretir.
// Kaynak: Excel ekran görüntüsü estetiğinde SVG (başlık çubuğu, formül çubuğu, donmuş başlık ızgarası, sheet sekmeleri).
// macOS `sips` ile aynı en-boy oranında PNG'ye rasterize edilir (qlmanage oranı bozuyor).
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { products } from './product-data.mjs';

function slugify(text) {
  const map = {
    ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u', Â: 'a', Î: 'i', Û: 'u',
  };
  return text
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = 1200;
const H = 750;

function kindColors(kind) {
  if (kind === 'input') return { headerBg: '#0C2D57', headerText: '#FFFFFF', bodyBg: '#E8EEF7' };
  if (kind === 'output') return { headerBg: '#0F766E', headerText: '#FFFFFF', bodyBg: '#E5F5F3' };
  return { headerBg: '#1F2937', headerText: '#FFFFFF', bodyBg: '#F5F3EE' };
}

function svg(sheet, index, total, p) {
  const { headers, rows } = sheet;
  const colors = kindColors(sheet.kind);
  const rowH = 44;
  const colW = (W - 40) / Math.max(headers.length, 2);
  const bodyTop = 150;
  const maxRows = 8;
  const shownRows = rows.slice(0, maxRows);

  const headerCells = headers
    .map((h, i) => {
      const x = 20 + i * colW;
      return `<rect x="${x}" y="${bodyTop}" width="${colW - 1}" height="${rowH}" fill="${colors.headerBg}"/><text x="${x + 12}" y="${bodyTop + 28}" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="600" fill="${colors.headerText}">${esc(h)}</text>`;
    })
    .join('');

  const bodyCells = shownRows
    .map((row, ri) =>
      row
        .map((value, ci) => {
          const x = 20 + ci * colW;
          const y = bodyTop + (ri + 1) * rowH;
          const isFormula = typeof value === 'string' && value.startsWith('=');
          const text = isFormula ? value.slice(0, 22) : String(value ?? '');
          const fill = isFormula ? '#FFFDE7' : ci === 0 ? colors.bodyBg : '#FFFFFF';
          const textColor = isFormula ? '#0C2D57' : '#1F2937';
          const numeric = typeof value === 'number';
          const anchor = numeric ? 'end' : 'start';
          const tx = numeric ? x + colW - 12 : x + 12;
          return `<rect x="${x}" y="${y}" width="${colW - 1}" height="${rowH - 1}" fill="${fill}" stroke="#E5E2DB" stroke-width="1"/><text x="${tx}" y="${y + 28}" text-anchor="${anchor}" font-family="'JetBrains Mono',Menlo,monospace" font-size="15" fill="${textColor}">${esc(text)}</text>`;
        })
        .join('')
    )
    .join('');

  const tabs = p.sheets
    .map(
      (s, ti) =>
        `<text x="${24 + ti * 150}" y="${H - 22}" font-family="'JetBrains Mono',Menlo,monospace" font-size="15" font-weight="${ti === index ? '700' : '400'}" fill="${ti === index ? '#0C2D57' : '#9CA3AF'}">${esc(s.name)}</text>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <rect x="0" y="0" width="${W}" height="44" fill="#F5F3EE"/>
  <text x="20" y="28" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="700" fill="#1F2937">${esc(p.name)}</text>
  <text x="${W - 20}" y="28" text-anchor="end" font-family="'JetBrains Mono',Menlo,monospace" font-size="13" fill="#9CA3AF">${esc(p.sheets[index].name)} · DEMO</text>
  <rect x="0" y="44" width="${W}" height="40" fill="#FFFFFF" stroke="#E5E2DB" stroke-width="1"/>
  <rect x="14" y="52" width="34" height="24" fill="#0C2D57" rx="2"/>
  <text x="31" y="69" text-anchor="middle" font-family="'JetBrains Mono',Menlo,monospace" font-size="13" font-weight="700" fill="#FFFFFF">fx</text>
  <rect x="54" y="52" width="${W - 70}" height="24" fill="#FDFCFA" stroke="#C9C4B8" stroke-width="1"/>
  <text x="64" y="69" font-family="'JetBrains Mono',Menlo,monospace" font-size="14" fill="#4B5563">${esc(sheet.kind === 'calculation' ? '=Hesap!B2+C2' : `${sheet.kind} sayfası — örnek veri`)}</text>
  ${headerCells}
  ${bodyCells}
  <line x1="20" y1="${bodyTop + (maxRows + 1) * rowH}" x2="${W - 20}" y2="${bodyTop + (maxRows + 1) * rowH}" stroke="#E5E2DB" stroke-width="1"/>
  <rect x="0" y="${H - 40}" width="${W}" height="40" fill="#F5F3EE" stroke="#E5E2DB" stroke-width="1"/>
  ${tabs}
</svg>`;
}

const outDir = resolve(process.cwd(), 'public/screenshots');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const p of products) {
  const slug = slugify(p.name);
  p.sheets.forEach((sheet, index) => {
    const svgFile = join(outDir, `${slug}-${index + 1}.svg`);
    const pngFile = join(outDir, `${slug}-${index + 1}.png`);
    writeFileSync(svgFile, svg(sheet, index, p.sheets.length, p));
    execSync(`sips -s format png "${svgFile}" --out "${pngFile}" > /dev/null 2>&1`);
    rmSync(svgFile);
    count += 1;
  });
}
console.log(`${count} PNG screenshot üretildi.`);
