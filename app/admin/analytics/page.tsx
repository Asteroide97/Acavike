import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_LABELS, QUOTE_STATUS_LABELS } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { getAdminAnalyticsRepository } from "@/lib/repositories/admin-dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireUser(["SUPERADMIN", "ADMIN"]);

  const { ordersByStatus, quotesByStatus, orderItems, categories, auditLogs } =
    await getAdminAnalyticsRepository();

  const sortedCategories = [...categories].sort((a, b) => b._count.products - a._count.products).slice(0, 8);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Indicadores de operacion"
        description="Corte rapido por estado de pedido, cotizacion, ventas por producto y trazabilidad de auditoria."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Pedidos por estado</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Cantidad</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {ordersByStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>{ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS]}</TableCell>
                    <TableCell>{row._count._all}</TableCell>
                    <TableCell>{formatCurrency(row._sum.total ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Cotizaciones por estado</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Cantidad</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {quotesByStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>{QUOTE_STATUS_LABELS[row.status as keyof typeof QUOTE_STATUS_LABELS]}</TableCell>
                    <TableCell>{row._count._all}</TableCell>
                    <TableCell>{formatCurrency(row._sum.total ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Productos con mas facturacion</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Producto</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Unidades</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={`${item.productId}-${item.sku}`}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item._sum.quantity ?? 0}</TableCell>
                    <TableCell>{formatCurrency(item._sum.total ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Categorias con mas productos</h2>
              <div className="space-y-3">
                {sortedCategories.map((category) => (
                  <div key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                      </div>
                      <p className="text-lg font-semibold">{category._count.products}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Auditoria reciente</h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold">
                      {log.action} · {log.entity}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.user?.name ?? "Sistema"} · {formatDate(log.createdAt)}
                    </p>
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
