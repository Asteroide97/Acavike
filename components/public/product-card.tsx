import Image from "next/image";
import Link from "next/link";
import type { Category, PriceTier, Product } from "@prisma/client";
import { addToCartAction } from "@/lib/actions/cart";
import { getPrimaryProductImage, type ProductImageRecord } from "@/lib/product-images";
import { formatCurrency } from "@/lib/utils";

type ProductCardItem = Product & {
  category?: Category | null;
  images?: ProductImageRecord[] | null;
  priceTiers?: PriceTier[] | null;
};

export function ProductCard({ product, catalog = false }: { product: ProductCardItem; catalog?: boolean }) {
  const productHref = product.slug ? `/producto/${product.slug}` : "/catalogo";
  const categoryName = product.category?.name || "Catálogo";
  const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
  const name = product.name || "Producto demo";
  const shortDescription =
    product.shortDescription?.trim() ||
    "Consulta la ficha técnica o solicita información comercial.";
  const primaryImage = getPrimaryProductImage(product.images, name);
  const unit = product.unit?.trim() || "pieza";
  const delivery = product.leadTimeText?.trim() || "Entrega sujeta a disponibilidad";
  const price = Number.isFinite(Number(product.price ?? 0)) ? Number(product.price ?? 0) : 0;
  const productId = product.id || "";

  return (
    <article className="public-panel flex h-full min-w-0 flex-col overflow-hidden">
      <Link href={productHref} className="block border-b border-[#D1D5DB] bg-[#F9FAFB]">
        <div className="relative aspect-[4/3] md:aspect-[6/5]">
          <div className={`absolute inset-3 rounded-[10px] bg-white ${catalog ? "" : "shadow-[0_6px_18px_rgba(11,30,75,0.06)]"}`} />
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-contain p-4"
            unoptimized={primaryImage.unoptimized}
            sizes="(max-width: 379px) 90vw, (max-width: 1023px) 45vw, 24vw"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{categoryName}</p>
          <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Stock {stock}
          </span>
        </div>

        <Link href={productHref} className="line-clamp-3 break-words text-[14px] font-bold leading-[1.3] text-[#1D3B7A] hover:text-[#0B1E4B]">
          {name}
        </Link>

        <p className="min-h-[2.2rem] overflow-hidden text-[13px] leading-[1.45] text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {shortDescription}
        </p>

        <div className="grid gap-1 break-words rounded-[6px] bg-[#F9FAFB] px-2.5 py-2 text-[12px] leading-5 text-slate-700">
          <p>SKU: {product.sku || "Por confirmar"}</p>
          <p>Unidad: {unit}</p>
          <p>Entrega: {delivery}</p>
        </div>

        <div className="mt-auto border-t border-[#D1D5DB] pt-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Precio base</p>
          <p className="mt-1 text-[21px] font-bold leading-none text-slate-900">{formatCurrency(price)}</p>
        </div>

        {catalog && primaryImage.url === "/placeholder-product.svg" ? <p className="text-[10px] text-slate-500">Imagen no disponible</p> : null}
        <div className={`grid gap-1.5 ${catalog ? "min-[500px]:grid-cols-2" : "grid-cols-2"}`}>
          <Link
            href={productHref}
            className="public-btn-outline min-h-[36px] w-full px-2.5 py-2 text-[12px]"
          >
            {catalog ? "Ver ficha" : "Ver detalles"}
          </Link>
          {catalog && stock <= 0 ? <Link href={`/cotizacion-rapida?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(name)}&cantidad=1`} className="public-btn w-full px-2 py-2 text-[12px]">Cotizar</Link> : <form action={addToCartAction} className="w-full">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value="1" />
            <button
              className="public-btn min-h-[36px] w-full px-2.5 py-2 text-[12px]"
              type="submit"
              disabled={!productId}
            >
              Agregar
            </button>
          </form>}
        </div>
      </div>
    </article>
  );
}
