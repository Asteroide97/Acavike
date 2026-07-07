import { QuickQuoteForm } from "@/components/auth/quick-quote-form";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function QuickQuotePage() {
  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Cotización rápida</p>
          <h1 className="mt-2 text-4xl font-semibold">Envíanos tus requerimientos y te armamos la propuesta</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Comparte productos, SKUs, cantidades o consumo estimado. El equipo comercial convertirá tu solicitud en cotización editable dentro del panel.
          </p>
          <div className="mt-8">
            <QuickQuoteForm />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-8">
            <h2 className="text-2xl font-semibold">Cómo acelerar la respuesta</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Incluye cantidad estimada por partida, frecuencia de compra y si necesitas entrega local o embarque.</p>
              <p>Si ya tienes SKUs internos o códigos de proveedor, agrégalos en una línea por producto.</p>
              <p>El folio generado entra como borrador al panel de cotizaciones para revisión de ventas.</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-6 text-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Formato sugerido</p>
              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-slate-100">
Guante anticorte | 24
Caja corrugada doble pared | 50
Desengrasante industrial | 6
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
