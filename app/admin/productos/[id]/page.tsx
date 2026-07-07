import { notFound } from "next/navigation";
import { AdminField } from "@/components/admin/admin-field";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isNew = id === "nuevo";

  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    isNew
      ? Promise.resolve(null)
      : prisma.product.findUnique({
          where: { id },
          include: {
            images: {
              orderBy: { sortOrder: "asc" },
            },
            priceTiers: {
              orderBy: { minQuantity: "asc" },
            },
          },
        }),
  ]);

  if (!isNew && !product) {
    notFound();
  }

  const imagesText =
    product?.images.map((image) => `${image.url}|${image.alt || ""}`).join("\n") || "/placeholder-product.svg|Imagen principal";
  const tiersText = product?.priceTiers.map((tier) => `${tier.minQuantity}|${tier.price.toString()}`).join("\n") || "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Producto"
        title={isNew ? "Nuevo producto" : product?.name || "Producto"}
        description="Configura informacion comercial, inventario, galeria y escalas por volumen."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="p-6">
            <form action={saveProductAction} className="grid gap-4 md:grid-cols-2">
              {product ? <input type="hidden" name="productId" value={product.id} /> : null}

              <AdminField label="Nombre">
                <Input name="name" defaultValue={product?.name || ""} />
              </AdminField>
              <AdminField label="SKU">
                <Input name="sku" defaultValue={product?.sku || ""} />
              </AdminField>
              <AdminField label="Slug">
                <Input name="slug" defaultValue={product?.slug || ""} />
              </AdminField>
              <AdminField label="Categoria">
                <Select name="categoryId" defaultValue={product?.categoryId || ""}>
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </AdminField>
              <AdminField label="Marca">
                <Input name="brand" defaultValue={product?.brand || ""} />
              </AdminField>
              <AdminField label="Unidad">
                <Input name="unit" defaultValue={product?.unit || "pieza"} />
              </AdminField>
              <AdminField label="Precio">
                <Input name="price" type="number" step="0.01" defaultValue={product?.price.toString() || ""} />
              </AdminField>
              <AdminField label="Stock">
                <Input name="stock" type="number" defaultValue={product?.stock ?? 0} />
              </AdminField>
              <AdminField label="Stock minimo">
                <Input
                  name="lowStockThreshold"
                  type="number"
                  defaultValue={product?.lowStockThreshold ?? 5}
                />
              </AdminField>
              <AdminField label="Lead time">
                <Input name="leadTimeText" defaultValue={product?.leadTimeText || ""} />
              </AdminField>
              <AdminField label="Descripcion corta" className="md:col-span-2">
                <Textarea name="shortDescription" defaultValue={product?.shortDescription || ""} />
              </AdminField>
              <AdminField label="Descripcion completa" className="md:col-span-2">
                <Textarea name="description" defaultValue={product?.description || ""} className="min-h-[180px]" />
              </AdminField>
              <AdminField
                label="Imagenes"
                hint="Una linea por imagen: URL|Alt"
                className="md:col-span-2"
              >
                <Textarea name="imagesText" defaultValue={imagesText} className="min-h-[140px]" />
              </AdminField>
              <AdminField
                label="Precios por volumen"
                hint="Una linea por escala: Cantidad minima|Precio"
                className="md:col-span-2"
              >
                <Textarea name="tiersText" defaultValue={tiersText} className="min-h-[140px]" />
              </AdminField>

              <div className="flex items-center gap-3">
                <Checkbox id="isActive" name="isActive" defaultChecked={product ? product.isActive : true} />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-800">
                  Producto activo
                </label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="isFeatured" name="isFeatured" defaultChecked={product?.isFeatured || false} />
                <label htmlFor="isFeatured" className="text-sm font-medium text-slate-800">
                  Mostrar como destacado
                </label>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar producto
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-surface">
            <CardContent className="space-y-3 p-6 text-sm">
              <h2 className="text-xl font-semibold">Tips de captura</h2>
              <p>Usa SKU consistentes para facilitar busqueda en catalogo y seguimiento en pedidos.</p>
              <p>Si dejas el slug vacio, la accion lo generara desde el nombre.</p>
              <p>Configura escalas para que el carrito calcule precio por mayoreo automaticamente.</p>
            </CardContent>
          </Card>

          {product ? (
            <Card className="admin-surface">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Zona de riesgo</h2>
                <form action={deleteProductAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white">
                    Eliminar producto
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
