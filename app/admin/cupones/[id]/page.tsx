import { notFound } from "next/navigation";
import { AdminField } from "@/components/admin/admin-field";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteCouponAction, saveCouponAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CouponEditorPage({
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

  const coupon = isNew ? null : await prisma.coupon.findUnique({ where: { id } });

  if (!isNew && !coupon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cupon"
        title={isNew ? "Nuevo cupon" : coupon?.code || "Cupon"}
        description="Usa monto fijo o porcentaje y define vigencias para activar la promocion."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="admin-surface">
          <CardContent className="p-6">
            <form action={saveCouponAction} className="grid gap-4 md:grid-cols-2">
              {coupon ? <input type="hidden" name="couponId" value={coupon.id} /> : null}

              <AdminField label="Codigo">
                <Input name="code" defaultValue={coupon?.code || ""} />
              </AdminField>
              <AdminField label="Tipo">
                <Select name="type" defaultValue={coupon?.type || "PERCENTAGE"}>
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="FIXED">Monto fijo</option>
                </Select>
              </AdminField>
              <AdminField label="Monto">
                <Input name="amount" type="number" step="0.01" defaultValue={coupon?.amount.toString() || ""} />
              </AdminField>
              <AdminField label="Limite de uso">
                <Input name="usageLimit" type="number" defaultValue={coupon?.usageLimit ?? ""} />
              </AdminField>
              <AdminField label="Inicio">
                <input
                  type="date"
                  name="startsAt"
                  defaultValue={formatDateInput(coupon?.startsAt)}
                  className="flex h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </AdminField>
              <AdminField label="Fin">
                <input
                  type="date"
                  name="endsAt"
                  defaultValue={formatDateInput(coupon?.endsAt)}
                  className="flex h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </AdminField>
              <AdminField label="Descripción" className="md:col-span-2">
                <Textarea name="description" defaultValue={coupon?.description || ""} />
              </AdminField>
              <div className="md:col-span-2 flex items-center gap-3">
                <Checkbox id="isActive" name="isActive" defaultChecked={coupon ? coupon.isActive : true} />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-800">
                  Cupon activo
                </label>
              </div>
              <div className="md:col-span-2">
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Guardar cupon
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {coupon ? (
          <Card className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Zona de riesgo</h2>
              <form action={deleteCouponAction}>
                <input type="hidden" name="couponId" value={coupon.id} />
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white">
                  Eliminar cupon
                </button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
