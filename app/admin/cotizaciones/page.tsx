import Link from "next/link";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { QUOTE_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function QuotesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(QUOTE_ROLES);
  const resolvedSearchParams = await searchParams;

  const quotes = await prisma.quote.findMany({
    include: {
      customer: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cotizaciones"
        title="Pipeline comercial"
        description="Crea propuestas, ajusta partidas y convierte cotizaciones aceptadas en pedidos."
        actions={
          <Link href="/admin/cotizaciones/nuevo" className={cn(buttonVariants())}>
            Nueva cotizacion
          </Link>
        }
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Folio</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Partidas</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Vigencia</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>
                  <div className="space-y-2">
                    <p className="font-semibold">{quote.quoteNumber}</p>
                    <StatusBadge kind="quote" status={quote.status} />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{quote.customer.companyName}</p>
                    <p className="text-sm text-muted-foreground">{quote.customer.name}</p>
                  </div>
                </TableCell>
                <TableCell>{quote.items.length}</TableCell>
                <TableCell>{formatCurrency(quote.total)}</TableCell>
                <TableCell>{formatDate(quote.validUntil)}</TableCell>
                <TableCell>
                  <Link href={`/admin/cotizaciones/${quote.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Abrir
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
