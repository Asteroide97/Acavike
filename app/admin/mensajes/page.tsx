import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { updateMessageStatusAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES, MESSAGE_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Mensajes"
        title="Bandeja de contacto"
        description="Centraliza solicitudes entrantes y cambia su estado operativo."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="grid gap-6 xl:grid-cols-2">
        {messages.map((message) => (
          <Card key={message.id} className="admin-surface">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{message.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {message.companyName || "Sin empresa"} · {message.email}
                  </p>
                </div>
                <StatusBadge kind="message" status={message.status} />
              </div>

              <p className="text-sm text-muted-foreground">
                {formatDate(message.createdAt)} · {message.phone || "Sin telefono"}
              </p>
              <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {message.message}
              </p>

              <form action={updateMessageStatusAction} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="messageId" value={message.id} />
                <Select name="status" defaultValue={message.status} className="min-w-[180px]">
                  {Object.entries(MESSAGE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white">
                  Actualizar
                </button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
