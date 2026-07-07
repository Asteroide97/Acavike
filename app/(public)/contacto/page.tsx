import { ContactForm } from "@/components/auth/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettingsMap } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettingsMap();

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="surface p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Contacto</p>
          <h1 className="mt-2 text-4xl font-semibold">Habla con el equipo comercial de Acavike</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Usa este formulario para atención comercial, requerimientos de producto, soporte de pedidos o coordinación operativa.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-8">
            <h2 className="text-2xl font-semibold">Datos de contacto</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Correo</p>
                <p className="mt-1 font-medium text-slate-900">{settings.support_email || "ventas@acavike.com"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Teléfono</p>
                <p className="mt-1 font-medium text-slate-900">{settings.support_phone || "81 0000 0000"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ubicación</p>
                <p className="mt-1 font-medium text-slate-900">
                  {settings.company_address || "Monterrey, Nuevo León"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
