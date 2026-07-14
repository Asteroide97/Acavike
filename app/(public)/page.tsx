import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import type { Category, PriceTier, Product, ProductImage } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { getHomepageData } from "@/lib/site";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HERO_BANNER_SLUGS = ["empaque", "equipo-de-seguridad", "herramienta", "limpieza"] as const;

const HERO_BANNER_TITLES: Record<(typeof HERO_BANNER_SLUGS)[number], string> = {
  empaque: "Empaque y cajas",
  "equipo-de-seguridad": "Seguridad industrial",
  herramienta: "Herramientas y construcción",
  limpieza: "Limpieza y mantenimiento",
};

const COMMERCIAL_STRENGTHS = [
  {
    label: "01",
    title: "Catálogo industrial",
    body: "Surtido claro para compras operativas y reposición.",
  },
  {
    label: "02",
    title: "Cotización rápida",
    body: "Respuesta comercial simple para SKU, volumen o proyecto.",
  },
  {
    label: "03",
    title: "Compra por volumen",
    body: "Apoyo para pedidos recurrentes, resurtido y mayoreo.",
  },
  {
    label: "04",
    title: "Atención comercial directa",
    body: "Seguimiento por WhatsApp, correo y contacto humano.",
  },
] as const;

type HomeCategory = Category;
type HomeProduct = Product & {
  category?: Category | null;
  images?: ProductImage[] | null;
  priceTiers?: PriceTier[] | null;
};

function HomeHeroVisual() {
  const items = [
    {
      label: "Empaque",
      imageUrl: "/demo-products/product-box.svg",
      imageAlt: "Caja corrugada industrial",
      className: "sm:row-span-2",
    },
    {
      label: "Herramienta",
      imageUrl: "/demo-products/product-drill.svg",
      imageAlt: "Taladro industrial demo",
      className: "",
    },
    {
      label: "Seguridad",
      imageUrl: "/demo-products/product-glove.svg",
      imageAlt: "Guante de seguridad demo",
      className: "",
    },
  ];

  return (
    <div className="grid min-h-[240px] gap-3 bg-[#EEF2F7] p-4 sm:grid-cols-[1.18fr_0.82fr] sm:p-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`relative overflow-hidden rounded-[6px] border border-[#D1D5DB] bg-white ${item.className}`}
        >
          <div className="absolute left-3 top-3 z-10 rounded-[4px] bg-[#0B1E4B] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            {item.label}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#F8FAFC_100%)]" />
          <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-contain p-5 sm:p-6" />
        </div>
      ))}
    </div>
  );
}

