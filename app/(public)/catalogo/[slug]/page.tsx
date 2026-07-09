import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { CatalogBreadcrumbs } from "@/components/public/catalog-breadcrumbs";
import { ProductCard } from "@/components/public/product-card";
import { getCategoryMeta, getCategorySubcategories } from "@/lib/public-catalog";
import { getCategoryCatalogDataRepository } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function CategoryCatalogPage({
  params,
}: {
  params: Params;
}) {
  noStore();
  const { slug } = await params;
  const { category, products } = await getCategoryCatalogDataRepository(slug);

  if (!category) {
    notFound();
  }

  const meta = getCategoryMeta(category.slug);
  const subcategories = getCategorySubcategories(category.slug);

  return (
    <div className="section-shell py-4 md:py-6">
      <CatalogBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Todos los productos", href: "/catalogo" },
          { label: category.name },
        ]}
      />

      <div className="space-y-4">
        <section className="public-panel p-4 md:p-5">
          <p className="public-kicker">Familia de catalogo</p>
          <h1 className="mt-2 text-[30px] font-bold uppercase tracking-[0.04em] text-slate-900">
            {category.name}
          </h1>
          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-slate-700">
            {meta.blurb}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-slate-600">
            <span className="border border-slate-200 bg-slate-50 px-3 py-1">{products.length} SKU activos</span>
            <span className="border border-slate-200 bg-slate-50 px-3 py-1">{meta.callout}</span>
          </div>
        </section>

        {subcategories.length ? (
          <section className="public-panel p-4 md:p-5">
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="public-kicker">Subcategorias demo</p>
                <h2 className="mt-2 text-[24px] font-bold text-slate-900">Lineas relacionadas</h2>
              </div>
              <Link href="#productos" className="public-link text-[13px]">
                Ir a productos
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {subcategories.map((item) => (
                <Link key={item.code} href={item.href} className="border border-slate-200 bg-white p-3 hover:border-[#003A70]">
                  <div className="relative aspect-[4/3] border border-slate-200 bg-white">
                    <Image
                      src={category.imageUrl || "/placeholder-category.svg"}
                      alt={category.name}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.code}</p>
                    <p className="mt-1 text-[13px] font-bold text-[#004B8D]">{item.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section id="productos" className="public-panel p-4 md:p-5">
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="public-kicker">Productos de la familia</p>
              <h2 className="mt-2 text-[24px] font-bold text-slate-900">Disponibles en {category.name}</h2>
            </div>
            <Link href="/catalogo" className="public-link text-[13px]">
              Ver todo el catalogo
            </Link>
          </div>

          {products.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-[14px] font-bold text-slate-900">No hay productos activos en esta familia</p>
              <p className="mt-2 text-[13px] text-slate-700">
                Revisa otra categoria o solicita una cotizacion express para requerimientos especiales.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
