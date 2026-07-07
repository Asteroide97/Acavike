import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { QUOTE_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { listCustomersRepository } from "@/lib/repositories/customers";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireUser(QUOTE_ROLES);

  const customers = await listCustomersRepository();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Clientes"
        title="Base de clientes"
        description="Consulta contactos, cuentas vinculadas, volumen de pedidos y actividad comercial."
      />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Empresa</TableHeaderCell>
              <TableHeaderCell>Contacto</TableHeaderCell>
              <TableHeaderCell>Cuenta</TableHeaderCell>
              <TableHeaderCell>Pedidos</TableHeaderCell>
              <TableHeaderCell>Cotizaciones</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold">{customer.companyName}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(customer.createdAt)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p>{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </TableCell>
                <TableCell>{customer.user ? customer.user.email : "Sin usuario"}</TableCell>
                <TableCell>{customer._count.orders}</TableCell>
                <TableCell>{customer._count.quotes}</TableCell>
                <TableCell>
                  <Link href={`/admin/clientes/${customer.id}`} className="text-sm font-semibold text-primary">
                    Ver detalle
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
