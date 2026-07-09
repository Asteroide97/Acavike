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
      <Link href={`/producto/${product.slug}`} className="block border-b border-slate-200 bg-white">
        <div className="relative aspect-square">
          <Image
            src={product.images[0]?.url || "/placeholder-product.svg"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-contain p-4"
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.category.name}</p>
          <Link href={`/producto/${product.slug}`} className="block text-[13px] font-bold leading-5 text-[#004B8D] hover:underline">
            {product.name}
          </Link>
        </div>

        <div className="space-y-1 text-[12px] text-slate-700">
          <p>SKU: {product.sku}</p>
          <p>Unidad: {product.unit}</p>
          <p>Existencia: {product.stock}</p>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Precio</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-slate-900">{formatCurrency(product.price)}</p>
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
