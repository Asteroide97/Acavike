"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

export function CatalogFilterPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="rounded-md border border-[#D1D5DB] bg-white">
    <button type="button" aria-expanded={open} aria-controls="catalog-filters" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-[#0B1E4B] lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Categorías y filtros</button>
    <div id="catalog-filters" className={`${open ? "block" : "hidden"} lg:block`}>{children}</div>
  </div>;
}
