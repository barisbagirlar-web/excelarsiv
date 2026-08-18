import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const retired = [
  { route: '/excel-araclari', source: 'src/pages/excel-araclari.astro' },
  { route: '/paketler', source: 'src/pages/paketler.astro' },
];
const activeLinkSurfaces = [
  'src/components/SiteHeader.astro',
  'src/components/SiteFooter.astro',
  'src/components/home/FinalCTA.astro',
];
const violations = [];

for (const item of retired) {
  if (existsSync(resolve(root, item.source))) {
    violations.push(`${item.source}: retired route source exists (${item.route})`);
  }
}

for (const file of activeLinkSurfaces) {
  const absolute = resolve(root, file);
  if (!existsSync(absolute)) continue;
  const source = readFileSync(absolute, 'utf8');
  for (const item of retired) {
    if (source.includes(item.route)) {
      violations.push(`${file}: retired route reference exists (${item.route})`);
    }
  }
}

function walk(directory, out = []) {
  if (!existsSync(directory)) return out;
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, out);
    else out.push(absolute);
  }
  return out;
}

if (distMode) {
  const dist = resolve(root, 'dist');
  for (const item of retired) {
    const slug = item.route.slice(1);
    for (const candidate of [
      resolve(dist, slug, 'index.html'),
      resolve(dist, `${slug}.html`),
    ]) {
      if (existsSync(candidate)) {
        violations.push(`${relative(root, candidate)}: retired route was built (${item.route})`);
      }
    }
  }

  const inspectExtensions = new Set(['.html', '.xml', '.txt', '.json']);
  for (const file of walk(dist)) {
    const dot = file.lastIndexOf('.');
    const extension = dot >= 0 ? file.slice(dot) : '';
    if (!inspectExtensions.has(extension)) continue;
    const content = readFileSync(file, 'utf8');
    for (const item of retired) {
      if (content.includes(item.route)) {
        violations.push(`${relative(root, file)}: retired route leaked into build artifact (${item.route})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('RETIRED ROUTES GUARD KALDI');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(
  distMode
    ? 'RETIRED ROUTES GUARD GEÇTİ — kaynak, build ve SEO çıktılarında /excel-araclari ile /paketler yok.'
    : 'RETIRED ROUTES GUARD GEÇTİ — /excel-araclari ve /paketler kaynak rotaları kalıcı olarak kapalı.',
);
