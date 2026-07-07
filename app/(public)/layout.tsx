import { getCurrentUser } from "@/lib/auth";
import { getCartTotals, getOrCreateCart } from "@/lib/cart";
import { getPublicNavigationData } from "@/lib/site";
import { Alert } from "@/components/ui/alert";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { DEMO_MODE, RUNTIME_NOTICE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const [{ categories, settings }, cart] = await Promise.all([
    getPublicNavigationData(),
    getOrCreateCart(user?.id),
  ]);
  const totals = getCartTotals(cart);

  return (
    <div className="min-h-screen">
      <SiteHeader categories={categories} cartCount={totals.itemsCount} user={user} />
      {RUNTIME_NOTICE && !DEMO_MODE ? (
        <div className="section-shell pt-4">
          <Alert tone={RUNTIME_NOTICE.tone}>{RUNTIME_NOTICE.message}</Alert>
        </div>
      ) : null}
      <main>{children}</main>
      <SiteFooter
        email={settings.support_email}
        phone={settings.support_phone}
        address={settings.company_address}
      />
    </div>
  );
}
