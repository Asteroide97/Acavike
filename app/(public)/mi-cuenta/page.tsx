import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="section-shell py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardContent className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Ingreso</p>
              <h1 className="mt-2 text-3xl font-semibold">Accede a tu cuenta</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Consulta tus pedidos, sube comprobantes y centraliza datos de compra.
              </p>
              <div className="mt-8">
                <LoginForm />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Registro</p>
              <h2 className="mt-2 text-3xl font-semibold">Crear cuenta cliente</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Abre una cuenta para seguimiento de pedidos, cotizaciones y recompra.
              </p>
              <div className="mt-8">
                <RegisterForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ordersCount = user.customer
    ? await prisma.order.count({
        where: { customerId: user.customer.id },
      })
    : 0;

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="surface p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Mi cuenta</p>
          <h1 className="mt-2 text-4xl font-semibold">Hola, {user.name}</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Correo</p>
              <p className="mt-2 font-semibold">{user.email}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rol</p>
              <p className="mt-2 font-semibold">{user.role}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pedidos</p>
              <p className="mt-2 font-semibold">{ordersCount}</p>
            </div>
          </div>

          {user.customer ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Datos de cliente</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-slate-500">Empresa</p>
                  <p className="mt-1 font-medium">{user.customer.companyName}</p>
                </div>
                <div>
                  <p className="text-slate-500">RFC</p>
                  <p className="mt-1 font-medium">{user.customer.rfc || "No capturado"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Teléfono</p>
                  <p className="mt-1 font-medium">{user.customer.phone || "No capturado"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Dirección</p>
                  <p className="mt-1 font-medium">{user.customer.address || "No capturada"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Nivel</p>
                  <p className="mt-1 font-medium">{user.customer.level}</p>
                </div>
                <div>
                  <p className="text-slate-500">Alta</p>
                  <p className="mt-1 font-medium">{formatDate(user.customer.createdAt)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <Link href="/mis-pedidos" className={cn(buttonVariants({ fullWidth: true }))}>
              Ver mis pedidos
            </Link>
            {user.role !== "CUSTOMER" ? (
              <Link href="/admin" className={cn(buttonVariants({ variant: "outline", fullWidth: true }))}>
                Ir al panel admin
              </Link>
            ) : null}
            <form
              action={async () => {
                "use server";
                await logoutAction();
              }}
            >
              <button className={cn(buttonVariants({ variant: "ghost", fullWidth: true }))}>Cerrar sesión</button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
