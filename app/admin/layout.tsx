import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { BACKOFFICE_ROLES, USER_ROLE_LABELS } from "@/lib/constants";
import { DEMO_MODE, RUNTIME_NOTICE } from "@/lib/config";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser(BACKOFFICE_ROLES);

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[290px_1fr]">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <AdminSidebar role={user.role} />
        </div>

        <div className="space-y-6">
          <div className="admin-surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Backoffice</p>
              <h1 className="mt-2 text-2xl font-semibold">Operacion Acavike</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sesion activa: {user.name} · {USER_ROLE_LABELS[user.role]}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {DEMO_MODE ? (
                <span className="inline-flex h-11 items-center rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-900">
                  Modo demo
                </span>
              ) : null}
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Ver sitio publico
              </Link>
              <Link href="/mi-cuenta" className={cn(buttonVariants({ variant: "ghost" }))}>
                Mi cuenta
              </Link>
              <form
                action={async () => {
                  "use server";
                  await logoutAction();
                }}
              >
                <button className={cn(buttonVariants({ variant: "default" }))}>Cerrar sesion</button>
              </form>
            </div>
          </div>

          {RUNTIME_NOTICE && !DEMO_MODE ? <Alert tone={RUNTIME_NOTICE.tone}>{RUNTIME_NOTICE.message}</Alert> : null}

          {children}
        </div>
      </div>
    </div>
  );
}
