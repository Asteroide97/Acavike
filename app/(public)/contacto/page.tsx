import { ContactForm } from "@/components/auth/contact-form";
import { getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettingsMap();
  const contact = getPublicContactDetails(settings);

  return (
    <div className="section-shell py-4 md:py-6">
      <div className="space-y-6">
        <section className="public-panel p-6 md:p-8">
          <p className="public-kicker">Contacto</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-slate-900">
            Habla con el equipo comercial de Acavike
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-slate-700">
            Usa este formulario para atención comercial, requerimientos de producto, soporte de pedidos o coordinación operativa.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="public-panel p-6 md:p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1D3B7A]">Solicitud comercial</p>
            <h2 className="mt-2 text-[24px] font-semibold text-slate-900">Cuéntanos lo que necesitas</h2>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">
              Cotizaciones, surtido recurrente, fabricación, proyectos especiales o ayuda con pedidos actuales.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-4">
            <div className="public-panel p-6">
              <h2 className="text-[24px] font-semibold text-slate-900">Datos de contacto</h2>
              <div className="mt-5 space-y-4 text-[13px] leading-6 text-slate-700">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Correo</p>
                  <p className="mt-1 font-semibold text-slate-900">{contact.supportEmail}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Teléfono</p>
                  <p className="mt-1 font-semibold text-slate-900">{contact.supportPhone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ubicación</p>
                  <p className="mt-1 font-semibold text-slate-900">{contact.companyAddress}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Horario</p>
                  <p className="mt-1 font-semibold text-slate-900">{contact.supportHours}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[6px] bg-[#16A34A] p-6 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-green-50">WhatsApp Comercial</p>
              <p className="mt-3 text-[14px] leading-6 text-green-50">
                Abre un canal directo para cotización, seguimiento o necesidades de surtido.
              </p>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-[6px] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#15803D] hover:bg-green-50"
              >
                Iniciar chat
              </a>
            </div>
          </div>
        </div>

        <section id="servicios" className="public-panel p-6 md:p-8">
          <div className="flex flex-col gap-3 border-b border-[#D1D5DB] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="public-kicker">Servicios</p>
              <h2 className="mt-2 text-[26px] font-semibold text-slate-900">Soporte comercial y operativo</h2>
            </div>
            <p className="text-[13px] text-slate-600">Atención enfocada en industria, compras y abastecimiento.</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Cotización por volumen",
                body: "Armamos propuestas para compras recurrentes, reabasto o paquetes mixtos.",
              },
              {
                title: "Fabricación y proyecto",
                body: "Acompañamos requerimientos especiales para planta, montaje o adecuaciones.",
              },
              {
                title: "Seguimiento de pedidos",
                body: "Validación de transferencia, entregas y soporte postventa para clientes B2B.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-4">
                <h3 className="text-[18px] font-semibold text-[#0B1E4B]">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-700">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="nosotros" className="public-panel p-6 md:p-8">
          <p className="public-kicker">Nosotros</p>
          <h2 className="mt-2 text-[26px] font-semibold text-slate-900">Acavike como frente comercial industrial</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3 text-[13px] leading-6 text-slate-700">
              <p>
                Acavike está pensado para empresas que necesitan un catálogo claro, contacto directo con ventas y un flujo de compra alineado a transferencia bancaria y seguimiento comercial.
              </p>
              <p>
                La plantilla combina home comercial, catálogo visual, productos, carrito, checkout y backoffice sin depender de servicios de pago externos para el demo.
              </p>
            </div>

            <div className="rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Base operativa</p>
              <div className="mt-3 grid gap-2 text-[13px] text-slate-700">
                <p>Ubicación: {contact.companyAddress}</p>
                <p>Horario: {contact.supportHours}</p>
                <p>Correo: {contact.supportEmail}</p>
                <p>Teléfono: {contact.supportPhone}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
