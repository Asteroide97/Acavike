import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ProductCard } from "@/components/public/product-card";
import { CatalogBreadcrumbs } from "@/components/public/catalog-breadcrumbs";
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
  noStore();
  const resolved = await searchParams;
  const query = getSingleValue(resolved.q) || "";
  const categorySlug = getSingleValue(resolved.categoria) || "";
  const sort = getSingleValue(resolved.orden) || "featured";

  const { categories, products } = await getCatalogPageDataRepository({
    query,
    categorySlug,
    sort: sort as "featured" | "price_asc" | "price_desc" | "newest",
  });

  const activeCategory = categories.find((category) => category.slug === categorySlug) || null;

  return (
    <div className="section-shell py-4 md:py-6">
      <CatalogBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Todos los productos" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <aside className="public-panel h-fit p-4">
          <p className="public-kicker">Catalogo</p>
          <h1 className="mt-2 text-[24px] font-bold text-slate-900">Categorias</h1>
          <div className="mt-4 grid gap-2 text-[13px]">
            <Link
              href="/catalogo"
              className={`border px-3 py-2 ${!categorySlug ? "border-[#003A70] bg-[#E8F0F7] font-bold text-[#003A70]" : "border-slate-200 text-slate-700 hover:border-[#003A70]"}`}
            >
              Todos los productos
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalogo?categoria=${category.slug}`}
                className={`border px-3 py-2 ${category.slug === categorySlug ? "border-[#003A70] bg-[#E8F0F7] font-bold text-[#003A70]" : "border-slate-200 text-slate-700 hover:border-[#003A70]"}`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 text-[12px] leading-6 text-slate-600">
            Compra por transferencia bancaria y solicita cotizacion para volumen o reposicion frecuente.
          </div>
        </aside>

        <section className="space-y-4">
          <div className="public-panel p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="public-kicker">Listado general</p>
                <h2 className="mt-2 text-[28px] font-bold text-slate-900">Todos los productos</h2>
                <p className="mt-2 text-[13px] text-slate-700">
                  {products.length} resultado(s)
                  {activeCategory ? ` en ${activeCategory.name}` : ""}
                  {query ? ` para "${query}"` : ""}.
                </p>
              </div>

              <form action="/catalogo" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                {categorySlug ? <input type="hidden" name="categoria" value={categorySlug} /> : null}
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar SKU, producto o categoria"
                  className="public-input"
                />
                <select name="orden" defaultValue={sort} className="public-select">
                  <option value="featured">Destacados</option>
                  <option value="price_asc">Precio menor a mayor</option>
                  <option value="price_desc">Precio mayor a menor</option>
                  <option value="newest">Mas recientes</option>
                </select>
                <button className="public-btn" type="submit">
                  Aplicar
                </button>
              </form>
            </div>
          </div>

          {products.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="public-panel p-8 text-center">
              <h3 className="text-[20px] font-bold text-slate-900">No encontramos productos</h3>
              <p className="mt-2 text-[13px] text-slate-700">
                Ajusta la busqueda o elimina filtros para ver mas resultados del catalogo.
              </p>
              <Link href="/catalogo" className="public-btn mt-4">
                Limpiar filtros
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
