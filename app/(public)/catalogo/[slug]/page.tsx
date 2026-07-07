import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/public/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function CategoryCatalogPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      category: true,
      priceTiers: {
        orderBy: { minQuantity: "asc" },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="section-shell py-10">
      <div className="surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Categoría</p>
        <h1 className="mt-2 text-4xl font-semibold">{category.name}</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{category.description}</p>
        <div className="mt-6">
          <Link href="/catalogo" className="text-sm font-semibold text-primary">
            Volver al catálogo completo
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {products.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay productos en esta categoría"
            description="Todavía no cargamos productos activos para esta línea."
            actionHref="/catalogo"
            actionLabel="Volver al catálogo"
          />
        )}
      </div>
    </div>
  );
}
