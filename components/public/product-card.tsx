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
        <div className="relative aspect-[4/3] sm:aspect-square">
          <div className="absolute inset-4 rounded-[12px] bg-white shadow-[0_8px_24px_rgba(11,30,75,0.06)]" />
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain p-6"
          />
        </div>
      </Link>

      <div className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{categoryName}</p>
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Stock {stock}
          </span>
        </div>

        <Link href={productHref} className="mt-3 block text-[15px] font-bold leading-5 text-[#1D3B7A] hover:text-[#0B1E4B]">
          {name}
        </Link>

        <p className="mt-2 text-[12px] leading-5 text-slate-600">{shortDescription}</p>

        <div className="mt-3 grid gap-1 rounded-[6px] bg-[#F9FAFB] p-3 text-[12px] text-slate-700">
          <p>SKU: {product.sku || "DEMO-SKU"}</p>
          <p>Unidad: {unit}</p>
          <p>Entrega: {delivery}</p>
        </div>

        <div className="mt-auto border-t border-[#D1D5DB] pt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Precio base</p>
          <p className="mt-1 text-[24px] font-bold leading-none text-slate-900">{formatCurrency(price)}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={productHref} className="public-btn-outline w-full">
            Ver detalles
          </Link>
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value="1" />
            <button className="public-btn w-full" type="submit" disabled={!productId}>
              Agregar
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
