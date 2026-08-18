import { notFound } from "next/navigation";
import { AdminField } from "@/components/admin/admin-field";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { QuoteItemsBuilder } from "@/components/admin/quote-items-builder";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { convertQuoteToOrderAction, saveQuoteAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { QUOTE_ROLES, QUOTE_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function QuoteEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireUser(QUOTE_ROLES);
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isNew = id === "nuevo";

  const [customers, products, quote] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { companyName: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 150,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        unit: true,
      },
    }),
    isNew
      ? Promise.resolve(null)
      : prisma.quote.findUnique({
          where: { id },
          include: {
            customer: true,
            items: true,
          },
        }),
  ]);

  if (!isNew && !quote) {
    notFound();
  }

  const serializedItems =
    quote?.items
      .map((item) => [item.sku || "", item.name, item.quantity, item.unitPrice.toString(), item.productId || ""].join("|"))
      .join("\n") || "";
  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price),
    unit: product.unit,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cotización"
        title={isNew ? "Nueva cotización" : quote?.quoteNumber || "Cotización"}
        description="Agrega partidas con el selector asistido o conserva el formato manual en modo avanzado. Los precios capturados ya incluyen IVA."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="p-6">
            <form action={saveQuoteAction} className="grid gap-4 md:grid-cols-2">
              {quote ? <input type="hidden" name="quoteId" value={quote.id} /> : null}

              <AdminField label="Cliente" className="md:col-span-2">
                <Select name="customerId" defaultValue={quote?.customerId || ""}>
                  <option value="">Selecciona un cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName} - {customer.name}
                    </option>
                  ))}
                </Select>
              </AdminField>

              <AdminField label="Estado">
                <Select name="status" defaultValue={quote?.status || "DRAFT"}>
                  {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </AdminField>

              <AdminField label="Vigencia">
                <input
                  type="date"
                  name="validUntil"
                  defaultValue={formatDateInput(quote?.validUntil)}
                  className="flex h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </AdminField>

              <AdminField label="Notas" className="md:col-span-2">
                <Textarea name="notes" defaultValue={quote?.notes || ""} />
              </AdminField>

              <AdminField
                label="Partidas"
                hint="Agrega productos con cantidad y precio editable. Si lo necesitas, abajo puedes seguir capturando líneas manuales."
                className="md:col-span-2"
              >
                <QuoteItemsBuilder products={productOptions} defaultValue={serializedItems} />
              </AdminField>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar cotización
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-surface">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-xl font-semibold">Guía rápida</h2>
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>1. Selecciona un cliente y agrega las partidas desde el buscador.</p>
                <p>2. Ajusta cantidad y precio si la cotización requiere un valor especial.</p>
                <p>3. El total se calcula con IVA incluido, sin recargos adicionales.</p>
                <p>4. Si necesitas una captura técnica, usa el modo avanzado con el formato manual existente.</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Productos disponibles para el selector: {products.length}
              </p>
            </CardContent>
          </Card>

          {quote ? (
            <Card className="admin-surface">
              <CardContent className="space-y-3 p-6 text-sm">
                <h2 className="text-xl font-semibold">Resumen</h2>
                <p>
                  <span className="font-semibold">Cliente:</span> {quote.customer.companyName}
                </p>
                <p>
                  <span className="font-semibold">Subtotal:</span> {formatCurrency(quote.subtotal)}
                </p>
                <p>
                  <span className="font-semibold">IVA incluido:</span> {formatCurrency(quote.tax)}
                </p>
                <p>
                  <span className="font-semibold">Total:</span> {formatCurrency(quote.total)}
                </p>
                <p>
                  <span className="font-semibold">Vigencia:</span> {formatDate(quote.validUntil)}
                </p>
                {quote.status !== "CONVERTED" ? (
                  <form action={convertQuoteToOrderAction} className="pt-2">
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800">
                      Convertir a pedido
                    </button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
