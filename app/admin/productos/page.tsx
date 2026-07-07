import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage() {
  await requireUser(ADMIN_ROLES);

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Productos"
        title="Catalogo de productos"
        description="Administra nombres, SKU, categoria, stock, precios y escalas por mayoreo."
        actions={
          <Link href="/admin/productos/nuevo" className={cn(buttonVariants())}>
            Nuevo producto
          </Link>
        }
      />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Producto</TableHeaderCell>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell>Precio</TableHeaderCell>
              <TableHeaderCell>Stock</TableHeaderCell>
              <TableHeaderCell>Estatus</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="space-y-2">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </TableCell>
                <TableCell>{product.category.name}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={product.isActive ? "success" : "danger"}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {product.isFeatured ? <Badge variant="info">Destacado</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/productos/${product.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
