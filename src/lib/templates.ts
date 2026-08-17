import { getCollection, type CollectionEntry } from 'astro:content';
import { pickCatalogScreenshot } from './catalog-screenshot';
import { getCategoryName, type CategorySlug } from './categories';
import { shopierUrlForPrice } from './shopier';
import type { SearchItem } from './search';

export interface TemplateSheetMap {
  name: string;
  kind: 'input' | 'calculation' | 'output';
}

export interface TemplatePreview {
  src: string;
  alt: string;
}

export type ScreenshotFocus = 'result' | 'top' | 'center';

export interface TemplateViewModel {
  slug: string;
  name: string;
  summary: string;
  categorySlug: CategorySlug;
  categoryName: string;
  priceTL: number;
  sheetCount: number;
  version?: string;
  fileFormat?: 'xlsx' | 'xlsm';
  sheetMap?: TemplateSheetMap[];
  outputs?: string[];
  preview?: TemplatePreview;
  screenshotFocus: ScreenshotFocus;
  url: string;
  shopierUrl: string;
}

export type TemplateEntry = CollectionEntry<'templates'>;

export function toTemplateViewModel(entry: TemplateEntry): TemplateViewModel {
  const data = entry.data;
  return {
    slug: entry.id,
    name: data.name,
    summary: data.summary,
    categorySlug: data.category,
    categoryName: getCategoryName(data.category),
    priceTL: data.priceTL,
    sheetCount: data.sheetCount,
    version: data.version,
    fileFormat: data.fileFormat,
    sheetMap: data.sheetMap,
    outputs: data.outputs,
    preview: pickCatalogScreenshot(data.screenshots),
    screenshotFocus: 'result',
    url: `/sablon/${entry.id}`,
    shopierUrl: shopierUrlForPrice(data.priceTL),
  };
}

export async function getAllTemplates(): Promise<TemplateViewModel[]> {
  const entries = await getCollection('templates');
  return entries.map(toTemplateViewModel);
}

export async function getFeaturedTemplates(count = 6): Promise<TemplateViewModel[]> {
  const all = await getAllTemplates();
  return all.slice(0, count);
}

export async function getTemplatesByCategory(categorySlug: string): Promise<TemplateViewModel[]> {
  const all = await getAllTemplates();
  return all.filter((t) => t.categorySlug === categorySlug);
}

export async function getTemplateSearchIndex(): Promise<SearchItem[]> {
  const all = await getAllTemplates();
  return all.map((t) => ({
    name: t.name,
    summary: t.summary,
    category: t.categoryName,
    url: t.url,
  }));
}
