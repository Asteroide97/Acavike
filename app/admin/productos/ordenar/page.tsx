import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductOrderEditor } from "@/components/admin/product-order-editor";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/config";
import { ProductOrderError } from "@/lib/product-order";
import { getProductOrderingRepository } from "@/lib/repositories/product-order";

export const dynamic = "force-dynamic";
export default async function ProductOrderingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(ADMIN_ROLES);
  const params = await searchParams;
  const categoryId = typeof params.categoria === "string" && params.categoria ? params.categoria : null;
  try {
    const data = await getProductOrderingRepository(categoryId);
    return <div className="min-w-0 space-y-5">
      <AdminPageHeader title="Ordenar productos" eyebrow="Catálogo" description="Cambia la posición sin modificar información comercial." actions={<Link href="/admin/productos" className="public-btn-outline">Volver a productos</Link>} />
      <ProductOrderEditor key={`${categoryId}:${data.version}`} categories={data.categories} products={data.products} categoryId={categoryId} initialVersion={data.version} available={data.available} demoMode={DEMO_MODE} />
    </div>;
  } catch (error) {
    return <div className="admin-surface space-y-4 p-6"><h1>Ordenar productos</h1><p role="alert">{error instanceof ProductOrderError ? error.message : "No se pudo consultar el orden. Comprueba la conexión y vuelve a intentarlo."}</p><Link href="/admin/productos/ordenar" className="public-btn-outline">Volver a intentar</Link></div>;
  }
}
