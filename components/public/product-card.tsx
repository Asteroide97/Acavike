import Image from "next/image";
import Link from "next/link";
import type { Product, ProductImage, PriceTier, Category } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCardItem = Product & {
  category: Category;
  images: ProductImage[];
  priceTiers: PriceTier[];
};

export function ProductCard({ product }: { product: ProductCardItem }) {
  return (
    <article className="surface overflow-hidden border-white/90">
      <Link href={`/producto/${product.slug}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={product.images[0]?.url || "/placeholder-product.svg"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {product.category.name}
            </p>
            <Link href={`/producto/${product.slug}`} className="mt-2 block text-lg font-semibold hover:text-primary">
              {product.name}
            </Link>
          </div>
          {product.isFeatured ? <Badge variant="info">Destacado</Badge> : null}
        </div>

        <p className="text-sm text-muted-foreground">{product.shortDescription || product.description}</p>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Desde</p>
            <p className="text-2xl font-semibold">{formatCurrency(product.price)}</p>
            <p className="text-xs text-slate-500">por {product.unit}</p>
          </div>
          <Link href={`/producto/${product.slug}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
