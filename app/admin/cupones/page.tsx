import Link from "next/link";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cupones"
        title="Promociones y descuentos"
        description="Administra codigos, vigencias, tipo de descuento y disponibilidad."
        actions={
          <Link href="/admin/cupones/nuevo" className={cn(buttonVariants())}>
            Nuevo cupon
          </Link>
        }
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Codigo</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Monto</TableHeaderCell>
              <TableHeaderCell>Vigencia</TableHeaderCell>
              <TableHeaderCell>Estatus</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">{coupon.description || "Sin descripcion"}</p>
                  </div>
                </TableCell>
                <TableCell>{coupon.type}</TableCell>
                <TableCell>{coupon.amount.toString()}</TableCell>
                <TableCell>
                  {formatDate(coupon.startsAt)} - {formatDate(coupon.endsAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "success" : "danger"}>
                    {coupon.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/cupones/${coupon.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Editar
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
