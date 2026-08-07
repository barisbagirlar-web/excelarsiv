// 12 ürünün MDX içerik dosyalarını src/content/templates/ altına üretir.
import { mkdirSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs';
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

const projectRoot = process.cwd();
const commerceCatalog = JSON.parse(readFileSync(resolve(projectRoot, 'commerce/catalog.json'), 'utf8'));
const demoDir = resolve(projectRoot, 'public/demo');
const outDir = resolve(projectRoot, 'src/content/templates');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Ürün adı → slug eşlemesi (related çözümü için)
const slugByName = new Map(products.map((p) => [p.name, slugify(p.name)]));
const nameBySlug = new Map([...slugByName].map(([name, slug]) => [slug, name]));

function resolveRelated(p) {
  const resolved = [];
  for (const ref of p.related ?? []) {
    const slug = slugify(ref);
    const targetName = nameBySlug.get(slug);
    if (targetName && targetName !== p.name && !resolved.includes(slug)) {
      resolved.push(slug);
    }
    if (resolved.length >= 3) break;
  }
  return resolved;
}

function scalar(value) {
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  return String(value);
}

function yaml(value, indent = '  ') {
  if (Array.isArray(value)) {
    const lines = [];
    for (const item of value) {
      if (item && typeof item === 'object') {
        const entries = Object.entries(item);
        lines.push(`${indent}- ${entries[0][0]}: ${scalar(entries[0][1])}`);
        for (const [k, v] of entries.slice(1)) {
          lines.push(`${indent}  ${k}: ${scalar(v)}`);
        }
      } else {
        lines.push(`${indent}- ${scalar(item)}`);
      }
    }
    return '\n' + lines.join('\n');
  }
  return scalar(value);
}

function commerceProductFor(slug) {
  const product = commerceCatalog.products?.[slug];
  if (!product) throw new Error(`Commerce catalog product missing: ${slug}`);
  const tier = commerceCatalog.tiers?.[product.tier];
  if (!tier) throw new Error(`Commerce tier missing for ${slug}: ${product.tier}`);
  return { product, tier };
}

function frontmatter(p, slug) {
  const sheets = p.sheets.map((s) => ({ name: s.name, purpose: s.purpose, kind: s.kind }));
  const screenshots = p.sheets.map((s, i) => ({
    src: `/screenshots/${slug}-${i + 1}.png`,
    alt: `${p.name} dosyasının ${s.name} sayfası — ${s.purpose}`,
  }));
  const faq = p.faq.map((f) => ({ question: f.question, answer: f.answer }));
  const { product, tier } = commerceProductFor(slug);
  if (product.name !== p.name) throw new Error(`Commerce product name mismatch: ${slug}`);

  const block = `---
name: ${scalar(p.name)}
summary: ${scalar(p.summary)}
category: ${scalar(p.category)}
priceTL: ${tier.priceTL}
vatIncluded: true
fileFormat: ${p.fileFormat}
sizeMB: ${sizeMBOf(slug)}
sheetCount: ${p.sheets.length}
hasMacros: ${p.hasMacros}
minExcelVersion: ${scalar(p.minExcelVersion)}
macCompatible: ${p.macCompatible}
sheetsCompatibility: ${p.sheetsCompatibility}
version: ${scalar(p.version)}
updatedAt: ${scalar(p.updatedAt)}
sheetMap: ${yaml(sheets)}
inputs: ${yaml(p.inputs)}
outputs: ${yaml(p.outputs)}
suitableFor: ${yaml(p.suitableFor)}
notSuitableFor: ${yaml(p.notSuitableFor)}
requirements: ${yaml(p.requirements)}
updatePolicy: ${scalar(p.updatePolicy)}
faq: ${yaml(faq)}
demoFile: /demo/${slug}.xlsx
screenshots: ${yaml(screenshots)}
related: ${yaml(resolveRelated(p))}
---`;
  return block;
}

function sizeMBOf(slug) {
  try {
    const bytes = statSync(join(demoDir, `${slug}.xlsx`)).size;
    return Math.max(0.1, Math.round((bytes / 1048576) * 100) / 100);
  } catch {
    return 0.1;
  }
}

for (const p of products) {
  const slug = slugify(p.name);
  commerceProductFor(slug);
  const body = `Satın almadan önce demo dosyasıyla inceleyin. Ödeme Shopier altyapısıyla güvenli şekilde işlenir; ödeme doğrulandığında dosyanızı ExcelArşiv üzerinden doğrudan indirebilirsiniz.\n`;
  const file = join(outDir, `${slug}.mdx`);
  writeFileSync(file, frontmatter(p, slug) + '\n\n' + body);
  console.log(`${slug}.mdx`);
}
