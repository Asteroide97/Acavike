import { notFound } from "next/navigation";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { updateOrderStatusAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ORDER_ROLES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { getAdminOrderByIdRepository } from "@/lib/repositories/orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OrderDetailAdminPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser(ORDER_ROLES);
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const order = await getAdminOrderByIdRepository(id);

  if (!order) {
    notFound();
  }

  const allowedStatuses =
    user.role === "WAREHOUSE"
      ? ["TO_PICK", "WAITING_STOCK", "SHIPPED", "DELIVERED"]
      : Object.keys(ORDER_STATUS_LABELS);
  const reviewedBy =
    order.payment && "reviewedBy" in order.payment
      ? (order.payment.reviewedBy as { name?: string } | null | undefined)
      : null;
  const reviewedByName = reviewedBy?.name || "Admin";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pedido"
        title={order.orderNumber}
        description={`Cliente: ${order.customer.companyName} - Creado ${formatDate(order.createdAt)}`}
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge kind="order" status={order.status} />
              {order.payment ? <StatusBadge kind="payment" status={order.payment.status} /> : null}
            </div>

            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Producto</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Cantidad</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Actualizar estado</h2>
              <form action={updateOrderStatusAction} className="space-y-4">
                <input type="hidden" name="orderId" value={order.id} />
                <Select name="status" defaultValue={order.status}>
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                    </option>
                  ))}
                </Select>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar estado
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="admin-surface">
            <CardContent className="space-y-3 p-6 text-sm">
              <h2 className="text-xl font-semibold">Datos del cliente</h2>
              <p>
                <span className="font-semibold">Contacto:</span> {order.customer.name}
              </p>
              <p>
                <span className="font-semibold">Empresa:</span> {order.customer.companyName}
              </p>
              <p>
                <span className="font-semibold">Correo:</span> {order.customer.email}
              </p>
              <p>
                <span className="font-semibold">Teléfono:</span> {order.customer.phone || "Sin dato"}
              </p>
              <p>
                <span className="font-semibold">Dirección:</span> {order.deliveryAddress}
              </p>
            </CardContent>
          </Card>

          {order.payment ? (
            <Card className="admin-surface">
              <CardContent className="space-y-3 p-6 text-sm">
                <h2 className="text-xl font-semibold">Transferencia</h2>
                <p>
                  <span className="font-semibold">Banco:</span> {order.payment.bankName}
                </p>
                <p>
                  <span className="font-semibold">Beneficiario:</span> {order.payment.beneficiary}
                </p>
                <p>
                  <span className="font-semibold">CLABE:</span> {order.payment.clabe}
                </p>
                <p>
                  <span className="font-semibold">Referencia:</span> {order.payment.reference || "Sin referencia"}
                </p>
                <p>
                  <span className="font-semibold">Comprobante:</span>{" "}
                  {order.payment.receiptUrl ? (
                    <a href={order.payment.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary">
                      Ver archivo
                    </a>
                  ) : (
                    "No cargado"
                  )}
                </p>
                <p>
                  <span className="font-semibold">Revisión:</span>{" "}
                  {order.payment.reviewedAt ? `${reviewedByName} - ${formatDate(order.payment.reviewedAt)}` : "Pendiente"}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
