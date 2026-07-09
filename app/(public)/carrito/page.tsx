import Link from "next/link";
import { clearCartAction, removeCartItemAction, updateCartItemAction } from "@/lib/actions/cart";
import { getCartTotals, getOrCreateCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getOrCreateCart();
  const totals = getCartTotals(cart);

  return (
    <div className="section-shell py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Carrito</p>
          <h1 className="mt-2 text-4xl font-semibold">Revisa tu pedido antes del checkout</h1>
        </div>
        {cart.items.length ? (
          <form action={clearCartAction}>
            <button className={cn(buttonVariants({ variant: "outline" }))}>Vaciar carrito</button>
          </form>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          {cart.items.length ? (
            <div className="surface overflow-hidden">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Producto</TableHeaderCell>
                    <TableHeaderCell>Cantidad</TableHeaderCell>
                    <TableHeaderCell>Precio</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell></TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{item.product.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <form action={updateCartItemAction} className="flex items-center gap-2">
                          <input type="hidden" name="itemId" value={item.id} />
                          <input
                            type="number"
                            name="quantity"
                            min={0}
                            defaultValue={item.quantity}
                            className="h-10 w-20 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                          />
                          <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                            Actualizar
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(Number(item.unitPrice) * item.quantity)}</TableCell>
                      <TableCell>
                        <form action={removeCartItemAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button className="text-xs font-semibold text-red-600">Eliminar</button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Tu carrito está vacío"
              description="Agrega productos desde el catálogo para generar tu pedido o tu cotización."
              actionHref="/catalogo"
              actionLabel="Ir al catálogo"
            />
          )}
        </section>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Resumen</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA estimado</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {cart.items.length ? (
              <Link href="/checkout" className={cn(buttonVariants({ fullWidth: true }))}>
                Continuar al checkout
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
