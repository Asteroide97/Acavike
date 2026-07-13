import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { reviewTransferPaymentAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES, TRANSFER_STATUS_LABELS } from "@/lib/constants";
import { listAdminPaymentsRepository } from "@/lib/repositories/orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const payments = await listAdminPaymentsRepository();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pagos"
        title="Revisión de transferencias"
        description="Valida comprobantes, agrega notas internas y sincroniza el estado financiero del pedido."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-2">
        {payments.map((payment) => (
          <Card key={payment.id} className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{payment.order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.order.customer.companyName} · {formatCurrency(payment.order.total)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge kind="payment" status={payment.status} />
                  <StatusBadge kind="order" status={payment.order.status} />
                </div>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p>
                  <span className="font-semibold">Banco:</span> {payment.bankName}
                </p>
                <p>
                  <span className="font-semibold">Beneficiario:</span> {payment.beneficiary}
                </p>
                <p>
                  <span className="font-semibold">CLABE:</span> {payment.clabe}
                </p>
                <p>
                  <span className="font-semibold">Referencia:</span> {payment.reference || "Sin referencia"}
                </p>
                <p>
                  <span className="font-semibold">Comprobante:</span>{" "}
                  {payment.receiptUrl ? (
                    <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary">
                      Ver archivo
                    </a>
                  ) : (
                    "No cargado"
                  )}
                </p>
                <p>
                  <span className="font-semibold">Ultima revision:</span>{" "}
                  {payment.reviewedAt ? `${payment.reviewedBy?.name || "Admin"} · ${formatDate(payment.reviewedAt)}` : "Pendiente"}
                </p>
              </div>

              <form action={reviewTransferPaymentAction} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <input type="hidden" name="paymentId" value={payment.id} />
                <Select name="status" defaultValue={payment.status}>
                  {Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Textarea name="adminNotes" defaultValue={payment.adminNotes || ""} placeholder="Notas internas de revision" />
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar revision
                </button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
