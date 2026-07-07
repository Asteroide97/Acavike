import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveEmailTemplateAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Email Templates"
        title="Plantillas de correo"
        description="Edita asunto, contenido y activacion de correos operativos."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="admin-surface">
            <CardContent className="p-6">
              <form action={saveEmailTemplateAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="templateId" value={template.id} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Clave</label>
                  <Input name="key" defaultValue={template.key} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Nombre</label>
                  <Input name="name" defaultValue={template.name} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Asunto</label>
                  <Input name="subject" defaultValue={template.subject} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Cuerpo</label>
                  <Textarea name="body" defaultValue={template.body} className="min-h-[180px]" />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Checkbox id={`active-${template.id}`} name="isActive" defaultChecked={template.isActive} />
                  <label htmlFor={`active-${template.id}`} className="text-sm font-medium text-slate-800">
                    Plantilla activa
                  </label>
                </div>
                <div className="md:col-span-2">
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                    Guardar plantilla
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}

        <Card className="admin-surface">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Nueva plantilla</h2>
            <form action={saveEmailTemplateAction} className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Clave</label>
                <Input name="key" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">Nombre</label>
                <Input name="name" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-800">Asunto</label>
                <Input name="subject" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-800">Cuerpo</label>
                <Textarea name="body" className="min-h-[180px]" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <Checkbox id="new-template-active" name="isActive" defaultChecked />
                <label htmlFor="new-template-active" className="text-sm font-medium text-slate-800">
                  Plantilla activa
                </label>
              </div>
              <div className="md:col-span-2">
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Crear plantilla
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
