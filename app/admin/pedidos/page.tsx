import Link from "next/link";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ORDER_ROLES);
  const resolvedSearchParams = await searchParams;

  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Seguimiento de pedidos"
        description="Consulta detalle, cliente, monto total, estatus del pedido y revision de pago."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Pedido</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Pago</TableHeaderCell>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="space-y-2">
                    <p className="font-semibold">{order.orderNumber}</p>
                    <StatusBadge kind="order" status={order.status} />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer.companyName}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  {order.payment ? <StatusBadge kind="payment" status={order.payment.status} /> : "Sin registro"}
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Link href={`/admin/pedidos/${order.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Ver detalle
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
