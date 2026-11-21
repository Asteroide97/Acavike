import { notFound } from "next/navigation";
import { CatalogView } from "@/components/public/catalog-view";
import { parseCatalogFilters } from "@/lib/catalog-filters";
import { getCatalogPageDataRepository } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function CategoryCatalogPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const filters = parseCatalogFilters({ ...await searchParams, categoria: slug });
  const result = await getCatalogPageDataRepository(filters).then(data => ({ data, unavailable: false })).catch(() => ({ data: { categories: [], products: [] }, unavailable: true }));
  if (!result.unavailable && !result.data.categories.some(category => category.slug === slug)) notFound();
  return <CatalogView {...result} filters={filters} />;
}
