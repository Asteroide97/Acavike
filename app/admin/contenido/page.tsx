import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSectionAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { listAllSiteSectionsRepository } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const sections = await listAllSiteSectionsRepository();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Contenido"
        title="Secciones del sitio"
        description="Edita hero, bloques informativos y llamadas a la accion del frente publico."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.id} className="admin-surface">
            <CardContent className="p-6">
              <form action={updateSiteSectionAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="sectionId" value={section.id} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Clave</label>
                  <Input value={section.key} readOnly />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Orden</label>
                  <Input name="sortOrder" type="number" defaultValue={section.sortOrder} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Titulo</label>
                  <Input name="title" defaultValue={section.title} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Subtitulo</label>
                  <Input name="subtitle" defaultValue={section.subtitle || ""} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Contenido</label>
                  <Textarea name="body" defaultValue={section.body || ""} className="min-h-[180px]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Imagen</label>
                  <Input name="imageUrl" defaultValue={section.imageUrl || ""} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Texto del boton</label>
                  <Input name="buttonText" defaultValue={section.buttonText || ""} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Href del boton</label>
                  <Input name="buttonHref" defaultValue={section.buttonHref || ""} />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Checkbox id={`active-${section.id}`} name="isActive" defaultChecked={section.isActive} />
                  <label htmlFor={`active-${section.id}`} className="text-sm font-medium text-slate-800">
                    Seccion activa
                  </label>
                </div>
                <div className="md:col-span-2">
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                    Guardar seccion
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
