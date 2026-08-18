import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOperationalOrderStatus } from "@/lib/order-status";
import { getOrderDetails } from "@/lib/site";
import { getTransferReceiptErrorMessage } from "@/lib/transfer-receipts";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ orderNumber: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mi-cuenta");
  }

  const { orderNumber } = await params;
  const order = await getOrderDetails(orderNumber);
  if (!order) {
    notFound();
  }

  if (user.customer?.id !== order.customerId && user.role === "CUSTOMER") {
    notFound();
  }

  const receiptUploaded = getSingleValue((await searchParams).receipt);
  const receiptError = getSingleValue((await searchParams).receiptError);
  const operationalStatus = getOperationalOrderStatus(order.status);

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="surface p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Pedido</p>
              <h1 className="mt-2 text-4xl font-semibold">{order.orderNumber}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pedido</p>
                <StatusBadge kind="order" status={operationalStatus} />
              </div>
              {order.payment ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pago</p>
                  <StatusBadge kind="payment" status={order.payment.status} />
                </div>
              ) : null}
            </div>
          </div>

          {receiptUploaded ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Comprobante subido correctamente.
            </div>
          ) : null}
          {receiptError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {getTransferReceiptErrorMessage(receiptError)}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.sku}</p>
                  </div>
                  <div className="text-right text-sm text-slate-700">
                    <p>{item.quantity} piezas</p>
                    <p className="font-semibold">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {order.payment ? (
            <form action={async (formData) => {
              "use server";
              const { uploadTransferReceiptAction } = await import("@/lib/actions/cart");
              await uploadTransferReceiptAction(formData);
            }} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input type="hidden" name="redirectTo" value={`/mis-pedidos/${order.orderNumber}`} />
              <h2 className="text-xl font-semibold">Subir comprobante de transferencia</h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Referencia</label>
                <input
                  name="reference"
                  defaultValue={order.payment.reference || order.orderNumber}
                  className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Subir comprobante de transferencia</label>
                <input type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png,.webp" className="block w-full text-sm" />
                <p className="mt-2 text-xs text-slate-500">Aceptamos PDF, JPG, PNG o WEBP. Máximo 5 MB.</p>
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                Enviar comprobante
              </button>
            </form>
          ) : null}
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Resumen</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Estado del pedido</span>
                <StatusBadge kind="order" status={operationalStatus} />
              </div>
              {order.payment ? (
                <div className="flex items-center justify-between">
                  <span>Estado del pago</span>
                  <StatusBadge kind="payment" status={order.payment.status} />
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA incluido</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
