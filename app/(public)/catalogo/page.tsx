import Link from "next/link";
import { PUBLIC_SORT_OPTIONS } from "@/lib/constants";
import { ProductCard } from "@/components/public/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { getCatalogPageDataRepository } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const query = getSingleValue(resolved.q) || "";
  const categorySlug = getSingleValue(resolved.categoria) || "";
  const sort = getSingleValue(resolved.orden) || "featured";

  const { categories, products } = await getCatalogPageDataRepository({
    query,
    categorySlug,
    sort: sort as "featured" | "price_asc" | "price_desc" | "newest",
  });

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="surface h-fit p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filtros</p>
          <form className="mt-5 space-y-5" action="/catalogo">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">Buscar</label>
              <input
                name="q"
                defaultValue={query}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-primary"
                placeholder="Producto, SKU o marca"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">Categoría</label>
              <Select name="categoria" defaultValue={categorySlug}>
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">Orden</label>
              <Select name="orden" defaultValue={sort}>
                {PUBLIC_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <button className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-white">
              Aplicar filtros
            </button>
          </form>
        </aside>

        <section>
          <div className="surface p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Catálogo</p>
                <h1 className="mt-2 text-3xl font-semibold">Productos industriales</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {products.length} resultado(s) {query ? `para "${query}"` : "disponibles"}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    href={`/catalogo/${category.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-primary hover:text-primary"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            {products.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No encontramos productos"
                description="Prueba con otra palabra, elimina filtros o navega por una categoría distinta."
                actionHref="/catalogo"
                actionLabel="Limpiar filtros"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
