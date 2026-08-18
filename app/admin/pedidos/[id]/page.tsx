import { notFound } from "next/navigation";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { reviewTransferPaymentAction, updateOrderStatusAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ORDER_ROLES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { OPERATIONAL_ORDER_STATUSES, WAREHOUSE_OPERATIONAL_STATUSES, getOperationalOrderStatus } from "@/lib/order-status";
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

  const operationalStatus = getOperationalOrderStatus(order.status);
  const allowedOperationalStatuses =
    user.role === "WAREHOUSE" ? WAREHOUSE_OPERATIONAL_STATUSES : OPERATIONAL_ORDER_STATUSES;
  const canManageOperation =
    user.role !== "WAREHOUSE" || WAREHOUSE_OPERATIONAL_STATUSES.includes(operationalStatus);
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
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operación</p>
                <StatusBadge kind="order" status={operationalStatus} />
              </div>
              {order.payment ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pago</p>
                  <StatusBadge kind="payment" status={order.payment.status} />
                </div>
              ) : null}
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
              <h2 className="text-xl font-semibold">Operación</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Estado operativo actual:</span>{" "}
                  {ORDER_STATUS_LABELS[operationalStatus]}
                </p>
                <p className="text-muted-foreground">
                  Cambia únicamente el avance operativo del pedido. El pago se revisa por separado.
                </p>
              </div>

              {canManageOperation ? (
                <form action={updateOrderStatusAction} className="space-y-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Select name="status" defaultValue={operationalStatus}>
                    {allowedOperationalStatuses.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                    Guardar operación
                  </button>
                </form>
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Este pedido aún no entra a operación de almacén. Un administrador debe confirmar el pago o liberar el pedido.
                </p>
              )}
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
              <CardContent className="space-y-4 p-6 text-sm">
                <h2 className="text-xl font-semibold">Pago</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Estado actual del pago:</span>{" "}
                    <StatusBadge kind="payment" status={order.payment.status} />
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span> {formatCurrency(order.total)}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Banco:</span> {order.payment.bankName}
                  </p>
                  <p>
                    <span className="font-semibold">Beneficiario:</span> {order.payment.beneficiary}
                  </p>
                </div>
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
                <form action={reviewTransferPaymentAction} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <input type="hidden" name="paymentId" value={order.payment.id} />
                  <input type="hidden" name="redirectTo" value={`/admin/pedidos/${order.id}`} />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">Notas internas</label>
                    <Textarea
                      name="adminNotes"
                      defaultValue={order.payment.adminNotes || ""}
                      placeholder="Notas internas de revisión"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      name="status"
                      value="APPROVED"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white"
                    >
                      Aprobar pago
                    </button>
                    <button
                      name="status"
                      value="REJECTED"
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900"
                    >
                      Rechazar pago
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
