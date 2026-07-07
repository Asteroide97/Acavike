import { getCurrentUser } from "@/lib/auth";
import { getCartTotals, getOrCreateCart } from "@/lib/cart";
import { getPublicNavigationData } from "@/lib/site";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

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
      <main>{children}</main>
      <SiteFooter
        email={settings.support_email}
        phone={settings.support_phone}
        address={settings.company_address}
      />
    </div>
  );
}
