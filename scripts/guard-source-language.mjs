import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const scanRoots = ['src', 'scripts', 'functions'];
const rootFiles = ['astro.config.mjs'];
const codeExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.astro']);
const skipDirectories = new Set(['node_modules', 'dist', '.git', 'coverage', '.astro']);
const turkishCharacters = /[çğıöşüÇĞİÖŞÜ]/u;
const violations = [];

function walk(directory, out = []) {
  for (const entry of readdirSync(directory)) {
    if (skipDirectories.has(entry)) continue;
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, out);
    else if (codeExtensions.has(extname(absolute))) out.push(absolute);
  }
  return out;
}

function scriptKind(file) {
  const extension = extname(file);
  if (extension === '.tsx') return ts.ScriptKind.TSX;
  if (extension === '.jsx') return ts.ScriptKind.JSX;
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function inspectScript(code, file, section) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, scriptKind(file));
  const visit = (node) => {
    if (ts.isIdentifier(node) && turkishCharacters.test(node.text)) {
      const position = source.getLineAndCharacterOfPosition(node.getStart(source));
      violations.push(`${relative(root, file)}${section}: ${position.line + 1}:${position.character + 1} -> ${node.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function inspectAstro(source, file) {
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) inspectScript(frontmatter[1], file, ':frontmatter');

  let index = 0;
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1] || '';
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attributes)) continue;
    index += 1;
    inspectScript(match[2], file, `:script-${index}`);
  }
}

const files = [];
for (const directory of scanRoots) {
  const absolute = resolve(root, directory);
  try {
    if (statSync(absolute).isDirectory()) walk(absolute, files);
  } catch {
    // Optional roots may be absent in isolated tooling contexts.
  }
}
for (const file of rootFiles) files.push(resolve(root, file));

for (const file of files) {
  const relativePath = relative(root, file);
  if (turkishCharacters.test(relativePath)) {
    violations.push(`${relativePath}: teknik dosya yolunda Türkçe karakter`);
  }
  const source = readFileSync(file, 'utf8');
  if (extname(file) === '.astro') inspectAstro(source, file);
  else inspectScript(source, file, '');
}

if (violations.length > 0) {
  console.error('SOURCE LANGUAGE GUARD KALDI');
  console.error('Görünen Türkçe metin serbesttir; teknik identifier ve teknik dosya yolları ASCII kalmalıdır.');
  for (const violation of violations.slice(0, 40)) console.error(`  - ${violation}`);
  if (violations.length > 40) console.error(`  - ... ${violations.length - 40} ek ihlal`);
  process.exit(1);
}

console.log(`SOURCE LANGUAGE GUARD GEÇTİ — ${files.length} teknik kaynak dosyası tarandı.`);
