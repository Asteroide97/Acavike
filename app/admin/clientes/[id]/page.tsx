import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { QUOTE_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { getCustomerByIdRepository } from "@/lib/repositories/customers";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireUser(QUOTE_ROLES);
  const { id } = await params;

  const customer = await getCustomerByIdRepository(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cliente"
        title={customer.companyName}
        description={`${customer.name} · ${customer.email}`}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="admin-surface">
          <CardContent className="space-y-3 p-6 text-sm">
            <h2 className="text-xl font-semibold">Ficha</h2>
            <p>
              <span className="font-semibold">Contacto:</span> {customer.name}
            </p>
            <p>
              <span className="font-semibold">Correo:</span> {customer.email}
            </p>
            <p>
              <span className="font-semibold">Telefono:</span> {customer.phone || "Sin dato"}
            </p>
            <p>
              <span className="font-semibold">Direccion:</span> {customer.address || "Sin dato"}
            </p>
            <p>
              <span className="font-semibold">RFC:</span> {customer.rfc || "Sin dato"}
            </p>
            <p>
              <span className="font-semibold">Nivel:</span> {customer.level}
            </p>
            <p>
              <span className="font-semibold">Usuario:</span> {customer.user?.email || "No vinculado"}
            </p>
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Pedidos</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <StatusBadge kind="order" status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <h2 className="pt-4 text-xl font-semibold">Cotizaciones</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Folio</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {customer.quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{quote.quoteNumber}</TableCell>
                    <TableCell>{formatCurrency(quote.total)}</TableCell>
                    <TableCell>
                      <StatusBadge kind="quote" status={quote.status} />
                    </TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
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
