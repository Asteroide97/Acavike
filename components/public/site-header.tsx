import Link from "next/link";
import { Boxes, ClipboardList, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import type { Category, User } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Viewer = (User & { customer?: { id: string } | null }) | null;

export function SiteHeader({
  categories,
  cartCount,
  user,
}: {
  categories: Category[];
  cartCount: number;
  user: Viewer;
}) {
  return (
    <header className="border-b border-white/70 bg-white/90 backdrop-blur-md">
      <div className="section-shell py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="font-heading text-xl font-semibold">Acavike</div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Industrial Supply
                </div>
              </div>
            </Link>
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 md:block">
              Compra B2B por transferencia
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <form action="/catalogo" className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <input
                name="q"
                placeholder="Buscar SKU, producto o categoría"
                className="h-10 flex-1 rounded-xl bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button className={cn(buttonVariants({ size: "sm" }))} type="submit">
                Buscar
              </button>
            </form>
            <nav className="hidden items-center gap-2 lg:flex">
              <Link href="/mi-cuenta" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <UserRound className="mr-2 h-4 w-4" />
                {user ? "Mi cuenta" : "Ingresar"}
              </Link>
              <Link href="/carrito" className={cn(buttonVariants({ size: "sm" }))}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carrito ({cartCount})
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/catalogo" className="rounded-full bg-slate-900 px-4 py-2 text-white">
              Ver todo
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalogo/${category.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-sm">
            <Link href="/cotizacion-rapida" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 hover:bg-slate-100">
              <ClipboardList className="h-4 w-4" />
              Cotización rápida
            </Link>
            {user && user.role !== "CUSTOMER" ? (
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 hover:bg-slate-100">
                <LayoutGrid className="h-4 w-4" />
                Panel admin
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
