import Image from "next/image";
import Link from "next/link";
import type { Category, PriceTier, Product, ProductImage } from "@prisma/client";
import { addToCartAction } from "@/lib/actions/cart";
import { formatCurrency } from "@/lib/utils";

type ProductCardItem = Product & {
  category: Category;
  images: ProductImage[];
  priceTiers: PriceTier[];
};

export function ProductCard({ product }: { product: ProductCardItem }) {
  return (
    <article className="public-panel overflow-hidden">
      <Link href={`/producto/${product.slug}`} className="block border-b border-[#D1D5DB] bg-[#F9FAFB]">
        <div className="relative aspect-square">
          <Image
            src={product.images[0]?.url || "/placeholder-product.svg"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-contain p-5"
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.category.name}</p>
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Stock {product.stock}
          </span>
        </div>

        <Link href={`/producto/${product.slug}`} className="block text-[15px] font-bold leading-5 text-[#1D3B7A] hover:text-[#0B1E4B]">
          {product.name}
        </Link>

        <div className="grid gap-1 text-[12px] text-slate-700">
          <p>SKU: {product.sku}</p>
          <p>Unidad: {product.unit}</p>
          <p>Entrega: {product.leadTimeText || "Sujeta a disponibilidad"}</p>
        </div>

        <div className="border-t border-[#D1D5DB] pt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Precio</p>
          <p className="mt-1 text-[24px] font-bold leading-none text-slate-900">{formatCurrency(product.price)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/producto/${product.slug}`} className="public-btn-outline w-full">
            Ver detalles
          </Link>
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button className="public-btn w-full" type="submit">
              Agregar
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
