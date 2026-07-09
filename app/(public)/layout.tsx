import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCartTotals, getOrCreateCart } from "@/lib/cart";
import { RUNTIME_NOTICE } from "@/lib/config";
import { getPublicNavigationData } from "@/lib/site";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const user = await getCurrentUser();
  const [{ categories, settings }, cart] = await Promise.all([getPublicNavigationData(), getOrCreateCart(user?.id)]);
  const totals = getCartTotals(cart);

  return (
    <div className="public-app min-h-screen bg-[#EFEFEF]">
      <SiteHeader
        categories={categories}
        cartCount={totals.itemsCount}
        cartTotal={totals.total}
        user={user}
        supportPhone={settings.support_phone}
      />
      {RUNTIME_NOTICE ? (
        <div className="section-shell pt-3">
          <Alert tone={RUNTIME_NOTICE.tone}>{RUNTIME_NOTICE.message}</Alert>
        </div>
      ) : null}
      <main>{children}</main>
      <SiteFooter
        email={settings.support_email}
        phone={settings.support_phone}
        address={settings.company_address}
        categories={categories}
      />
    </div>
  );
}
