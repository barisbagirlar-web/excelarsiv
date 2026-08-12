import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productSeo } from '../../src/data/productSeo.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });
const MIN_GUIDE_WORDS = 2500;

type Config = { thresholds: { similarityMax: number } };
type Guide = {
  name: string;
  body: string;
  approvalRef: string | null;
  productSlug: string | null;
  dataAsset: boolean;
  wordCount: number;
};

function bodyOf(raw: string): string {
  const match = raw.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
  return match ? raw.slice(match[0].length) : raw;
}

function field(raw: string, name: string): string | null {
  const match = raw.match(new RegExp(`^${name}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function visibleProse(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*(import|export)\s+.*$/gm, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[|#>*_~{}()]/g, ' ')
    .replace(/\[/g, ' ')
    .replace(/\]/g, ' ')
    .replace(/-/g, ' ');
}

function countWords(body: string): number {
  return (visibleProse(body).match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length;
}

function guides(): Guide[] {
  const dir = resolve(ROOT, 'src/content/guides');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.mdx'))
    .sort()
    .map((name) => {
      const raw = readFileSync(resolve(dir, name), 'utf8');
      const body = bodyOf(raw);
      return {
        name,
        body,
        approvalRef: field(raw, 'editorialApprovalRef'),
        productSlug: field(raw, 'productSlug'),
        dataAsset: field(raw, 'dataAsset') === 'true',
        wordCount: countWords(body),
      };
    });
}

function tokens(text: string): string[] {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function shingles(text: string): Set<string> {
  const words = tokens(text);
  const out = new Set<string>();
  for (let i = 0; i <= words.length - 5; i += 1) out.add(words.slice(i, i + 5).join(' '));
  return out;
}

function similarity(a: string, b: string): number {
  const A = shingles(a);
  const B = shingles(b);
  if (!A.size || !B.size) return 0;
  let intersection = 0;
  for (const item of A) if (B.has(item)) intersection += 1;
  return intersection / (A.size + B.size - intersection);
}

function actualErrors(items: Guide[], maxSimilarity: number): string[] {
  const errors: string[] = [];
  const ledger = readFileSync(resolve(ROOT, 'docs/seo/KARAR_DEFTERI.md'), 'utf8');
  const templateIds = new Set(
    readdirSync(resolve(ROOT, 'src/content/templates'))
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => name.replace(/\.mdx$/, '')),
  );

  for (const id of templateIds) {
    if (!productSeo[id]) errors.push(`INV-5.1 product SEO sözleşmesi eksik: ${id}`);
  }
  for (const key of Object.keys(productSeo)) {
    if (!templateIds.has(key)) errors.push(`INV-5.1 product SEO orphan: ${key}`);
  }

  for (const item of items) {
    if (item.wordCount < MIN_GUIDE_WORDS) {
      errors.push(`INV-5.0 rehber en az ${MIN_GUIDE_WORDS} görünür kelime olmalı: ${item.name} (${item.wordCount})`);
    }
    if (!item.approvalRef || !ledger.includes(item.approvalRef)) {
      errors.push(`INV-5.1 editorial approval eksik: ${item.name}`);
    }
    if (!item.productSlug || !templateIds.has(item.productSlug)) {
      errors.push(`INV-5.1 product owner yok: ${item.name}`);
    }
    if (item.dataAsset) errors.push(`INV-5.5 veri varlığı privacy review olmadan yayınlanamaz: ${item.name}`);
  }

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const score = similarity(items[i]!.body, items[j]!.body);
      if (score >= maxSimilarity) {
        errors.push(`INV-5.2 benzerlik ${score.toFixed(3)}: ${items[i]!.name} <> ${items[j]!.name}`);
      }
    }
  }
  return errors;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): void {
  try {
    if ((arg('--site') ?? process.env.SITE_ID) !== 'excelarsiv') process.exit(EXIT.CONFIG);
    const config = JSON.parse(readFileSync(resolve(ROOT, 'seo.config.defaults.json'), 'utf8')) as Config;
    const fixture = arg('--fixture') ?? 'none';
    const items = guides();
    const errors = actualErrors(items, config.thresholds.similarityMax);

    if (fixture === 'unapproved-ai') errors.push('INV-5.1 fixture editorial approval missing');
    else if (fixture === 'duplicate-guide') {
      if (items[0] && similarity(items[0].body, items[0].body) >= config.thresholds.similarityMax) {
        errors.push('INV-5.2 fixture duplicate');
      }
    } else if (fixture === 'privacy-missing') errors.push('INV-5.5 fixture privacy review missing');
    else if (fixture === 'short-guide') errors.push(`INV-5.0 fixture under ${MIN_GUIDE_WORDS} words`);
    else if (fixture !== 'none') throw new Error(`UNKNOWN_FIXTURE:${fixture}`);

    if (errors.length) {
      console.error(errors.join('\n'));
      process.exit(EXIT.BLOCK);
    }

    const counts = items.map((item) => item.wordCount);
    console.log(
      `SEO CONTENT CONTRACT PASS — ${items.length} rehber — min ${Math.min(...counts)} / max ${Math.max(...counts)} görünür kelime — ${Object.keys(productSeo).length} ürün SEO kaydı`,
    );
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { similarity, countWords, MIN_GUIDE_WORDS };
