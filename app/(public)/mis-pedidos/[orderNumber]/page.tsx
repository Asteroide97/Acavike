import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrderDetails } from "@/lib/site";
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
            <StatusBadge kind="order" status={order.status} />
          </div>

          {receiptUploaded ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Comprobante subido correctamente.
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
              const { uploadTransferReceiptAction } = await import("@/lib/actions/commerce");
              await uploadTransferReceiptAction(formData);
            }} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input type="hidden" name="redirectTo" value={`/mis-pedidos/${order.orderNumber}`} />
              <h2 className="text-xl font-semibold">Subir comprobante</h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Referencia</label>
                <input
                  name="reference"
                  defaultValue={order.payment.reference || order.orderNumber}
                  className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Archivo</label>
                <input type="file" name="receipt" accept=".jpg,.jpeg,.png,.pdf" className="block w-full text-sm" />
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                Cargar comprobante
              </button>
            </form>
          ) : null}
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Resumen</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            {order.payment ? <StatusBadge kind="payment" status={order.payment.status} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
