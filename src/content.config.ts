import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const category = z.enum([
  'finansal-analiz',
  'nakit-akisi',
  'muhasebe-ve-vergi',
  'butce-ve-planlama',
  'stok-ve-uretim',
  'satis-ve-fiyatlama',
  'personel-ve-bordro',
]);

const templates = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/templates' }),
  schema: z.object({
    name: z.string().max(70),
    summary: z.string().min(40).max(160),
    category,
    priceTL: z.number().positive(),
    vatIncluded: z.literal(true),
    fileFormat: z.enum(['xlsx', 'xlsm']),
    sizeMB: z.number(),
    sheetCount: z.number().int().positive(),
    hasMacros: z.boolean(),
    minExcelVersion: z.string(),
    macCompatible: z.boolean(),
    sheetsCompatibility: z.enum(['full', 'partial', 'none']),
    version: z.string(),
    updatedAt: z.string().date(),
    sheetMap: z.array(z.object({ name: z.string(), purpose: z.string(), kind: z.enum(['input', 'calculation', 'output']) })).min(1),
    inputs: z.array(z.string()).min(3),
    outputs: z.array(z.string()).min(3),
    suitableFor: z.array(z.string()).min(3),
    notSuitableFor: z.array(z.string()).min(2),
    requirements: z.array(z.string()).min(1),
    updatePolicy: z.string(),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(6),
    screenshots: z.array(z.object({ src: z.string(), alt: z.string().min(25) })).min(3),
    related: z.array(z.string()).max(3),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().min(20).max(90),
    seoTitle: z.string().min(20).max(70),
    description: z.string().min(100).max(160),
    primaryQuery: z.string().min(5).max(80),
    productSlug: z.string().min(3),
    category,
    updatedAt: z.string().date(),
    editorialApprovalRef: z.string().datetime(),
    dataAsset: z.literal(false),
    takeaways: z.array(z.string().min(20)).min(3).max(6),
  }),
});

export const collections = { templates, guides };
