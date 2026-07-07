import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_ROLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireUser(ADMIN_ROLES);

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Categorias"
        title="Estructura del catalogo"
        description="Define jerarquia, orden visual, visibilidad publica y contexto de navegacion."
        actions={
          <Link href="/admin/categorias/nuevo" className={cn(buttonVariants())}>
            Nueva categoria
          </Link>
        }
      />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell>Padre</TableHeaderCell>
              <TableHeaderCell>Productos</TableHeaderCell>
              <TableHeaderCell>Subcategorias</TableHeaderCell>
              <TableHeaderCell>Estatus</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.slug}</p>
                  </div>
                </TableCell>
                <TableCell>{category.parent?.name || "Raiz"}</TableCell>
                <TableCell>{category._count.products}</TableCell>
                <TableCell>{category._count.children}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "success" : "danger"}>
                    {category.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/categorias/${category.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
