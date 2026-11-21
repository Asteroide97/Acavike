import { z } from "zod";

const money = z.string().regex(/^\d{1,8}\.\d{2}$/);
export const productImportSchema = z.object({
  sourceFile: z.string().min(1), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  pricing: z.object({ publicPriceExcludesVat: z.literal(true), discountReferenceOnly: z.literal(true), ownerConfirmed: z.literal(true) }),
  products: z.array(z.object({
    sourceSheet: z.string().min(1), sourceRow: z.number().int().positive(), alegraId: z.string().trim().min(1),
    name: z.string().trim().min(1), description: z.string().nullable(),
    publicPrice: money, referenceDiscountPrice: money, currency: z.literal("MXN"),
    category: z.string().trim().min(1), subcategory: z.string().trim().min(1),
    sku: z.string().trim().min(1).nullable(), unit: z.string().trim().min(1).nullable(),
    verifiedStock: z.number().int().nonnegative().nullable(), images: z.array(z.string().url()).max(8),
  })).min(1),
});
export type ProductImport = z.infer<typeof productImportSchema>;

export function planProductImport(manifest: ProductImport, existing: Array<{ alegraId: string | null; sku: string }>) {
  const create: ProductImport["products"] = [];
  const skipped: string[] = [];
  for (const row of manifest.products) {
    if (existing.some(product => product.sku === row.sku && product.alegraId !== row.alegraId)) throw new Error(`SKU asociado a otra referencia: ${row.alegraId}`);
    if (existing.some(product => product.alegraId === row.alegraId)) skipped.push(row.alegraId);
    else create.push(row);
  }
  return { create, skipped };
}

export function importSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function reviewProductImport(value: unknown) {
  const manifest = productImportSchema.parse(value);
  const issues: string[] = [];
  for (const key of ["alegraId", "sku"] as const) {
    const seen = new Set<string>();
    for (const row of manifest.products) {
      const id = row[key];
      if (id && seen.has(id)) issues.push(`Duplicado ${key}: ${id}`);
      if (id) seen.add(id);
    }
  }
  const paths = new Map<string, string>();
  for (const row of manifest.products) {
    if (!row.sku) issues.push(`Alegra ${row.alegraId}: falta SKU confirmado`);
    if (!row.unit) issues.push(`Alegra ${row.alegraId}: falta unidad de venta confirmada`);
    if (row.images.length) issues.push(`Alegra ${row.alegraId}: imágenes pendientes de flujo autorizado de Blob; importar sin imágenes`);
    for (const [name, parent] of [[row.category, ""], [row.subcategory, row.category]]) {
      const slug = importSlug(parent ? `${parent}-${name}` : name);
      const identity = `${parent}/${name}`;
      if (!slug || (paths.has(slug) && paths.get(slug) !== identity)) issues.push(`Colisión de categoría: ${identity}`);
      paths.set(slug, identity);
    }
  }
  return { manifest, issues, ready: !issues.length };
}
