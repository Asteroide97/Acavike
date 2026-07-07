import Link from "next/link";

export function SiteFooter({
  email,
  phone,
  address,
}: {
  email?: string;
  phone?: string;
  address?: string;
}) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-semibold text-white">Acavike</h3>
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            Plataforma de abastecimiento industrial enfocada en compras B2B, cotización rápida y operación por transferencia bancaria.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rutas clave</h4>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/cotizacion-rapida">Cotización rápida</Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Contacto</h4>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <p>{email || "ventas@acavike.com"}</p>
            <p>{phone || "81 0000 0000"}</p>
            <p>{address || "Monterrey, Nuevo León"}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
