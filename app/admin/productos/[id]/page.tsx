import { notFound } from "next/navigation";
import { AdminField } from "@/components/admin/admin-field";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductImageUpload } from "@/components/admin/product-image-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { DATABASE_ENABLED } from "@/lib/config";
import { ADMIN_ROLES } from "@/lib/constants";
import { categoryPath } from "@/lib/catalog-filters";
import { productImageSelect } from "@/lib/product-images";
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
              select: productImageSelect,
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

  const tiersText = product?.priceTiers.map((tier) => `${tier.minQuantity}|${tier.price.toString()}`).join("\n") || "";
  const reference = product?.importReference && typeof product.importReference === "object" && !Array.isArray(product.importReference) ? product.importReference : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Producto"
        title={isNew ? "Nuevo producto" : product?.name || "Producto"}
        description="Configura información comercial, inventario, galería y escalas por volumen."
      />

      <AdminFlash searchParams={resolvedSearchParams} />
      {reference ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Referencia de importación Alegra {product?.alegraId}</p>
        <p>Precio público sin IVA. Precio con descuento de origen: {String(reference.referenceDiscountPrice ?? "No informado")} MXN (solo referencia; no aplicado).</p>
        {reference.inventoryVerified === false ? <p>Existencias de origen no verificadas. El cero inicial es un valor técnico, no un conteo real. Verifica el inventario antes de activar el producto.</p> : null}
      </div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="p-6">
            <form action={saveProductAction} className="grid gap-4 md:grid-cols-2">
              {product ? <input type="hidden" name="productId" value={product.id} /> : null}

              <AdminField label="Nombre">
                <Input name="name" defaultValue={product?.name || ""} />
              </AdminField>
              <AdminField label="SKU" hint={isNew ? "Si lo dejas vacío, se genera un SKU ACV único al guardar." : undefined}>
                <Input name="sku" defaultValue={product?.sku || ""} />
              </AdminField>
              <AdminField label="Identificador Alegra" hint="Referencia externa de importación; no sustituye al SKU.">
                <Input value={product?.alegraId || "Sin referencia externa"} readOnly />
              </AdminField>
              <AdminField label="Slug">
                <Input name="slug" defaultValue={product?.slug || ""} />
              </AdminField>
              <AdminField label="Categoría">
                <Select name="categoryId" defaultValue={product?.categoryId || ""}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryPath(categories, category.id).map(part => part.name).join(" / ")}
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
              <AdminField label="Stock mínimo">
                <Input
                  name="lowStockThreshold"
                  type="number"
                  defaultValue={product?.lowStockThreshold ?? 5}
                />
              </AdminField>
              <AdminField label="Lead time">
                <Input name="leadTimeText" defaultValue={product?.leadTimeText || ""} />
              </AdminField>
              <AdminField label="Descripción corta" className="md:col-span-2">
                <Textarea name="shortDescription" defaultValue={product?.shortDescription || ""} />
              </AdminField>
              <AdminField label="Descripción completa" className="md:col-span-2">
                <Textarea name="description" defaultValue={product?.description || ""} className="min-h-[180px]" />
              </AdminField>
              <AdminField
                label="Imágenes"
                hint="Sube, reordena y elimina imágenes. La primera se usa como principal."
                className="md:col-span-2"
              >
                {DATABASE_ENABLED ? (
                  <ProductImageUpload initialImages={product?.images || []} productId={product?.id || null} />
                ) : null}
              </AdminField>
              <AdminField
                label="Precios por volumen"
                hint="Una línea por escala: Cantidad mínima|Precio"
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
              {reference ? <div className="flex items-start gap-3 md:col-span-2">
                <Checkbox id="importInventoryVerified" name="importInventoryVerified" defaultChecked={reference.inventoryVerified === true} />
                <label htmlFor="importInventoryVerified" className="text-sm">Confirmo que las existencias capturadas son reales y están verificadas. Obligatorio para activar un producto importado.</label>
              </div> : null}
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
              <p>Usa SKU consistentes para facilitar búsqueda en catálogo y seguimiento en pedidos.</p>
              <p>Si dejas el slug vacío, la acción lo generará desde el nombre.</p>
              <p>Configura escalas para que el carrito calcule precio por mayoreo automáticamente.</p>
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
