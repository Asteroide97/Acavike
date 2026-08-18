import Link from "next/link";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { getOperationalOrderStatus } from "@/lib/order-status";
import { listAdminOrdersRepository } from "@/lib/repositories/orders";
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

  const orders = await listAdminOrdersRepository();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Seguimiento de pedidos"
        description="Consulta detalle, cliente, monto total, operación del pedido y revisión de pago."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Pedido</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Operación</TableHeaderCell>
              <TableHeaderCell>Pago</TableHeaderCell>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-semibold">{order.orderNumber}</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer.companyName}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <StatusBadge kind="order" status={getOperationalOrderStatus(order.status)} />
                </TableCell>
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
