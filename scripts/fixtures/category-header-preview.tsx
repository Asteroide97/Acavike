import { notFound } from "next/navigation";
import { CatalogView } from "@/components/public/catalog-view";
import { DEMO_MODE } from "@/lib/config";
import { getCatalogPageDataRepository } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";
export default async function CategoryHeaderPreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV !== "development" || !DEMO_MODE) notFound();
  const { mode = "photo" } = await searchParams;
  const filters = { query: "", categorySlug: "empaque", sort: "custom" as const };
  const data = await getCatalogPageDataRepository(filters);
  const root = data.categories.find(category => category.slug === "empaque")!;
  const selected = {
    ...root,
    imageUrl: mode === "none" ? null : mode === "broken" ? "/missing-category-qa.png" : "/home/industrial-hero.webp",
    description: "Suministros de empaque para proteger, almacenar y preparar materiales para su distribución.",
    ...(mode === "long" ? { name: "Materiales de empaque y protección para operaciones industriales y distribución especializada" } : {}),
    ...(mode === "subcategory" ? { id: "qa-subcategory", name: "Cintas adhesivas", slug: "qa-subcategory", parentId: root.id } : {}),
  };
  return <><p className="section-shell py-2 text-xs text-slate-500">Muestra local de presentación con fotografía existente. No modifica imágenes ni datos administrados.</p><CatalogView filters={{ ...filters, categorySlug: selected.slug }} data={{ ...data, categories: mode === "subcategory" ? [...data.categories, selected] : data.categories.map(category => category.id === root.id ? selected : category) }} /></>;
}
