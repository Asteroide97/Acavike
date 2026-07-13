import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { CatalogBreadcrumbs } from "@/components/public/catalog-breadcrumbs";
import { ProductCard } from "@/components/public/product-card";
import { getCatalogPageDataRepository } from "@/lib/repositories/catalog";
import { getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";

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

  const [catalogResult, settingsResult] = await Promise.allSettled([
    getCatalogPageDataRepository({
      query,
      categorySlug,
      sort: sort as "featured" | "price_asc" | "price_desc" | "newest",
    }),
    getSiteSettingsMap(),
  ]);
  const catalogData =
    catalogResult.status === "fulfilled"
      ? catalogResult.value
      : { categories: [], products: [] };
  const settings =
    settingsResult.status === "fulfilled" && settingsResult.value
      ? settingsResult.value
      : {};
  const { categories, products } = catalogData;
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const activeCategory = safeCategories.find((category) => category.slug === categorySlug) || null;
  const contact = getPublicContactDetails(settings);

  return (
    <div className="section-shell py-4 md:py-6">
      <CatalogBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Todos los productos" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4">
          <div className="public-panel h-fit p-4">
            <p className="public-kicker">Catálogo</p>
            <h1 className="mt-2 text-[24px] font-semibold text-slate-900">Categorías</h1>
            <div className="mt-4 grid gap-2 text-[13px]">
              <Link
                href="/catalogo"
                className={`rounded-[6px] border px-3 py-2 ${!categorySlug ? "border-[#1D3B7A] bg-[#EFF3FA] font-bold text-[#0B1E4B]" : "border-[#D1D5DB] text-slate-700 hover:border-[#1D3B7A]"}`}
              >
                Todos los productos
              </Link>
              {safeCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalogo?categoria=${category.slug}`}
                  className={`rounded-[6px] border px-3 py-2 ${category.slug === categorySlug ? "border-[#1D3B7A] bg-[#EFF3FA] font-bold text-[#0B1E4B]" : "border-[#D1D5DB] text-slate-700 hover:border-[#1D3B7A]"}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[6px] bg-[#0B1E4B] p-4 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-100">Atención comercial</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight">Compra por volumen, reposición o proyecto</h2>
            <p className="mt-3 text-[13px] leading-6 text-blue-50">
              Solicita cotización express o contacta a ventas para requerimientos especiales.
            </p>
            <div className="mt-4 grid gap-1 text-[13px] text-blue-100">
              <p>{contact.supportPhone}</p>
              <p>{contact.supportEmail}</p>
            </div>
            <Link href="/cotizacion-rapida" className="public-btn-accent mt-4">
              Solicitar cotización
            </Link>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="public-panel p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="public-kicker">Listado general</p>
                <h2 className="mt-2 text-[28px] font-semibold text-slate-900">Todos los productos</h2>
                <p className="mt-2 text-[13px] text-slate-700">
                  {safeProducts.length} resultado(s)
                  {activeCategory ? ` en ${activeCategory.name}` : ""}
                  {query ? ` para "${query}"` : ""}.
                </p>
              </div>

              <form action="/catalogo" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                {categorySlug ? <input type="hidden" name="categoria" value={categorySlug} /> : null}
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar SKU, producto o categoría"
                  className="public-input"
                />
                <select name="orden" defaultValue={sort} className="public-select">
                  <option value="featured">Destacados</option>
                  <option value="price_asc">Precio menor a mayor</option>
                  <option value="price_desc">Precio mayor a menor</option>
                  <option value="newest">Más recientes</option>
                </select>
                <button className="public-btn" type="submit">
                  Aplicar
                </button>
              </form>
            </div>
          </div>

          {safeProducts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {safeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="public-panel p-8 text-center">
              <h3 className="text-[20px] font-semibold text-slate-900">No encontramos productos</h3>
              <p className="mt-2 text-[13px] text-slate-700">
                Ajusta la búsqueda o elimina filtros para ver más resultados del catálogo.
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
