import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCartTotals, getOrCreateCart, SAFE_CART_FALLBACK } from "@/lib/cart";
import { RUNTIME_NOTICE } from "@/lib/config";
import { getPublicContactDetails, getPublicNavigationData } from "@/lib/site";
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
  const user = await getCurrentUser().catch(() => null);
  const [navigationResult, cartResult] = await Promise.allSettled([
    getPublicNavigationData(),
    getOrCreateCart(user?.id),
  ]);

  const navigation =
    navigationResult.status === "fulfilled"
      ? navigationResult.value
      : { categories: [], settings: {} as Record<string, string> };
  const categories = Array.isArray(navigation.categories) ? navigation.categories : [];
  const settings =
    navigation.settings && typeof navigation.settings === "object"
      ? navigation.settings
      : ({} as Record<string, string>);
  const cart = cartResult.status === "fulfilled" ? cartResult.value : null;
  const totals = cart ? getCartTotals(cart) : SAFE_CART_FALLBACK;
  const contact = getPublicContactDetails(settings);

  return (
    <div className="public-app min-h-screen overflow-x-hidden bg-[#F3F4F6]">
      <SiteHeader
        cartCount={totals.itemsCount}
        cartTotal={totals.total}
        user={user}
        supportPhone={contact.supportPhone}
        supportHours={contact.supportHours}
        supportEmail={contact.supportEmail}
      />
      {RUNTIME_NOTICE ? (
        <div className="section-shell pt-3">
          <Alert tone={RUNTIME_NOTICE.tone}>{RUNTIME_NOTICE.message}</Alert>
        </div>
      ) : null}
      <main>{children}</main>
      <SiteFooter
        email={contact.supportEmail}
        phone={contact.supportPhone}
        address={contact.companyAddress}
        supportHours={contact.supportHours}
        whatsappHref={contact.whatsappHref}
        categories={categories}
      />
    </div>
  );
}
