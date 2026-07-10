import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function CatalogBreadcrumbs({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="font-medium text-[#1D3B7A] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-slate-800" : ""}>{item.label}</span>
            )}
            {!isLast ? <span className="text-slate-400">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
