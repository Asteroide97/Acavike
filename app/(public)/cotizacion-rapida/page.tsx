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
    <div className="section-shell py-4 md:py-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="public-panel p-6 md:p-8">
          <p className="public-kicker">Cotización express</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-slate-900">
            Envíanos tus requerimientos y armamos la propuesta comercial
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
            <h2 className="text-[24px] font-semibold text-slate-900">Para cotizar más rápido</h2>
            <ul className="mt-4 space-y-3 text-[13px] leading-6 text-slate-700">
              <li>Indica cantidad por producto.</li>
              <li>Agrega SKU si lo tienes.</li>
              <li>Menciona si requieres entrega local o embarque.</li>
              <li>Puedes agregar notas especiales.</li>
            </ul>
          </div>

          <div className="rounded-[6px] bg-[#0B1E4B] p-6 text-slate-200">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-200">Ejemplo de captura</p>
            <div className="mt-4 space-y-3 rounded-[6px] bg-white/10 p-4 text-sm leading-6 text-slate-100">
              <p>EMP-002 | Caja corrugada doble pared | 10</p>
              <p>Guante anticorte | 24 piezas</p>
              <p>Desengrasante industrial | 6 galones</p>
            </div>
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
