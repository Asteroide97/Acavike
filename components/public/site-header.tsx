import Link from "next/link";
import { Clock3, Mail, Search, ShoppingCart, UserRound, Boxes, Phone } from "lucide-react";
import type { User } from "@prisma/client";
import { PUBLIC_NAV_TABS } from "@/lib/public-catalog";
import { formatCurrency } from "@/lib/utils";

type Viewer = (User & { customer?: { id: string } | null }) | null;

export function SiteHeader({
  cartCount,
  cartTotal,
  user,
  supportPhone,
  supportHours,
  supportEmail,
}: {
  cartCount: number;
  cartTotal: number;
  user: Viewer;
  supportPhone: string;
  supportHours: string;
  supportEmail: string;
}) {
  const authHref = user ? (user.role !== "CUSTOMER" ? "/admin" : "/mi-cuenta") : "/mi-cuenta";
  const authLabel = user
    ? user.role !== "CUSTOMER"
      ? "Admin"
      : user.name?.split(" ")[0] || "Usuario"
    : "Ingresar";

  return (
    <header className="border-b border-[#D1D5DB] bg-white">
      <div className="bg-[#0B1E4B] text-white">
        <div className="section-shell flex flex-col gap-2 py-2 text-[12px] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              {supportPhone}
            </span>
            <span className="inline-flex items-center gap-2 text-blue-100">
              <Clock3 className="h-3.5 w-3.5" />
              {supportHours}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-blue-100">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              {supportEmail}
            </span>
            <span className="hidden lg:inline text-blue-200">
              Catalogo B2B con compra por transferencia y atencion comercial directa.
            </span>
          </div>
        </div>
      </div>

      <div className="section-shell py-4">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#0B1E4B] text-white">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[27px] font-bold leading-none tracking-[-0.05em] text-[#0B1E4B]">Acavike</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Suministros industriales
              </div>
            </div>
          </Link>

          <form
            action="/catalogo"
            className="grid gap-2 rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-2 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder="Buscar SKU, producto o categoria"
                className="h-10 w-full rounded-[6px] border border-white bg-white pl-9 pr-3 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1D3B7A]"
              />
            </div>
            <button className="public-btn min-w-[108px]" type="submit">
              Buscar
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/mi-cuenta"
              className="inline-flex h-10 items-center rounded-[6px] border border-[#D1D5DB] px-3 text-[13px] font-semibold text-[#0B1E4B] hover:bg-[#F3F4F6]"
            >
              Mi Cuenta
            </Link>
            <Link
              href="/contacto"
              className="inline-flex h-10 items-center rounded-[6px] border border-[#D1D5DB] px-3 text-[13px] font-semibold text-[#0B1E4B] hover:bg-[#F3F4F6]"
            >
              Contacto
            </Link>
            <Link
              href="/carrito"
              className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#D1D5DB] px-3 text-[13px] font-semibold text-[#0B1E4B] hover:bg-[#F3F4F6]"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>
                Carrito {formatCurrency(cartTotal)}
                {cartCount ? ` (${cartCount})` : ""}
              </span>
            </Link>
            <Link
              href={authHref}
              className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#0B1E4B] px-3 text-[13px] font-semibold text-white hover:bg-[#081632]"
            >
              <UserRound className="h-4 w-4" />
              {authLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D1D5DB] bg-white">
        <div className="section-shell">
          <nav className="grid grid-cols-2 gap-px bg-[#D1D5DB] sm:grid-cols-3 lg:flex lg:bg-transparent" aria-label="Navegacion principal">
            {PUBLIC_NAV_TABS.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`bg-white px-3 py-3 text-[13px] font-semibold text-[#0B1E4B] hover:bg-[#F3F4F6] lg:border-r lg:border-[#D1D5DB] ${index === PUBLIC_NAV_TABS.length - 1 ? "lg:border-r-0" : ""}`}
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
