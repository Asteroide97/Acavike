import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  FileCog,
  Files,
  FolderKanban,
  LayoutDashboard,
  Package,
  Shield,
  ShoppingBasket,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const items: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}> = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, roles: ["SUPERADMIN", "ADMIN", "WAREHOUSE", "SALES"] },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBasket, roles: ["SUPERADMIN", "ADMIN", "WAREHOUSE"] },
  { href: "/admin/almacen", label: "Almacén", icon: Truck, roles: ["SUPERADMIN", "ADMIN", "WAREHOUSE"] },
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: ClipboardList, roles: ["SUPERADMIN", "ADMIN", "SALES"] },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: ["SUPERADMIN", "ADMIN", "SALES"] },
  { href: "/admin/productos", label: "Productos", icon: Package, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/categorias", label: "Categorías", icon: FolderKanban, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/cupones", label: "Cupones", icon: BadgePercent, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/email-templates", label: "Email Templates", icon: FileCog, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/contenido", label: "Contenido", icon: Files, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/usuarios", label: "Usuarios", icon: Shield, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/mensajes", label: "Mensajes", icon: Boxes, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/auditoria", label: "Auditoría", icon: Shield, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/settings", label: "Settings", icon: FileCog, roles: ["SUPERADMIN", "ADMIN"] },
] as const;

export function AdminSidebar({ role }: { role: UserRole }) {
  const filteredItems = items.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-full flex-col rounded-[2rem] bg-slate-950 p-6 text-slate-200">
      <Link href="/admin" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <Boxes className="h-6 w-6" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-white">Acavike</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Control Panel</p>
        </div>
      </Link>

      <nav className="mt-8 grid gap-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl bg-white/5 p-4 text-sm text-slate-400">
        Las ediciones de catálogo, precios, contenido y usuarios se limitan a admin y superadmin.
      </div>
    </aside>
  );
}
