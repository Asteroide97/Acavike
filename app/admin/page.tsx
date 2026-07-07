import Link from "next/link";
import { AlertCircle, Boxes, CreditCard, DollarSign, FileText, PackageSearch, ShoppingCart, Users } from "lucide-react";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { BACKOFFICE_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(BACKOFFICE_ROLES);
  const resolvedSearchParams = await searchParams;

  const [orderMetrics, customersCount, openQuotesCount, pendingOrdersCount, pendingTransfersCount, products, recentOrders, recentQuotes] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        _avg: { total: true },
      }),
      prisma.customer.count(),
      prisma.quote.count({
        where: { status: { in: ["DRAFT", "SENT"] } },
      }),
      prisma.order.count({
        where: { status: { in: ["PENDING_TRANSFER", "RECEIPT_UPLOADED", "PAYMENT_APPROVED", "TO_PICK", "WAITING_STOCK"] } },
      }),
      prisma.transferPayment.count({
        where: { status: { in: ["PENDING", "IN_REVIEW"] } },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { stock: "asc" },
      }),
      prisma.order.findMany({
        include: { customer: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.quote.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Resumen"
        title="Tablero operativo"
        description="Vision general del estado comercial, pedidos, stock y cobranza por transferencia."
        actions={
          <>
            <Link href="/admin/pedidos" className={cn(buttonVariants({ variant: "outline" }))}>
              Ver pedidos
            </Link>
            <Link href="/admin/cotizaciones" className={cn(buttonVariants())}>
              Gestionar cotizaciones
            </Link>
          </>
        }
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <DashboardStatCard
          title="Ventas totales"
          value={formatCurrency(orderMetrics._sum.total ?? 0)}
          caption="Acumulado de pedidos registrados"
          icon={DollarSign}
        />
        <DashboardStatCard
          title="Pedidos"
          value={String(orderMetrics._count._all ?? 0)}
          caption="Ordenes creadas en la plataforma"
          icon={ShoppingCart}
        />
        <DashboardStatCard
          title="Ticket promedio"
          value={formatCurrency(orderMetrics._avg.total ?? 0)}
          caption="Promedio por pedido"
          icon={Boxes}
        />
        <DashboardStatCard
          title="Clientes"
          value={String(customersCount)}
          caption="Cuentas clientes registradas"
          icon={Users}
        />
        <DashboardStatCard
          title="Cotizaciones abiertas"
          value={String(openQuotesCount)}
          caption="DRAFT y SENT"
          icon={FileText}
        />
        <DashboardStatCard
          title="Pedidos pendientes"
          value={String(pendingOrdersCount)}
          caption="Requieren seguimiento operativo"
          icon={AlertCircle}
        />
        <DashboardStatCard
          title="Bajo stock"
          value={String(lowStockProducts.length)}
          caption="Productos por debajo del minimo"
          icon={PackageSearch}
        />
        <DashboardStatCard
          title="Transferencias pendientes"
          value={String(pendingTransfersCount)}
          caption="Pagos por revisar o confirmar"
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Pedidos recientes</p>
                <h2 className="mt-2 text-xl font-semibold">Actividad comercial</h2>
              </div>
              <Link href="/admin/pedidos" className="text-sm font-semibold text-primary">
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customer.companyName} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold">{formatCurrency(order.total)}</span>
                      <StatusBadge kind="order" status={order.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Bajo stock</p>
                  <h2 className="mt-2 text-xl font-semibold">Alertas de inventario</h2>
                </div>
                <Link href="/admin/almacen" className="text-sm font-semibold text-primary">
                  Ir a almacen
                </Link>
              </div>

              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category.name} · SKU {product.sku}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{product.stock} disponibles</p>
                        <p className="text-muted-foreground">Minimo {product.lowStockThreshold}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Cotizaciones</p>
                  <h2 className="mt-2 text-xl font-semibold">Seguimiento reciente</h2>
                </div>
                <Link href="/admin/cotizaciones" className="text-sm font-semibold text-primary">
                  Ver modulo
                </Link>
              </div>

              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{quote.quoteNumber}</p>
                        <p className="text-sm text-muted-foreground">{quote.customer.companyName}</p>
                      </div>
                      <StatusBadge kind="quote" status={quote.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
