import Link from "next/link";
import { Boxes, ShoppingCart } from "lucide-react";
import type { Category, User } from "@prisma/client";
import { PUBLIC_NAV_TABS } from "@/lib/public-catalog";
import { formatCurrency } from "@/lib/utils";

type Viewer = (User & { customer?: { id: string } | null }) | null;

export function SiteHeader({
  cartCount,
  cartTotal,
  user,
  supportPhone,
}: {
  categories: Category[];
  cartCount: number;
  cartTotal: number;
  user: Viewer;
  supportPhone?: string;
}) {
  const authHref = user ? (user.role !== "CUSTOMER" ? "/admin" : "/mi-cuenta") : "/mi-cuenta";
  const authLabel = user ? (user.role !== "CUSTOMER" ? "Panel admin" : "Sesion activa") : "Iniciar Sesion";
  const phoneLabel = supportPhone || "81 0000 0000";

  return (
    <header className="border-b-2 border-[#002B52] bg-[#003A70] text-white">
      <div className="section-shell py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-white/30 bg-white/10">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[28px] font-bold uppercase leading-none tracking-[0.03em]">Acavike</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-blue-100">
                  Industrial Supply
                </div>
              </div>
            </Link>

            <div className="text-[13px] leading-tight text-blue-50">
              <div className="font-semibold">Suministros Industriales</div>
              <div>{phoneLabel}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] font-medium lg:flex lg:flex-wrap lg:items-center lg:justify-end">
            <Link href="/mi-cuenta" className="hover:text-blue-100">
              Mi Cuenta
            </Link>
            <Link href="/contacto" className="hover:text-blue-100">
              Contacto
            </Link>
            <Link href={authHref} className="hover:text-blue-100">
              {authLabel}
            </Link>
            <Link href="/carrito" className="flex items-center gap-2 text-[12px] hover:text-blue-100">
              <ShoppingCart className="h-4 w-4" />
              <span>
                Carrito MXN {formatCurrency(cartTotal)}{cartCount ? ` (${cartCount})` : ""}
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <form action="/catalogo" className="flex flex-1 items-center gap-2 border border-[#002B52] bg-white p-2">
            <input
              name="q"
              placeholder="Buscar SKU, producto o categoria"
              className="h-10 flex-1 border border-slate-300 px-3 text-[13px] text-slate-900 outline-none"
            />
            <button className="public-btn min-w-[88px]" type="submit">
              Buscar
            </button>
          </form>

          <div className="border border-white/20 bg-[#002B52] px-3 py-2 text-[12px] text-blue-50">
            Compra por transferencia bancaria y cotizacion para volumen.
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 bg-[#002B52]">
        <div className="section-shell">
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:flex" aria-label="Navegacion principal">
            {PUBLIC_NAV_TABS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="border-b border-r border-white/10 px-3 py-3 text-[13px] font-semibold text-white hover:bg-white/10 lg:border-b-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