function HomeBannerCard({ category }: { category: HomeCategory }) {
  const title =
    HERO_BANNER_TITLES[category.slug as keyof typeof HERO_BANNER_TITLES] || category.name;

  return (
    <article className="public-panel group overflow-hidden">
      <Link href={`/catalogo/${category.slug}`} className="block">
        <div className="relative aspect-[16/10] border-b border-[#D1D5DB] bg-[#F3F4F6]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#F3F4F6_100%)]" />
          <Image
            src={category.imageUrl || "/demo-products/category-empaque.svg"}
            alt={category.name}
            fill
            className="object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <h2 className="text-[18px] font-semibold text-[#0B1E4B]">{title}</h2>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D3B7A]">
            Ver
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}

function HomeProductTile({ product }: { product: HomeProduct }) {
  const productHref = product.slug ? `/producto/${product.slug}` : "/catalogo";
  const imageUrl = product.images?.[0]?.url || "/demo-products/product-box.svg";
  const imageAlt = product.images?.[0]?.alt || product.name || "Producto demo";
  const price = Number.isFinite(Number(product.price ?? 0)) ? Number(product.price ?? 0) : 0;
  const productName = product.name?.trim() || "Producto demo";

  return (
    <article className="public-panel overflow-hidden">
      <Link href={productHref} className="block">
        <div className="relative aspect-[4/3] border-b border-[#D1D5DB] bg-[#F8FAFC]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#F8FAFC_100%)]" />
          <Image src={imageUrl} alt={imageAlt} fill className="object-contain p-4" />
        </div>
        <div className="space-y-3 p-3">
          <h3 className="min-h-[2.3rem] overflow-hidden text-[13px] font-semibold leading-[1.35] text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {productName}
          </h3>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[18px] font-bold leading-none text-[#0B1E4B]">{formatCurrency(price)}</p>
            <span className="inline-flex min-h-[34px] items-center justify-center rounded-[6px] border border-[#D1D5DB] px-3 text-[12px] font-semibold text-[#0B1E4B]">
              Ver
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function HomePage() {
  noStore();

  const homepageDataResult = await getHomepageData().catch(() => null);
  const homepageData =
    homepageDataResult && typeof homepageDataResult === "object"
      ? homepageDataResult
      : { sections: [], categories: [], featuredProducts: [] };

  const categories = Array.isArray(homepageData.categories) ? homepageData.categories : [];
  const featuredProducts = Array.isArray(homepageData.featuredProducts)
    ? homepageData.featuredProducts
    : [];

  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const bannerCategories = HERO_BANNER_SLUGS.map((slug) => categoryMap.get(slug)).filter(
    (category): category is HomeCategory => Boolean(category),
  );
  const popularProducts = featuredProducts.slice(0, 4);

  return (
    <div className="section-shell py-4 md:py-6">
      <div className="space-y-4 md:space-y-5">
        <section className="public-panel overflow-hidden">
          <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
            <div className="space-y-4 p-5 md:p-6 lg:p-7">
              <p className="public-kicker">Catálogo industrial B2B</p>
              <h1 className="max-w-[560px] text-[28px] font-semibold leading-tight text-slate-900 md:text-[34px]">
                Suministros industriales para empresas
              </h1>
              <p className="max-w-[520px] text-[14px] leading-6 text-slate-700">
                Empaque, limpieza, seguridad, herramientas y abastecimiento B2B.
              </p>

              <div className="flex flex-wrap gap-2">
                <Link href="/catalogo" className="public-btn">
                  Ver catálogo
                </Link>
                <Link href="/cotizacion-rapida" className="public-btn-outline">
                  Cotización express
                </Link>
              </div>
            </div>

            <HomeHeroVisual />
          </div>
        </section>

        {bannerCategories.length ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bannerCategories.map((category) => (
              <HomeBannerCard key={category.id} category={category} />
            ))}
          </section>
        ) : null}

        <section className="public-panel p-4 md:p-5">
          <div className="flex items-end justify-between gap-3 border-b border-[#D1D5DB] pb-3">
            <div>
              <p className="public-kicker">Productos populares</p>
              <h2 className="mt-2 text-[24px] font-semibold text-slate-900">Productos populares</h2>
            </div>
            <Link href="/catalogo" className="public-link hidden text-[13px] md:inline-flex">
              Ver todos
            </Link>
          </div>

          {popularProducts.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {popularProducts.map((product) => (
                <HomeProductTile key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[6px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-8 text-center">
              <p className="text-[14px] font-semibold text-slate-900">No hay productos destacados disponibles.</p>
            </div>
          )}
        </section>

        <section className="public-panel overflow-hidden">
          <div className="border-b border-[#D1D5DB] px-4 py-3 md:px-5">
            <p className="public-kicker">Fortalezas comerciales</p>
            <h2 className="mt-2 text-[24px] font-semibold text-slate-900">Operación B2B clara y directa</h2>
          </div>

          <div className="grid gap-px bg-[#D1D5DB] sm:grid-cols-2 xl:grid-cols-4">
            {COMMERCIAL_STRENGTHS.map((item) => (
              <div key={item.label} className="bg-white px-4 py-4 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <h3 className="mt-2 text-[18px] font-semibold leading-tight text-[#0B1E4B]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
