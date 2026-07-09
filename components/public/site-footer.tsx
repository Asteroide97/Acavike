import Link from "next/link";
import type { Category } from "@prisma/client";

export function SiteFooter({
  email,
  phone,
  address,
  categories = [],
}: {
  email?: string;
  phone?: string;
  address?: string;
  categories?: Category[];
}) {
  return (
    <footer className="mt-10 border-t border-slate-300 bg-[#E6EBF0] text-slate-800">
      <div className="section-shell grid gap-8 py-8 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-[0.04em] text-[#002B52]">Acavike</h3>
          <p className="mt-3 text-[13px] leading-6 text-slate-700">
            Proveedor B2B para empaque, mantenimiento, seguridad, limpieza y abasto operativo.
          </p>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#002B52]">Ayuda</h4>
          <div className="mt-3 grid gap-2 text-[13px]">
            <Link href="/mi-cuenta" className="public-link">
              Mi cuenta
            </Link>
            <Link href="/carrito" className="public-link">
              Carrito
            </Link>
            <Link href="/checkout" className="public-link">
              Checkout
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#002B52]">Contacto</h4>
          <div className="mt-3 grid gap-2 text-[13px] leading-6">
            <p>{email || "ventas@acavike.com"}</p>
            <p>{phone || "81 0000 0000"}</p>
            <p>{address || "Monterrey, Nuevo Leon"}</p>
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#002B52]">Catalogo</h4>
          <div className="mt-3 grid gap-2 text-[13px]">
            <Link href="/catalogo" className="public-link">
              Todos los productos
            </Link>
            <Link href="/cotizacion-rapida" className="public-link">
              Cotizacion express
            </Link>
            <Link href="/contacto" className="public-link">
              Acerca de nosotros
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#002B52]">Categorias</h4>
          <div className="mt-3 grid gap-2 text-[13px]">
            {categories.slice(0, 6).map((category) => (
              <Link key={category.id} href={`/catalogo/${category.slug}`} className="public-link">
                {category.name}
              </Link>
            ))}
            <Link href="/contacto" className="public-link">
              Privacidad y terminos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
