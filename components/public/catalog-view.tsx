import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { CatalogFilterPanel } from "@/components/public/catalog-filter-panel";
import { CatalogBreadcrumbs } from "@/components/public/catalog-breadcrumbs";
import { ProductCard } from "@/components/public/product-card";
import { CategoryImage } from "@/components/public/category-image";
import { CategoryTile } from "@/components/public/category-card";
import { CategoryHeader } from "@/components/public/category-header";
import { catalogHref, catalogPage, categoryPath, orderedCategoryTree, type CatalogFilters } from "@/lib/catalog-filters";
import type { getCatalogPageDataRepository } from "@/lib/repositories/catalog";

type CatalogData = Awaited<ReturnType<typeof getCatalogPageDataRepository>>;

export function CatalogView({ data, filters, unavailable = false }: { data: CatalogData; filters: CatalogFilters; unavailable?: boolean }) {
  const categories = orderedCategoryTree(data.categories ?? []);
  const products = data.products ?? [];
  const pagination = catalogPage(products, filters.page);
  const active = categories.find(category => category.slug === filters.categorySlug);
  const ancestors = active ? categoryPath(categories, active.id) : [];
  const children = categories.filter(category => category.parentId === active?.id);
  const path = active ? `/catalogo/${encodeURIComponent(active.slug)}` : "/catalogo";
  return (
    <div className="section-shell min-w-0 py-5 md:py-7">
      <CatalogBreadcrumbs items={[
        { label: "Inicio", href: "/" },
        { label: "Catálogo", href: ancestors.length ? "/catalogo" : undefined },
        ...ancestors.map((category, index) => ({ label: category.name, href: index < ancestors.length - 1 ? `/catalogo/${category.slug}` : undefined })),
      ]} />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <CatalogFilterPanel>
            <div className="space-y-5 p-4">
              <div>
                <h2 className="border-b border-[#D1D5DB] pb-3 text-sm font-bold uppercase tracking-wider text-[#0B1E4B]">Categorías</h2>
                <nav aria-label="Categorías del catálogo" className="mt-2 grid gap-0.5 text-sm">
                  <Link href={catalogHref(filters, "")} aria-current={!active ? "page" : undefined} className={`rounded px-2 py-2 ${!active ? "bg-blue-50 font-bold text-[#1D3B7A]" : "text-slate-700 hover:bg-slate-50"}`}>Todos los productos</Link>
                  {categories.map(category => {
                    const depth = Math.min(categoryPath(categories, category.id).length - 1, 4);
                    return <Link key={category.id} href={catalogHref(filters, category.slug)} aria-current={active?.id === category.id ? "page" : undefined} style={{ paddingLeft: `${8 + depth * 12}px` }} className={`flex items-center gap-2 rounded py-2 pr-2 ${active?.id === category.id ? "bg-blue-50 font-bold text-[#1D3B7A]" : "text-slate-700 hover:bg-slate-50"}`}><CategoryImage imageUrl={category.imageUrl} name={category.name} className="h-8 w-8" sizes="32px" /><span className="min-w-0 break-words">{category.name}</span></Link>;
                  })}
                </nav>
              </div>
              <form action={path} className="grid gap-3 text-sm">
                <h2 className="border-b border-[#D1D5DB] pb-3 font-bold uppercase tracking-wider text-[#0B1E4B]">Filtrar productos</h2>
                {filters.query ? <input type="hidden" name="q" value={filters.query} /> : null}
                <input type="hidden" name="orden" value={filters.sort} />
                <label className="flex items-center gap-2"><input type="checkbox" name="disponibilidad" value="disponible" defaultChecked={filters.inStock} /> Con existencias</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="min-w-0">Desde<input name="min" aria-label="Precio mínimo" type="number" min="0" step="0.01" defaultValue={filters.minPrice} className="public-input mt-1 w-full min-w-0" /></label>
                  <label className="min-w-0">Hasta<input name="max" aria-label="Precio máximo" type="number" min="0" step="0.01" defaultValue={filters.maxPrice} className="public-input mt-1 w-full min-w-0" /></label>
                </div>
                <button type="submit" className="public-btn w-full">Aplicar filtros</button>
                <Link href={path} className="text-center text-xs font-semibold text-[#1D3B7A] underline">Limpiar filtros</Link>
              </form>
              <Link href="/cotizacion-rapida" className="flex items-center justify-between gap-2 border-t border-[#D1D5DB] pt-4 text-sm font-bold text-[#1D3B7A]">¿Buscas algo especial?<ArrowRight className="h-4 w-4 shrink-0" /></Link>
            </div>
          </CatalogFilterPanel>
        </aside>
        <section className="min-w-0 space-y-4">
          <div className="rounded-md border border-[#D1D5DB] bg-white p-4 md:p-5">
            <CategoryHeader name={active?.name || "Catálogo industrial"} description={active?.description} imageUrl={active?.imageUrl} productCount={products.length} query={filters.query} />
            <form action={path} className="grid min-w-0 gap-2 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
              {filters.minPrice !== undefined ? <input type="hidden" name="min" value={filters.minPrice} /> : null}
              {filters.maxPrice !== undefined ? <input type="hidden" name="max" value={filters.maxPrice} /> : null}
              {filters.inStock ? <input type="hidden" name="disponibilidad" value="disponible" /> : null}
              <label className="relative min-w-0"><span className="sr-only">Buscar productos</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" defaultValue={filters.query} placeholder="Nombre, descripción, código o SKU" className="public-input w-full min-w-0 pl-9" /></label>
              <select aria-label="Ordenar productos" name="orden" defaultValue={filters.sort} className="public-select w-full min-w-0"><option value="custom">Orden personalizado</option><option value="featured">Destacados</option><option value="name_asc">Nombre: A a Z</option><option value="name_desc">Nombre: Z a A</option><option value="price_asc">Precio: menor a mayor</option><option value="price_desc">Precio: mayor a menor</option><option value="newest">Más recientes</option></select>
              <button className="public-btn" type="submit">Buscar</button>
            </form>
            {children.length ? <nav aria-label="Subcategorías" className="mt-4 grid grid-cols-2 gap-3 border-t border-[#D1D5DB] pt-4 sm:grid-cols-3 lg:grid-cols-4">{children.map(child => <CategoryTile href={catalogHref(filters, child.slug)} key={child.id} imageUrl={child.imageUrl} name={child.name} sizes="(max-width: 640px) 40vw, 180px" />)}</nav> : null}
          </div>
          {unavailable ? <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">No fue posible consultar el catálogo. Intenta de nuevo o solicita una cotización.</p> : null}
          {products.length ? <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{pagination.products.map(product => <ProductCard key={product.id} product={product} catalog />)}</div> : <div className="rounded-md border border-[#D1D5DB] bg-white px-5 py-14 text-center"><h2 className="text-xl font-bold text-[#0B1E4B]">No hay productos para esta selección</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Prueba otra búsqueda o envíanos tu lista de materiales para cotizar.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link href="/catalogo" className="public-btn-outline">Ver catálogo</Link><Link href="/cotizacion-rapida" className="public-btn">Solicitar cotización</Link></div></div>}
          {pagination.pageCount > 1 ? <nav aria-label="Páginas del catálogo" className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white p-3">
            {pagination.page > 1 ? <Link href={catalogHref(filters, filters.categorySlug, pagination.page - 1)} className="public-btn-outline">Anterior</Link> : <span />}
            <span className="text-sm">Página {pagination.page} de {pagination.pageCount}</span>
            {pagination.page < pagination.pageCount ? <Link href={catalogHref(filters, filters.categorySlug, pagination.page + 1)} className="public-btn-outline">Siguiente</Link> : <span />}
          </nav> : null}
        </section>
      </div>
    </div>
  );
}
