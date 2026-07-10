import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart";
import { CatalogBreadcrumbs } from "@/components/public/catalog-breadcrumbs";
import { ProductCard } from "@/components/public/product-card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { buildQuoteRequirements } from "@/lib/public-catalog";
import { getProductDetailDataRepository } from "@/lib/repositories/catalog";
import { getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  noStore();
  const { slug } = await params;
  const [{ product, relatedProducts }, settings] = await Promise.all([
    getProductDetailDataRepository(slug),
    getSiteSettingsMap(),
  ]);

  if (!product || !product.isActive) {
    notFound();
  }

  const contact = getPublicContactDetails(settings);
  const quoteRequirements = buildQuoteRequirements({
    sku: product.sku,
    name: product.name,
    quantity: 1,
  });
  const quoteHref = `/cotizacion-rapida?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(product.name)}&cantidad=1`;
  const specRows = [
    { label: "SKU", value: product.sku },
    { label: "Marca", value: product.brand || "Acavike" },
    { label: "Unidad", value: product.unit },
    { label: "Categoria", value: product.category.name },
    { label: "Entrega", value: product.leadTimeText || "Sujeta a disponibilidad" },
    { label: "Stock", value: String(product.stock) },
  ];

  return (
    <div className="section-shell py-5 md:py-6">
      <CatalogBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Todos los productos", href: "/catalogo" },
          { label: product.category.name, href: `/catalogo/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <section className="public-panel p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB]">
              <div className="relative aspect-[4/3]">
                <Image
                  src={product.images[0]?.url || "/placeholder-product.svg"}
                  alt={product.images[0]?.alt || product.name}
                  fill
                  className="object-contain p-6"
                />
              </div>
            </div>

            <div className="rounded-[6px] border border-[#D1D5DB] bg-[#F9FAFB] p-4">
              <h2 className="text-[18px] font-semibold text-slate-900">Descripcion del producto</h2>
              <p className="mt-2 text-[13px] leading-6 text-slate-700">{product.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[6px] border border-[#D1D5DB] bg-white p-4 md:p-5">
              <p className="public-kicker">{product.category.name}</p>
              <h1 className="mt-2 text-[30px] font-semibold leading-tight text-slate-900">{product.name}</h1>

              <div className="mt-4 grid gap-2 text-[13px] text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-bold text-slate-900">SKU:</span> {product.sku}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Marca:</span> {product.brand || "Acavike"}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Unidad:</span> {product.unit}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Stock:</span> {product.stock}
                </p>
              </div>

              <div className="mt-5 rounded-[6px] border border-[#E7D28B] bg-[#FFF7DB] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Precio base</p>
                <p className="mt-2 text-[32px] font-bold leading-none text-slate-900">{formatCurrency(product.price)}</p>
                <p className="mt-2 text-[13px] text-slate-700">Entrega: {product.leadTimeText || "Sujeta a disponibilidad"}</p>
              </div>

              <form action={addToCartAction} className="mt-5 grid gap-3 md:grid-cols-[140px_1fr]">
                <input type="hidden" name="productId" value={product.id} />
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Cantidad
                  </label>
                  <input type="number" name="quantity" min={1} defaultValue={1} className="public-input" />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <button className="public-btn w-full" type="submit">
                    Agregar al carrito
                  </button>
                  <Link href={quoteHref} className="public-btn-outline w-full">
                    Solicitar cotizacion
                  </Link>
                </div>
              </form>
            </div>

            <div className="rounded-[6px] border border-[#D1D5DB] bg-white p-4">
              <h2 className="text-[18px] font-semibold text-slate-900">Condiciones comerciales</h2>
              <ul className="mt-3 grid gap-2 text-[13px] leading-6 text-slate-700">
                <li>Pago por transferencia bancaria.</li>
                <li>Entrega sujeta a disponibilidad y confirmacion operativa.</li>
                <li>Facturacion disponible para compras empresariales.</li>
                <li>Prefill de cotizacion: {quoteRequirements}</li>
              </ul>
              <div className="mt-4 rounded-[6px] bg-[#F9FAFB] p-3 text-[13px] text-slate-700">
                <p className="font-semibold text-[#0B1E4B]">Contacto comercial</p>
                <p className="mt-1">{contact.supportPhone}</p>
                <a href={contact.whatsappHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-semibold text-[#1D3B7A] hover:underline">
                  Abrir WhatsApp Comercial
                </a>
              </div>
            </div>

            {product.priceTiers.length ? (
              <div className="rounded-[6px] border border-[#D1D5DB] bg-white p-4">
                <h2 className="text-[18px] font-semibold text-slate-900">Precios por mayoreo</h2>
                <div className="mt-3 overflow-hidden rounded-[6px] border border-[#D1D5DB]">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Minimo</TableHeaderCell>
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
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[6px] border border-[#D1D5DB] bg-white p-4">
            <h2 className="text-[18px] font-semibold text-slate-900">Especificaciones</h2>
            <div className="mt-3 overflow-hidden rounded-[6px] border border-[#D1D5DB]">
              <table className="min-w-full text-left text-[13px]">
                <tbody>
                  {specRows.map((row) => (
                    <tr key={row.label} className="border-b border-[#D1D5DB] last:border-0">
                      <th className="w-[160px] bg-[#F9FAFB] px-4 py-3 font-semibold text-slate-700">{row.label}</th>
                      <td className="px-4 py-3 text-slate-800">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[6px] border border-[#D1D5DB] bg-white p-4">
            <h2 className="text-[18px] font-semibold text-slate-900">Notas operativas</h2>
            <div className="mt-3 grid gap-3 text-[13px] leading-6 text-slate-700">
              <p>Producto orientado a surtido B2B y compras de reposicion para operacion, mantenimiento o inventario.</p>
              <p>Si requieres un paquete mixto, marca propia, tiempos especiales o compras por lote, utiliza la cotizacion express.</p>
              <p>Las existencias mostradas en demo son referenciales y sirven para validar el flujo comercial sin depender de una base externa.</p>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="public-panel mt-4 p-4 md:p-5">
          <div className="flex items-end justify-between gap-3 border-b border-[#D1D5DB] pb-4">
            <div>
              <p className="public-kicker">Relacionados</p>
              <h2 className="mt-2 text-[24px] font-semibold text-slate-900">Mas productos de esta familia</h2>
            </div>
            <Link href={`/catalogo/${product.category.slug}`} className="public-link text-[13px]">
              Volver a {product.category.name}
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
