import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";
import { getCategoryMeta, getCategorySubcategories } from "@/lib/public-catalog";

export function CategoryCard({ category }: { category: Category }) {
  const meta = getCategoryMeta(category.slug);
  const subcategories = getCategorySubcategories(category.slug).slice(0, 4);

  return (
    <article className="public-panel p-4">
      <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
        <Link href={`/catalogo/${category.slug}`} className="relative block h-24 overflow-hidden border border-slate-200 bg-white">
          <Image
            src={category.imageUrl || "/placeholder-category.svg"}
            alt={category.name}
            fill
            className="object-contain p-2"
          />
        </Link>

        <div>
          <Link href={`/catalogo/${category.slug}`} className="text-[18px] font-bold text-[#004B8D] hover:underline">
            {category.name}
          </Link>
          <p className="mt-2 text-[13px] leading-5 text-slate-700">{meta.blurb}</p>
          <ul className="mt-3 grid gap-1 text-[13px]">
            {subcategories.map((item) => (
              <li key={item.code}>
                <Link href={item.href} className="public-link">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{meta.callout}</span>
            <Link href={`/catalogo/${category.slug}`} className="public-link text-[13px]">
              Ver mas
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
