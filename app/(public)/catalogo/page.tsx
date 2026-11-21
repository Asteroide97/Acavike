import { CatalogView } from "@/components/public/catalog-view";
import { parseCatalogFilters } from "@/lib/catalog-filters";
import { getCatalogPageDataRepository } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseCatalogFilters(await searchParams);
  const result = await getCatalogPageDataRepository(filters).then(data => ({ data, unavailable: false })).catch(() => ({ data: { categories: [], products: [] }, unavailable: true }));
  return <CatalogView {...result} filters={filters} />;
}
