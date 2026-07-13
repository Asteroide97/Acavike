import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, Boxes, ClipboardList, Clock3, Headset, RefreshCcw, ShoppingCart } from "lucide-react";
import { CategoryCard } from "@/components/public/category-card";
import { ProductCard } from "@/components/public/product-card";
import { getHomeCategories } from "@/lib/public-catalog";
import { getHomepageData, getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const [{ sections, categories, featuredProducts }, settings] = await Promise.all([
    getHomepageData(),
    getSiteSettingsMap(),
  ]);
  const hero = sections.find((section) => section.key === "hero_home");
  const quickQuote = sections.find((section) => section.key === "quick_quote");
  const trustStrip = sections.find((section) => section.key === "trust_strip");
  const homeCategories = getHomeCategories(categories);
  const contact = getPublicContactDetails(settings);
  const benefits = [
    {
      title: "Stock visible",
      body: "Inventario en tiempo real",
      icon: Boxes,
    },
    {
      title: "Compra en minutos",
      body: "Proceso de compra ágil y directo",
      icon: ShoppingCart,
    },
    {
      title: "Cotización express",
      body: "Respuesta en menos de 24 hrs",
      icon: ClipboardList,
    },
    {
      title: "Precios actualizados",
      body: "Sincronización automática de catálogo",
      icon: RefreshCcw,
    },
    {
      title: "Asesoría B2B",
      body: "Atención especializada para empresas",
      icon: Headset,
    },
  ];

  return (
    <div className="section-shell py-4 md:py-6">
      <div className="space-y-4 md:space-y-5">
        <section className="public-panel overflow-hidden">
          <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="public-kicker">{hero?.subtitle || "Catálogo industrial B2B"}</p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-slate-900 sm:text-[30px] md:text-[36px]">
                Suministros industriales, empaque y herramientas para empresas
              </h1>
              <p className="mt-3 max-w-3xl text-[14px] leading-6 text-slate-700">
                {hero?.body ||
                  "Acavike concentra compra operativa, cotización comercial y pago por transferencia en una sola experiencia."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/catalogo" className="public-btn">
                  Ver productos
                </Link>
                <Link href="/cotizacion-rapida" className="public-btn-accent">
                  Cotización express
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Catálogo comercial",
                  body: "Categorías listas para compra directa o cotización por proyecto.",
                },
                {
                  title: "Compra por transferencia",
                  body: "Checkout visual y seguimiento comercial sin pasarelas externas.",
                },
                {
                  title: "Atención directa",
                  body: `${contact.supportPhone} | ${contact.supportHours}`,
                },
                {
                  title: "Cobertura industrial",
                  body: "Empaque, fabricación, limpieza, oficina y abasto recurrente.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-4">
                  <h2 className="text-[15px] font-bold text-[#0B1E4B]">{item.title}</h2>
                  <p className="mt-2 text-[13px] leading-6 text-slate-700">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="public-panel px-4 py-4 md:px-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-start gap-3 rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#0B1E4B] text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="public-kicker">Categorías principales</p>
              <h2 className="mt-2 text-[28px] font-semibold text-slate-900">Compra por familia de producto</h2>
            </div>
            <Link href="/catalogo" className="public-link text-[13px]">
              Ver catálogo completo
            </Link>
          </div>

          {homeCategories.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {homeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="public-panel p-8 text-center">
              <h3 className="text-[20px] font-semibold text-slate-900">No hay categorías disponibles</h3>
              <p className="mt-2 text-[13px] text-slate-700">Activa datos demo o configura categorías en la base real.</p>
            </div>
          )}
        </section>

        <section className="public-panel p-4 md:p-5">
          <div className="flex flex-col gap-3 border-b border-[#D1D5DB] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="public-kicker">Productos populares</p>
              <h2 className="mt-2 text-[28px] font-semibold text-slate-900">Listos para pedido o cotización</h2>
            </div>
            <Link href="/catalogo" className="public-link text-[13px]">
              Ver todos
            </Link>
          </div>

          {featuredProducts.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[6px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-8 text-center">
              <p className="text-[14px] font-semibold text-slate-900">No hay productos destacados disponibles.</p>
            </div>
          )}
        </section>

        <section className="public-panel p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="public-kicker">{quickQuote?.subtitle || "Cotización express"}</p>
              <h2 className="mt-2 text-[24px] font-semibold text-slate-900">
                {quickQuote?.title || "Carga SKU o modelo y prepara tu solicitud"}
              </h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-700">
                {quickQuote?.body || "Respondemos en menos de 24 horas y mantenemos compra por transferencia bancaria."}
              </p>
            </div>

            <div className="public-chip w-fit border-[#D1D5DB] bg-[#F9FAFB] text-slate-700">
              <Clock3 className="h-4 w-4 text-[#1D3B7A]" />
              {contact.supportHours}
            </div>
          </div>

          <form action="/cotizacion-rapida" className="mt-5 grid gap-2 md:grid-cols-[minmax(0,1.2fr)_140px_auto]">
            <input name="sku" placeholder="SKU o modelo" className="public-input" />
            <input name="cantidad" placeholder="Cantidad" defaultValue="1" className="public-input" />
            <button className="public-btn" type="submit">
              <ClipboardList className="h-4 w-4" />
              Agregar a cotización
            </button>
          </form>
        </section>

        <section className="rounded-[6px] bg-[#F4B000] p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0B1E4B]">Compra comercial</p>
              <h2 className="mt-2 text-[24px] font-semibold leading-tight text-[#0B1E4B] md:text-[28px]">
                ¿Compra por volumen o proyecto?
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#243042]">
                Cotiza sin compromiso. Respondemos en menos de 24 horas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/cotizacion-rapida" className="public-btn">
                Solicitar cotización
              </Link>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[40px] items-center justify-center rounded-[6px] bg-[#16A34A] px-4 text-[13px] font-semibold text-white hover:bg-[#15803D]"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {trustStrip ? (
          <section className="rounded-[6px] bg-[#0B1E4B] px-5 py-4 text-[13px] leading-6 text-blue-50">
            <span className="font-semibold text-white">{trustStrip.title}:</span> {trustStrip.body}
            <Link href="/contacto" className="ml-2 inline-flex items-center gap-1 font-semibold text-[#F4B000]">
              Conocer más
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
