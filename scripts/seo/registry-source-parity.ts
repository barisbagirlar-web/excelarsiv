import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const EXIT = Object.freeze({ PASS: 0, BLOCK: 1, CONFIG: 4 });

type Registry = { records: Array<{ route: string; status: string }> };
type Catalog = { products: Record<string, unknown> };

function normalizeRoute(route: string): string {
  if (route === '/') return '/';
  return `/${route.replace(/^\/+|\/+$/g, '')}`;
}

function staticAstroRoutes(dir = resolve(ROOT, 'src/pages')): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) {
      routes.push(...staticAstroRoutes(path));
      continue;
    }
    if (!entry.endsWith('.astro') || entry.includes('[')) continue;
    const sourceRelative = relative(resolve(ROOT, 'src/pages'), path).split(sep).join('/');
    const withoutExt = sourceRelative.replace(/\.astro$/, '');
    if (withoutExt === '404') continue;
    const route = withoutExt === 'index'
      ? '/'
      : withoutExt.endsWith('/index')
        ? normalizeRoute(withoutExt.slice(0, -'/index'.length))
        : normalizeRoute(withoutExt);
    routes.push(route);
  }
  return routes;
}

function categoryRoutes(): string[] {
  const text = readFileSync(resolve(ROOT, 'src/lib/categories.ts'), 'utf8');
  return [...text.matchAll(/\bslug:\s*['"]([^'"]+)['"]/g)].map((match) => `/sablonlar/${match[1]}`);
}

function guideRoutes(): string[] {
  return readdirSync(resolve(ROOT, 'src/content/guides'))
    .filter((entry) => /\.mdx?$/.test(entry))
    .map((entry) => `/rehber/${entry.replace(/\.mdx?$/, '')}`);
}

function productRoutes(): string[] {
  const catalog = JSON.parse(readFileSync(resolve(ROOT, 'commerce/catalog.json'), 'utf8')) as Catalog;
  return Object.keys(catalog.products).map((slug) => `/sablon/${slug}`);
}

function demoRoutes(): string[] {
  return productRoutes().map((route) => route.replace('/sablon/', '/demo/'));
}

function sourceIndexableRoutes(): string[] {
  return [...new Set([
    ...staticAstroRoutes(),
    ...categoryRoutes(),
    ...guideRoutes(),
    ...productRoutes(),
    ...demoRoutes(),
  ])].sort();
}

function registryParity(registry: Registry, sourceRoutes = sourceIndexableRoutes()): { missing: string[]; extra: string[] } {
  const expected = new Set(sourceRoutes);
  const actual = new Set(registry.records.filter((record) => record.status === 'live').map((record) => normalizeRoute(record.route)));
  return {
    missing: [...expected].filter((route) => !actual.has(route)).sort(),
    extra: [...actual].filter((route) => !expected.has(route)).sort(),
  };
}

function main(): void {
  try {
    const registry = JSON.parse(readFileSync(resolve(ROOT, 'data/seo/registry/excelarsiv_seo_registry.json'), 'utf8')) as Registry;
    const routes = sourceIndexableRoutes();
    const result = registryParity(registry, routes);
    console.log(`REGISTRY SOURCE PARITY expected=${routes.length} registry=${registry.records.filter((record) => record.status === 'live').length} missing=${result.missing.length} extra=${result.extra.length}`);
    for (const route of result.missing) console.error(`MISSING ${route}`);
    for (const route of result.extra) console.error(`EXTRA ${route}`);
    if (result.missing.length || result.extra.length) process.exit(EXIT.BLOCK);
    console.log('REGISTRY SOURCE PARITY PASS');
    process.exit(EXIT.PASS);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT.CONFIG);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { EXIT, categoryRoutes, demoRoutes, guideRoutes, normalizeRoute, productRoutes, registryParity, sourceIndexableRoutes, staticAstroRoutes };
