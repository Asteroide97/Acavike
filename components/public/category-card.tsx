import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@prisma/client";
import { getCategoryMeta, getCategorySubcategories } from "@/lib/public-catalog";

export function CategoryCard({ category }: { category: Category }) {
  const meta = getCategoryMeta(category.slug);
  const subcategories = getCategorySubcategories(category.slug).slice(0, 4);

  return (
    <article className="group relative min-h-[280px] overflow-hidden rounded-[6px] border border-[#D1D5DB]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1E4B] via-[#153166] to-[#1D3B7A]" />
      <div className="absolute inset-0 opacity-20">
        <Image
          src={category.imageUrl || "/placeholder-category.svg"}
          alt={category.name}
          fill
          className="object-cover object-center transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,30,75,0.18),rgba(11,30,75,0.92))]" />

      <div className="relative flex h-full flex-col p-5">
        <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-50">
          Categoria
        </span>

        <div className="mt-5 max-w-[260px]">
          <Link href={`/catalogo/${category.slug}`} className="block text-[28px] font-semibold leading-none text-white">
            {category.name}
          </Link>
          <p className="mt-3 text-[13px] leading-6 text-blue-50/90">{meta.blurb}</p>
        </div>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-2">
            {subcategories.map((item) => (
              <span
                key={item.code}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-blue-50"
              >
                {item.name}
              </span>
            ))}
          </div>

          <Link
            href={`/catalogo/${category.slug}`}
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#F4B000]"
          >
            Ver
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
