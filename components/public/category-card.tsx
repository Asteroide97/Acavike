import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/catalogo/${category.slug}`}
      className="group surface overflow-hidden border-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={category.imageUrl || "/placeholder-category.svg"}
          alt={category.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Categoría</p>
        <h3 className="mt-2 text-xl font-semibold">{category.name}</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          {category.description || "Catálogo industrial con enfoque operativo y compra recurrente."}
        </p>
      </div>
    </Link>
  );
}
