export type CatalogCategory = { id: string; parentId: string | null; slug: string; name: string; isActive: boolean };
export const CATALOG_SORTS = ["custom", "featured", "name_asc", "name_desc", "price_asc", "price_desc", "newest"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export type CatalogFilters = {
  query: string;
  categorySlug: string;
  sort: CatalogSort;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
};

export function parseCatalogFilters(values: Record<string, string | string[] | undefined>): CatalogFilters {
  const one = (key: string) => (Array.isArray(values[key]) ? values[key][0] : values[key]) || "";
  const price = (key: string) => {
    const raw = one(key).trim();
    const number = Number(raw);
    return raw && Number.isFinite(number) && number >= 0 ? number : undefined;
  };
  const sort = one("orden");
  return {
    query: one("q").trim().slice(0, 200), categorySlug: one("categoria"),
    sort: CATALOG_SORTS.includes(sort as CatalogSort) ? sort as CatalogSort : "custom",
    inStock: one("disponibilidad") === "disponible", minPrice: price("min"), maxPrice: price("max"),
    page: /^\d+$/.test(one("pagina")) && Number.isSafeInteger(Number(one("pagina"))) ? Math.max(1, Number(one("pagina"))) : 1,
  };
}

export function categoryPath<T extends CatalogCategory>(categories: T[], id: string): T[] {
  const byId = new Map(categories.map(category => [category.id, category]));
  const result: T[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    result.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return result;
}

export function visibleCategories<T extends CatalogCategory>(categories: T[]): T[] {
  const byId = new Map(categories.map(category => [category.id, category]));
  return categories.filter(category => {
    const seen = new Set<string>();
    let current: T | undefined = category;
    while (current) {
      if (!current.isActive || seen.has(current.id)) return false;
      seen.add(current.id);
      if (!current.parentId) return true;
      current = byId.get(current.parentId);
      if (!current) return false;
    }
    return false;
  });
}

export function descendantCategoryIds(categories: CatalogCategory[], id: string): string[] {
  const result = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift();
    for (const child of categories) {
      if (child.parentId === parent && !result.has(child.id)) {
        result.add(child.id); queue.push(child.id);
      }
    }
  }
  return [...result];
}

export function orderedCategoryTree<T extends CatalogCategory>(categories: T[]): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  function visit(parentId: string | null) {
    for (const category of categories.filter(item => item.parentId === parentId)) {
      if (seen.has(category.id)) continue;
      seen.add(category.id); result.push(category); visit(category.id);
    }
  }
  visit(null);
  return result;
}

export function catalogHref(filters: CatalogFilters, slug = filters.categorySlug, page = 1) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.sort !== "custom") params.set("orden", filters.sort);
  if (page > 1) params.set("pagina", String(page));
  if (filters.inStock) params.set("disponibilidad", "disponible");
  if (filters.minPrice !== undefined) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max", String(filters.maxPrice));
  return `${slug ? `/catalogo/${encodeURIComponent(slug)}` : "/catalogo"}${params.size ? `?${params}` : ""}`;
}

export function catalogPage<T>(products: T[], requested = 1, pageSize = 24) {
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const page = Math.max(1, Math.min(Number.isSafeInteger(requested) ? requested : 1, pageCount));
  return { page, pageCount, products: products.slice((page - 1) * pageSize, page * pageSize) };
}
