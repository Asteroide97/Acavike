import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/config";
import { ADMIN_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { listAdminProductsRepository } from "@/lib/repositories/catalog";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage() {
  await requireUser(ADMIN_ROLES);

  const products = await listAdminProductsRepository();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Productos"
        title="Catálogo de productos"
        description="Administra nombres, SKU, categoría, stock, precios y escalas por mayoreo."
        actions={
          DEMO_MODE ? (
            <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-60")}>
              Nuevo producto
            </span>
          ) : (
            <Link href="/admin/productos/nuevo" className={cn(buttonVariants())}>
              Nuevo producto
            </Link>
          )
        }
      />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Producto</TableHeaderCell>
              <TableHeaderCell>Categoría</TableHeaderCell>
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
                  {DEMO_MODE ? (
                    <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-60")}>
                      Solo vista
                    </span>
                  ) : (
                    <Link href={`/admin/productos/${product.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Editar
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
