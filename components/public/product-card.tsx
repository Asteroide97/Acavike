import Image from "next/image";
import Link from "next/link";
import type { Category, PriceTier, Product, ProductImage } from "@prisma/client";
import { addToCartAction } from "@/lib/actions/cart";
import { formatCurrency } from "@/lib/utils";

type ProductCardItem = Product & {
  category?: Category | null;
  images?: ProductImage[] | null;
  priceTiers?: PriceTier[] | null;
};

export function ProductCard({ product }: { product: ProductCardItem }) {
  const productHref = product.slug ? `/producto/${product.slug}` : "/catalogo";
  const categoryName = product.category?.name || "Catálogo";
  const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
  const name = product.name || "Producto demo";
  const shortDescription =
    product.shortDescription?.trim() ||
    "Suministro demo disponible para operación, reposición o compra por volumen.";
  const imageUrl = product.images?.[0]?.url || "/demo-products/product-box.svg";
  const imageAlt = product.images?.[0]?.alt || name;
  const unit = product.unit?.trim() || "pieza";
  const delivery = product.leadTimeText?.trim() || "Entrega sujeta a disponibilidad";
  const price = Number.isFinite(Number(product.price ?? 0)) ? Number(product.price ?? 0) : 0;
  const productId = product.id || "";

  return (
    <article className="public-panel h-full overflow-hidden">
      <Link href={productHref} className="block border-b border-[#D1D5DB] bg-[#F9FAFB]">
        <div className="relative aspect-[4/3] md:aspect-[6/5]">
          <div className="absolute inset-3 rounded-[10px] bg-white shadow-[0_6px_18px_rgba(11,30,75,0.06)]" />
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain p-4"
          />
        </div>
      </Link>

      <div className="flex h-full flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{categoryName}</p>
          <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Stock {stock}
          </span>
        </div>

        <Link href={productHref} className="block text-[14px] font-bold leading-[1.3] text-[#1D3B7A] hover:text-[#0B1E4B]">
          {name}
        </Link>

        <p className="min-h-[2.2rem] overflow-hidden text-[11px] leading-[1.45] text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {shortDescription}
        </p>

        <div className="grid gap-1 rounded-[6px] bg-[#F9FAFB] px-2.5 py-2 text-[11px] leading-4 text-slate-700">
          <p>SKU: {product.sku || "DEMO-SKU"}</p>
          <p>Unidad: {unit}</p>
          <p>Entrega: {delivery}</p>
        </div>

        <div className="mt-auto border-t border-[#D1D5DB] pt-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Precio base</p>
          <p className="mt-1 text-[21px] font-bold leading-none text-slate-900">{formatCurrency(price)}</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href={productHref}
            className="public-btn-outline min-h-[36px] w-full px-2.5 py-2 text-[12px]"
          >
            Ver detalles
          </Link>
          <form action={addToCartAction} className="w-full">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value="1" />
            <button
              className="public-btn min-h-[36px] w-full px-2.5 py-2 text-[12px]"
              type="submit"
              disabled={!productId}
            >
              Agregar
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
