import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, Building2, ClipboardCheck, Search } from "lucide-react";
import { CategoryCard } from "@/components/public/category-card";
import { ProductCard } from "@/components/public/product-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getHomepageData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const { sections, categories, featuredProducts } = await getHomepageData();
  const hero = sections.find((section) => section.key === "hero_home");
  const quickQuote = sections.find((section) => section.key === "quick_quote");
  const trustStrip = sections.find((section) => section.key === "trust_strip");

  return (
    <div className="pb-16">
      <section className="section-shell pt-10">
        <div className="surface overflow-hidden p-8 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                {hero?.subtitle || "Acavike Industrial"}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                {hero?.title || "Compra industrial B2B con catálogo claro, cotización rápida y pago por transferencia."}
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
                {hero?.body ||
                  "Centraliza consumibles, abrasivos, empaque, EPP, limpieza y herramientas en una sola operación comercial."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/catalogo" className={cn(buttonVariants({ size: "lg" }))}>
                  Explorar catálogo
                </Link>
                <Link href="/cotizacion-rapida" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Solicitar cotización
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Buscador fuerte",
                    body: "Encuentra productos por SKU, categoría o texto libre.",
                    icon: Search,
                  },
                  {
                    title: "Compra por transferencia",
                    body: "Genera tu pedido y comparte comprobante para validación.",
                    icon: Building2,
                  },
                  {
                    title: "Cotización rápida",
                    body: "Convierte requerimientos técnicos en propuestas comerciales.",
                    icon: ClipboardCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="border-white/90">
              <CardContent className="space-y-5 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Ruta sugerida</p>
                <div className="space-y-4">
                  {[
                    "Busca o filtra productos por categoría.",
                    "Agrega al carrito con precio base o mayoreo.",
                    "Genera el pedido y recibe instrucciones bancarias.",
                    "Sube tu comprobante y da seguimiento al estatus.",
                  ].map((step, index) => (
                    <div key={step} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
                {quickQuote ? (
                  <div className="rounded-3xl bg-slate-950 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {quickQuote.subtitle}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{quickQuote.title}</h3>
                    <p className="mt-3 text-sm text-slate-300">{quickQuote.body}</p>
                    <Link
                      href={quickQuote.buttonHref || "/cotizacion-rapida"}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                    >
                      {quickQuote.buttonText || "Solicitar"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-shell mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Categorías</p>
            <h2 className="mt-2 text-3xl font-semibold">Líneas clave para abastecimiento industrial</h2>
          </div>
          <Link href="/catalogo" className="text-sm font-semibold text-primary">
            Ver catálogo completo
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="section-shell mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Destacados</p>
            <h2 className="mt-2 text-3xl font-semibold">Productos listos para cotizar o pedir</h2>
          </div>
          <Link href="/catalogo" className="text-sm font-semibold text-primary">
            Ver todos
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {trustStrip ? (
        <section className="section-shell mt-16">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{trustStrip.subtitle}</p>
            <h2 className="mt-3 text-3xl font-semibold">{trustStrip.title}</h2>
            <p className="mt-4 max-w-3xl text-slate-300">{trustStrip.body}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
