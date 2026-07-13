import Link from "next/link";
import type { Category } from "@prisma/client";

export function SiteFooter({
  email,
  phone,
  address,
  supportHours,
  whatsappHref,
  categories = [],
}: {
  email: string;
  phone: string;
  address: string;
  supportHours: string;
  whatsappHref: string;
  categories?: Category[];
}) {
  return (
    <footer className="mt-10 bg-[#081632] text-slate-200">
      <div className="section-shell grid gap-8 py-10 md:grid-cols-2 xl:grid-cols-[1.25fr_0.85fr_0.85fr_1fr]">
        <div>
          <h3 className="text-[30px] font-bold tracking-[-0.05em] text-white">Acavike</h3>
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-300">
            Catálogo industrial B2B para compras directas, cotizaciones de volumen y atención operativa para empresas.
          </p>
          <div className="mt-5 grid gap-2 text-[13px] text-slate-300">
            <p>{phone}</p>
            <p>{email}</p>
            <p>{address}</p>
            <p>{supportHours}</p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center rounded-[6px] bg-[#16A34A] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#15803D]"
          >
            WhatsApp Comercial
          </a>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-400">Ayuda</h4>
          <div className="mt-4 grid gap-3 text-[13px]">
            <Link href="/catalogo" className="text-slate-200 hover:text-white">
              Catálogo
            </Link>
            <Link href="/carrito" className="text-slate-200 hover:text-white">
              Carrito
            </Link>
            <Link href="/checkout" className="text-slate-200 hover:text-white">
              Checkout
            </Link>
            <Link href="/mi-cuenta" className="text-slate-200 hover:text-white">
              Mi Cuenta
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-400">Categorías</h4>
          <div className="mt-4 grid gap-3 text-[13px]">
            {categories.slice(0, 6).map((category) => (
              <Link key={category.id} href={`/catalogo/${category.slug}`} className="text-slate-200 hover:text-white">
                {category.name}
              </Link>
            ))}
            <Link href="/cotizacion-rapida" className="text-slate-200 hover:text-white">
              Cotización express
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-400">Contacto Directo</h4>
          <div className="mt-4 grid gap-4 text-[13px] leading-6 text-slate-200">
            <div>
              <p className="font-semibold text-white">Teléfono comercial</p>
              <p>{phone}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Correo</p>
              <p>{email}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Ubicación</p>
              <p>{address}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Horario</p>
              <p>{supportHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col gap-2 py-4 text-[12px] text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>Acavike. Plantilla comercial B2B con catálogo industrial y compra por transferencia.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contacto#nosotros" className="hover:text-white">
              Nosotros
            </Link>
            <Link href="/contacto#servicios" className="hover:text-white">
              Servicios
            </Link>
            <Link href="/contacto" className="hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
