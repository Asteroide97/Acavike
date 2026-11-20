import type { Category } from "@prisma/client";
import { BrandLogo } from "@/components/ui/brand-logo";

export function SiteFooter({
  email, phone, address, supportHours, whatsappHref, categories = [],
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
    <footer className="bg-[var(--brand-navy)] text-white">
      <div className="section-shell py-5 md:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
            <BrandLogo className="w-[130px] shrink-0 rounded-md bg-white p-1 md:w-[160px]" />
            <p className="max-w-[230px] text-[15px] leading-6 text-slate-200">
              Suministros industriales para empresas.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-[14px] md:items-end">
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="font-semibold hover:underline">{phone}</a>
            <a href={`mailto:${email}`} className="break-all text-slate-200 hover:underline">{email}</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-[40px] items-center rounded-md bg-[#15803D] px-4 text-[14px] font-semibold text-white hover:bg-[#166534]">
              WhatsApp Comercial
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/20 pt-3 text-[13px] text-slate-200 sm:flex-row sm:justify-between md:mt-5 md:pt-4">
          <p>{address}</p>
          <p>{supportHours}</p>
        </div>
      </div>
    </footer>
  );
}
