import { notFound } from "next/navigation";
import { AdminField } from "@/components/admin/admin-field";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CategoryEditorPage({
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

  const [categories, category] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    isNew ? Promise.resolve(null) : prisma.category.findUnique({ where: { id } }),
  ]);

  if (!isNew && !category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Categoría"
        title={isNew ? "Nueva categoría" : category?.name || "Categoría"}
        description="Usa categorías activas para navegar el catálogo público y agrupar productos."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="p-6">
            <form action={saveCategoryAction} className="grid gap-4 md:grid-cols-2">
              {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}

              <AdminField label="Nombre">
                <Input name="name" defaultValue={category?.name || ""} />
              </AdminField>
              <AdminField label="Slug">
                <Input name="slug" defaultValue={category?.slug || ""} />
              </AdminField>
              <AdminField label="Categoría padre">
                <Select name="parentId" defaultValue={category?.parentId || ""}>
                  <option value="">Sin padre</option>
                  {categories
                    .filter((item) => item.id !== category?.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </Select>
              </AdminField>
              <AdminField label="Orden">
                <Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
              </AdminField>
              <AdminField label="Imagen" className="md:col-span-2">
                <Input name="imageUrl" defaultValue={category?.imageUrl || ""} />
              </AdminField>
              <AdminField label="Descripción" className="md:col-span-2">
                <Textarea name="description" defaultValue={category?.description || ""} />
              </AdminField>
              <div className="flex items-center gap-3 md:col-span-2">
                <Checkbox id="isActive" name="isActive" defaultChecked={category ? category.isActive : true} />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-800">
                  Categoría activa
                </label>
              </div>

              <div className="md:col-span-2">
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar categoría
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {category ? (
          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Zona de riesgo</h2>
              <p className="text-sm text-muted-foreground">
                Solo puedes eliminar categorías sin productos ni subcategorías asociadas.
              </p>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.id} />
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white">
                  Eliminar categoría
                </button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
