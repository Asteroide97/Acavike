import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCartTotals, getOrCreateCart } from "@/lib/cart";
import { getOrderDetails, getBankSettings } from "@/lib/site";
import { CheckoutForm } from "@/components/auth/checkout-form";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const orderNumber = getSingleValue(resolved.orden);
  const receiptUploaded = getSingleValue(resolved.receipt);
  const receiptError = getSingleValue(resolved.receiptError);

  const [user, cart, bankSettings] = await Promise.all([getCurrentUser(), getOrCreateCart(), getBankSettings()]);

  if (orderNumber) {
    const order = await getOrderDetails(orderNumber);
    if (!order) {
      return (
        <div className="section-shell py-10">
          <EmptyState
            title="No encontramos ese pedido"
            description="Verifica el folio generado o intenta nuevamente desde el checkout."
            actionHref="/catalogo"
            actionLabel="Volver al catálogo"
          />
        </div>
      );
    }

    return (
      <div className="section-shell py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="surface p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Pedido generado</p>
            <h1 className="mt-2 text-4xl font-semibold">Tu folio es {order.orderNumber}</h1>
            <p className="mt-4 text-muted-foreground">
              El pedido quedó en estado pendiente de transferencia. Usa estos datos bancarios y comparte tu comprobante para validación.
            </p>

            <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Banco</p>
                <p className="mt-2 font-semibold">{bankSettings.bankName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Beneficiario</p>
                <p className="mt-2 font-semibold">{bankSettings.beneficiary}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CLABE</p>
                <p className="mt-2 font-semibold">{bankSettings.clabe}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {receiptUploaded ? <Alert tone="success">Comprobante cargado correctamente. El equipo revisará el pago.</Alert> : null}
              {receiptError ? <Alert tone="danger">No fue posible cargar el comprobante. Intenta otra vez.</Alert> : null}
            </div>

            <form action={async (formData) => {
              "use server";
              const { uploadTransferReceiptAction } = await import("@/lib/actions/commerce");
              await uploadTransferReceiptAction(formData);
            }} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input type="hidden" name="redirectTo" value={`/checkout?orden=${order.orderNumber}`} />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Referencia</label>
                <input
                  name="reference"
                  defaultValue={order.orderNumber}
                  className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Comprobante</label>
                <input
                  type="file"
                  name="receipt"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="block w-full text-sm text-slate-700"
                />
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                Subir comprobante
              </button>
            </form>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Resumen del pedido</h2>
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
              <Link href="/catalogo" className={cn(buttonVariants({ variant: "outline", fullWidth: true }))}>
                Seguir comprando
              </Link>
              {user?.role === "CUSTOMER" ? (
                <Link href="/mis-pedidos" className={cn(buttonVariants({ fullWidth: true }))}>
                  Ver mis pedidos
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totals = getCartTotals(cart);

  if (!cart.items.length) {
    return (
      <div className="section-shell py-10">
        <EmptyState
          title="No hay productos para checkout"
          description="Agrega productos al carrito antes de generar un pedido por transferencia."
          actionHref="/catalogo"
          actionLabel="Ir al catálogo"
        />
      </div>
    );
  }

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="surface p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Checkout</p>
          <h1 className="mt-2 text-4xl font-semibold">Confirma tu pedido por transferencia</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Al finalizar generaremos el pedido y mostraremos los datos bancarios para realizar la transferencia.
          </p>

          <div className="mt-8">
            <CheckoutForm
              defaultValues={{
                name: user?.customer?.name || user?.name || "",
                companyName: user?.customer?.companyName || "",
                email: user?.email || user?.customer?.email || "",
                phone: user?.customer?.phone || "",
                address: user?.customer?.address || "",
                rfc: user?.customer?.rfc || "",
              }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-xl font-semibold">Totales</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-slate-800">Pago bancario demo</p>
              <p className="mt-3">Banco: {bankSettings.bankName}</p>
              <p>Beneficiario: {bankSettings.beneficiary}</p>
              <p>CLABE: {bankSettings.clabe}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
