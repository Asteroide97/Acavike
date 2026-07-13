import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@prisma/client";
import { getCategoryMeta, getCategorySubcategories } from "@/lib/public-catalog";

export function CategoryCard({ category }: { category: Category }) {
  const meta = getCategoryMeta(category.slug);
  const subcategories = getCategorySubcategories(category.slug).slice(0, 4);

  return (
    <article className="group relative h-full min-h-[236px] overflow-hidden rounded-[6px] border border-[#D1D5DB]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1E4B] via-[#153166] to-[#1D3B7A]" />
      <div className="absolute right-4 top-4 h-[112px] w-[112px] rounded-[16px] border border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[2px] sm:h-[128px] sm:w-[128px]">
        <div className="absolute inset-3 rounded-[12px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),rgba(255,255,255,0.05))]" />
        <Image
          src={category.imageUrl || "/placeholder-category.svg"}
          alt={category.name}
          fill
          className="object-contain p-4 transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,30,75,0.16),rgba(11,30,75,0.92))]" />

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-50">
          Categoría
        </span>

        <div className="mt-4 max-w-[250px] pr-[92px] sm:pr-[118px]">
          <Link href={`/catalogo/${category.slug}`} className="block text-[24px] font-semibold leading-none text-white sm:text-[28px]">
            {category.name}
          </Link>
          <p className="mt-2 text-[13px] leading-5 text-blue-50/90">{meta.blurb}</p>
        </div>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((item) => (
              <span
                key={item.code}
                className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-50"
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
