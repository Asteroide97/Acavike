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
  void categories;

  return (
    <footer className="mt-10 bg-[#081632] text-slate-200">
      <div className="section-shell py-8 md:py-10">
        <div className="rounded-[6px] border border-white/10 bg-white/[0.03] p-6 md:p-8 lg:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Catálogo industrial B2B
          </p>
          <h3 className="mt-3 text-[36px] font-bold leading-none tracking-[-0.05em] text-white md:text-[44px]">
            Acavike
          </h3>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-300 md:text-[16px]">
            Suministros industriales para empresas con compra directa, cotización comercial y atención
            operativa por canales simples.
          </p>

          <div className="mt-8 grid gap-3 text-[14px] text-slate-200 md:grid-cols-2 md:gap-x-10 md:text-[15px]">
            <p>{phone}</p>
            <p>{email}</p>
            <p>{address}</p>
            <p>{supportHours}</p>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex min-h-[44px] items-center rounded-[6px] bg-[#16A34A] px-5 text-[14px] font-semibold text-white hover:bg-[#15803D]"
          >
            WhatsApp Comercial
          </a>
        </div>
      </div>
    </footer>
  );
}
