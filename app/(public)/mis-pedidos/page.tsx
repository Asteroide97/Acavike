import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/mi-cuenta");
  }

  if (!user.customer) {
    return (
      <div className="section-shell py-10">
        <EmptyState
          title="Tu cuenta no tiene pedidos asociados"
          description="Genera un pedido desde checkout o registra una cuenta cliente para ver historial."
          actionHref="/catalogo"
          actionLabel="Ir al catálogo"
        />
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { customerId: user.customer.id },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="section-shell py-10">
      <div className="surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Mis pedidos</p>
        <h1 className="mt-2 text-4xl font-semibold">Historial de pedidos</h1>
      </div>

      <div className="mt-8">
        {orders.length ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{order.orderNumber}</p>
                    <p className="mt-2 text-xl font-semibold">{formatCurrency(order.total)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)} · {order.deliveryMethod}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="order" status={order.status} />
                    <Link href={`/mis-pedidos/${order.orderNumber}`} className="text-sm font-semibold text-primary">
                      Ver detalle
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aún no tienes pedidos"
            description="Cuando completes un checkout tus pedidos aparecerán aquí."
            actionHref="/catalogo"
            actionLabel="Explorar catálogo"
          />
        )}
      </div>
    </div>
  );
}
