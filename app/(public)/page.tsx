import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, ClipboardList, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { CategoryCard } from "@/components/public/category-card";
import { ProductCard } from "@/components/public/product-card";
import { getHomeCategories } from "@/lib/public-catalog";
import { getHomepageData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const { sections, categories, featuredProducts } = await getHomepageData();
  const hero = sections.find((section) => section.key === "hero_home");
  const quickQuote = sections.find((section) => section.key === "quick_quote");
  const trustStrip = sections.find((section) => section.key === "trust_strip");
  const homeCategories = getHomeCategories(categories);

  return (
    <div className="section-shell py-4 md:py-6">
      <section className="public-panel p-4 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="public-kicker">{hero?.subtitle || "Suministro industrial para operacion diaria"}</p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight text-slate-900 md:text-[34px]">
              Suministros industriales, empaque y herramientas para empresas
            </h1>
            <p className="mt-3 max-w-3xl text-[14px] leading-6 text-slate-700">
              {hero?.body ||
                "Compra B2B con catalogo visual, reposicion frecuente, cotizacion rapida y pago por transferencia bancaria."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/catalogo" className="public-btn">
                Ver productos
              </Link>
              <Link href="/cotizacion-rapida" className="public-btn-outline">
                Cotizacion express
              </Link>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:w-[390px]">
            {[
              {
                title: "Compra directa",
                body: "Catalogo compacto para surtido operativo.",
                icon: PackageCheck,
              },
              {
                title: "Pago bancario",
                body: "Pedido y comprobante sin pasarela.",
                icon: ShieldCheck,
              },
              {
                title: "Cobertura",
                body: "Atencion a entregas y reabasto.",
                icon: Truck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-[#003A70]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="mt-3 text-[14px] font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-panel mt-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="public-kicker">Categorias principales</p>
            <h2 className="mt-2 text-[26px] font-bold text-slate-900">Catalogo industrial por familia</h2>
          </div>
          <Link href="/catalogo" className="public-link text-[13px]">
            Ver catalogo completo
          </Link>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          {homeCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="public-panel mt-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="public-kicker">Productos populares</p>
            <h2 className="mt-2 text-[26px] font-bold text-slate-900">Listos para pedido o cotizacion</h2>
          </div>
          <Link href="/catalogo" className="public-link text-[13px]">
            Ver todos
          </Link>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="public-panel mt-4 p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="public-kicker">{quickQuote?.subtitle || "Cotizacion rapida"}</p>
            <h2 className="mt-2 text-[24px] font-bold text-slate-900">
              {quickQuote?.title || "Carga SKU o modelo y prepara tu solicitud"}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-700">
              {quickQuote?.body || "Compra por transferencia bancaria y seguimiento comercial desde el panel de ventas."}
            </p>
          </div>

          <form action="/cotizacion-rapida" className="grid gap-2 md:grid-cols-[1.25fr_120px_auto]">
            <input
              name="sku"
              placeholder="SKU o modelo"
              className="public-input"
            />
            <input
              name="cantidad"
              placeholder="Cantidad"
              defaultValue="1"
              className="public-input"
            />
            <button className="public-btn" type="submit">
              <ClipboardList className="h-4 w-4" />
              Agregar a cotizacion
            </button>
          </form>
        </div>
      </section>

      {trustStrip ? (
        <section className="mt-4 border border-[#C9D3DE] bg-[#DDE7F0] px-4 py-3 text-[13px] leading-6 text-slate-800">
          <span className="font-bold text-[#002B52]">{trustStrip.title}:</span> {trustStrip.body}
          <Link href="/contacto" className="ml-2 inline-flex items-center gap-1 font-bold text-[#004B8D] hover:underline">
            Conocer mas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
