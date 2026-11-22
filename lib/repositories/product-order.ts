import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCategories, demoProducts } from "@/lib/demo-data";
import { descendantCategoryIds } from "@/lib/catalog-filters";
import { orderScopeId, persistProductOrder, ProductOrderError, sortCustomProducts, type OrderInput } from "@/lib/product-order";

type CategoryRow = { id: string; parentId: string | null; name: string; slug: string; isActive: boolean };
export function orderMemberCategoryIds(categories: CategoryRow[], categoryId: string | null) {
  if (!categoryId) return null;
  if (!categories.some(category => category.id === categoryId)) throw new ProductOrderError("La categoría ya no existe.", 404);
  return descendantCategoryIds(categories, categoryId);
}

function missingOrderMigration(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

export async function getCustomOrderEntriesRepository(categoryId: string | null) {
  if (DEMO_MODE || !DATABASE_ENABLED) return [];
  try {
    return await prisma.catalogProductOrder.findMany({ where: { scopeId: orderScopeId(categoryId) }, select: { productId: true, position: true } });
  } catch (error) {
    // The public catalog remains readable before the additive migration is authorized.
    if (missingOrderMigration(error)) return [];
    throw error;
  }
}

export async function getProductOrderingRepository(categoryId: string | null) {
  const categories = DEMO_MODE ? demoCategories : DATABASE_ENABLED ? await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }) : [];
  const ids = orderMemberCategoryIds(categories, categoryId);
  const products = DEMO_MODE ? demoProducts.filter(product => !ids || ids.includes(product.categoryId)) : DATABASE_ENABLED ? await prisma.product.findMany({
    where: ids ? { categoryId: { in: ids } } : undefined,
    select: { id: true, name: true, sku: true, isActive: true, createdAt: true, images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 1, select: { url: true } } },
  }) : [];
  let version = 0, available = DATABASE_ENABLED || DEMO_MODE;
  let entries: { productId: string; position: number }[] = [];
  if (!DEMO_MODE && DATABASE_ENABLED) {
    try {
      const scope = await prisma.catalogOrderScope.findUnique({ where: { id: orderScopeId(categoryId) }, include: { items: true } });
      version = scope?.version || 0; entries = scope?.items || [];
    } catch (error) {
      if (!missingOrderMigration(error)) throw error;
      available = false;
    }
  }
  return {
    categories: categories.map(({ id, parentId, name, slug, isActive }) => ({ id, parentId, name, slug, isActive })),
    products: sortCustomProducts(products, entries).map(product => ({ id: product.id, name: product.name, sku: product.sku, isActive: product.isActive, imageUrl: product.images[0]?.url || "/placeholder-product.svg" })),
    version, available,
  };
}

export async function saveProductOrderRepository(input: OrderInput) {
  if (DEMO_MODE || !DATABASE_ENABLED) throw new ProductOrderError("Modo demo: los cambios de orden no se guardan en la base.");
  try {
    return await prisma.$transaction(async tx => persistProductOrder({
      getMemberIds: async categoryId => {
        const categories = await tx.category.findMany();
        const ids = orderMemberCategoryIds(categories, categoryId);
        return (await tx.product.findMany({ where: ids ? { categoryId: { in: ids } } : undefined, select: { id: true } })).map(product => product.id);
      },
      ensureScope: async (id, categoryId) => { await tx.catalogOrderScope.upsert({ where: { id }, create: { id, categoryId }, update: {} }); },
      advanceVersion: async (id, version) => (await tx.catalogOrderScope.updateMany({ where: { id, version }, data: { version: { increment: 1 } } })).count === 1,
      replacePositions: async (scopeId, productIds) => {
        await tx.catalogProductOrder.deleteMany({ where: { scopeId } });
        if (productIds.length) await tx.catalogProductOrder.createMany({ data: productIds.map((productId, position) => ({ scopeId, productId, position })) });
      },
    }, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
  } catch (error) {
    if (missingOrderMigration(error)) throw new ProductOrderError("Falta aplicar la migración de ordenación. No se guardó ningún cambio.", 503);
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002", "P2003"].includes(error.code)) throw new ProductOrderError("El catálogo cambió mientras guardabas. Recarga y vuelve a intentarlo.", 409);
    throw error;
  }
}
