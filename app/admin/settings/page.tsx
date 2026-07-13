import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSettingAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES, BANK_SETTING_KEYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SETTINGS_CONFIG = [
  { key: BANK_SETTING_KEYS.bankName, label: "Banco", multiline: false },
  { key: BANK_SETTING_KEYS.beneficiary, label: "Beneficiario", multiline: false },
  { key: BANK_SETTING_KEYS.clabe, label: "CLABE", multiline: false },
  { key: BANK_SETTING_KEYS.referenceHelp, label: "Ayuda de referencia", multiline: true },
  { key: BANK_SETTING_KEYS.supportPhone, label: "Teléfono de soporte", multiline: false },
  { key: BANK_SETTING_KEYS.supportEmail, label: "Correo de soporte", multiline: false },
  { key: BANK_SETTING_KEYS.companyAddress, label: "Dirección comercial", multiline: true },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const settings = await prisma.siteSetting.findMany();
  const settingsMap = settings.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Settings"
        title="Configuración general"
        description="Datos bancarios, contacto comercial y textos base utilizados por checkout y sitio público."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 md:grid-cols-2">
        {SETTINGS_CONFIG.map((setting) => (
          <Card key={setting.key} className="admin-surface">
            <CardContent className="p-6">
              <form action={updateSiteSettingAction} className="space-y-4">
                <input type="hidden" name="key" value={setting.key} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">{setting.label}</label>
                  {setting.multiline ? (
                    <Textarea name="value" defaultValue={settingsMap[setting.key] || ""} />
                  ) : (
                    <Input name="value" defaultValue={settingsMap[setting.key] || ""} />
                  )}
                </div>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar ajuste
                </button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
