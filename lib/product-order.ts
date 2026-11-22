export const MAX_ORDER_PRODUCTS = 5000;
export const orderScopeId = (categoryId: string | null) => categoryId ? `category:${categoryId}` : "all";

export class ProductOrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type OrderInput = { categoryId: string | null; version: number; productIds: string[] };

export function parseOrderInput(value: unknown): OrderInput {
  if (!value || typeof value !== "object") throw new ProductOrderError("Solicitud no válida.");
  const input = value as Record<string, unknown>;
  const validId = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9_-]{1,100}$/i.test(id);
  if (input.categoryId !== null && !validId(input.categoryId)) throw new ProductOrderError("Selecciona una categoría válida.");
  if (!Number.isSafeInteger(input.version) || Number(input.version) < 0) throw new ProductOrderError("La versión del orden no es válida.");
  if (!Array.isArray(input.productIds) || input.productIds.length > MAX_ORDER_PRODUCTS || !input.productIds.every(validId)) throw new ProductOrderError("La lista de productos no es válida o supera 5000 productos.");
  if (new Set(input.productIds).size !== input.productIds.length) throw new ProductOrderError("La lista contiene productos duplicados.");
  return { categoryId: input.categoryId as string | null, version: Number(input.version), productIds: input.productIds };
}

export function assertOrderMembership(currentIds: string[], requestedIds: string[]) {
  const current = new Set(currentIds);
  if (current.size !== currentIds.length || current.size !== requestedIds.length || new Set(requestedIds).size !== requestedIds.length || requestedIds.some(id => !current.has(id))) {
    throw new ProductOrderError("El catálogo cambió o hay productos fuera de esta categoría. Recarga antes de guardar.", 409);
  }
}

export function sortCustomProducts<T extends { id: string; createdAt: Date }>(products: T[], entries: { productId: string; position: number }[]) {
  const ranks = new Map(entries.map(entry => [entry.productId, entry.position]));
  return [...products].sort((a, b) => {
    const left = ranks.get(a.id), right = ranks.get(b.id);
    if (left !== undefined && right !== undefined) return left - right || a.id.localeCompare(b.id);
    if (left !== undefined) return -1;
    if (right !== undefined) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
  });
}

export function moveOrderedItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const result = [...items]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result;
}

export interface OrderTransaction {
  getMemberIds(categoryId: string | null): Promise<string[]>;
  ensureScope(scopeId: string, categoryId: string | null): Promise<void>;
  advanceVersion(scopeId: string, version: number): Promise<boolean>;
  replacePositions(scopeId: string, ids: string[]): Promise<void>;
}

// The caller supplies a single database transaction; no Product fields are written.
export async function persistProductOrder(tx: OrderTransaction, input: OrderInput) {
  assertOrderMembership(await tx.getMemberIds(input.categoryId), input.productIds);
  const scope = orderScopeId(input.categoryId);
  await tx.ensureScope(scope, input.categoryId);
  if (!await tx.advanceVersion(scope, input.version)) throw new ProductOrderError("Otro administrador guardó cambios. Recarga para ver el orden actual.", 409);
  await tx.replacePositions(scope, input.productIds);
  return { version: input.version + 1 };
}
