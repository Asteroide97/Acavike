import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ORDER_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { listAdminProductsRepository } from "@/lib/repositories/catalog";
import { listAdminOrdersRepository } from "@/lib/repositories/orders";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WarehousePage() {
  await requireUser(ORDER_ROLES);

  const [products, orders] = await Promise.all([
    listAdminProductsRepository(),
    listAdminOrdersRepository(),
  ]);

  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);
  const queueOrders = orders.filter((order) =>
    ["PAYMENT_APPROVED", "TO_PICK", "WAITING_STOCK", "SHIPPED"].includes(order.status),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Almacen"
        title="Operacion de surtido"
        description="Prioriza pedidos operativos y detecta productos por debajo del umbral minimo."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Bajo stock</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Producto</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Stock</TableHeaderCell>
                  <TableHeaderCell>Minimo</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link href={`/admin/productos/${product.id}`} className="font-semibold text-primary">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.lowStockThreshold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Cola operativa</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {queueOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-primary">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customer.companyName}</TableCell>
                    <TableCell>
                      <StatusBadge kind="order" status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
