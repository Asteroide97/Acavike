import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCartAction } from "@/lib/actions/commerce";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ProductCard } from "@/components/public/product-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      priceTiers: {
        orderBy: { minQuantity: "asc" },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      NOT: { id: product.id },
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
    take: 4,
  });

  return (
    <div className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface overflow-hidden">
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image
                src={product.images[0]?.url || "/placeholder-product.svg"}
                alt={product.images[0]?.alt || product.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-3 gap-4">
              {product.images.slice(1).map((image) => (
                <div key={image.id} className="surface relative aspect-square overflow-hidden">
                  <Image src={image.url} alt={image.alt || product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="surface p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {product.category.name}
                </p>
                <h1 className="mt-2 text-4xl font-semibold">{product.name}</h1>
              </div>
              {product.isFeatured ? <Badge variant="info">Destacado</Badge> : null}
            </div>

            <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
              <p>{product.shortDescription || product.description}</p>
              <p>
                <strong className="text-slate-800">SKU:</strong> {product.sku}
              </p>
              <p>
                <strong className="text-slate-800">Marca:</strong> {product.brand || "Acavike"}
              </p>
              <p>
                <strong className="text-slate-800">Entrega:</strong> {product.leadTimeText || "Por confirmar"}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Precio base</p>
                <p className="mt-1 text-4xl font-semibold">{formatCurrency(product.price)}</p>
                <p className="mt-1 text-sm text-slate-500">por {product.unit}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Stock disponible</p>
                <p className="mt-1 text-2xl font-semibold">{product.stock}</p>
              </div>
            </div>

            <form action={addToCartAction} className="mt-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-end">
              <input type="hidden" name="productId" value={product.id} />
              <div className="w-full max-w-[160px]">
                <label className="mb-2 block text-sm font-medium text-slate-800">Cantidad</label>
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  defaultValue={1}
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-white">
                Agregar al carrito
              </button>
              <Link href="/cotizacion-rapida" className="text-sm font-semibold text-primary">
                O solicitar cotización
              </Link>
            </form>
          </div>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">Precios por volumen</h2>
              {product.priceTiers.length ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Mínimo</TableHeaderCell>
                        <TableHeaderCell>Precio</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {product.priceTiers.map((tier) => (
                        <TableRow key={tier.id}>
                          <TableCell>{tier.minQuantity} {product.unit}</TableCell>
                          <TableCell>{formatCurrency(tier.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Este producto aún no tiene escalas de mayoreo configuradas.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {relatedProducts.length ? (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Relacionados</p>
              <h2 className="mt-2 text-3xl font-semibold">Más productos de esta categoría</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
