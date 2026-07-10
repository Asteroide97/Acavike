import { QuickQuoteForm } from "@/components/auth/quick-quote-form";
import { buildQuoteRequirements } from "@/lib/public-catalog";
import { getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QuickQuotePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const initialRequirements = buildQuoteRequirements({
    sku: getSingleValue(resolved.sku),
    name: getSingleValue(resolved.producto),
    quantity: getSingleValue(resolved.cantidad),
  });
  const contact = getPublicContactDetails(await getSiteSettingsMap());

  return (
    <div className="section-shell py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="public-panel p-6 md:p-8">
          <p className="public-kicker">Cotizacion express</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-slate-900">
            Envianos tus requerimientos y armamos la propuesta comercial
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-slate-700">
            Comparte productos, SKUs, cantidades o consumo estimado. Respondemos en menos de 24 horas y mantenemos compra por transferencia bancaria.
          </p>
          <div className="mt-6">
            <QuickQuoteForm initialRequirements={initialRequirements} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="public-panel p-6">
            <h2 className="text-[24px] font-semibold text-slate-900">Como acelerar la respuesta</h2>
            <div className="mt-4 space-y-4 text-[13px] leading-6 text-slate-700">
              <p>Incluye cantidad estimada por partida, frecuencia de compra y si necesitas entrega local o embarque.</p>
              <p>Si ya tienes SKUs internos o codigos de proveedor, agregalos en una linea por producto.</p>
              <p>El folio generado entra como borrador al panel de cotizaciones para revision de ventas.</p>
            </div>
          </div>

          <div className="rounded-[6px] bg-[#0B1E4B] p-6 text-slate-200">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-200">Formato sugerido</p>
            <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-slate-100">
Guante anticorte | 24
Caja corrugada doble pared | 50
Desengrasante industrial | 6
            </pre>
          </div>

          <div className="rounded-[6px] bg-[#F4B000] p-6 text-[#0B1E4B]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em]">Contacto directo</p>
            <div className="mt-3 grid gap-1 text-[13px] leading-6">
              <p>{contact.supportPhone}</p>
              <p>{contact.supportEmail}</p>
              <p>{contact.supportHours}</p>
            </div>
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-[6px] bg-[#16A34A] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#15803D]"
            >
              WhatsApp Comercial
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
