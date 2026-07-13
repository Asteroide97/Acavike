import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { CART_COOKIE, DEMO_CART_COOKIE } from "@/lib/constants";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCart, demoProductsById, type DemoProductRecord } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

type DemoCartCookieItem = {
  productId: string;
  quantity: number;
};

const cookieLifetime = 60 * 60 * 24 * 30;
export const SAFE_CART_FALLBACK = {
  items: [],
  itemCount: 0,
  itemsCount: 0,
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
} as const;

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieLifetime,
  };
}

async function getCookieStoreSafe() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

function toSafeInteger(value: unknown, fallback = 0) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeMoney(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSafeCart(userId?: string | null, sessionId?: string | null) {
  return {
    ...demoCart,
    sessionId: sessionId || demoCart.sessionId,
    userId: userId ?? null,
    items: [],
  };
}

function normalizeDemoCartItems(items: DemoCartCookieItem[]) {
  const grouped = new Map<string, number>();

  for (const item of items) {
    if (!demoProductsById.has(item.productId)) {
      continue;
    }

    const quantity = Math.max(0, Math.floor(item.quantity));
    if (!quantity) {
      continue;
    }

    grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + quantity);
  }

  return Array.from(grouped.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function parseDemoCartCookie(value?: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeDemoCartItems(
      parsed.map((item) => ({
        productId: typeof item?.productId === "string" ? item.productId : "",
        quantity: typeof item?.quantity === "number" ? item.quantity : Number(item?.quantity ?? 0),
      })),
    );
  } catch {
    return [];
  }
}

function resolveDemoUnitPrice(product: DemoProductRecord, quantity: number) {
  const eligibleTier = [...product.priceTiers]
    .filter((tier) => tier.minQuantity <= quantity)
    .sort((left, right) => right.minQuantity - left.minQuantity)[0];

  return eligibleTier?.price ?? product.price;
}

function buildDemoCartItems(items: DemoCartCookieItem[]) {
  return normalizeDemoCartItems(items).flatMap((item) => {
    const product = demoProductsById.get(item.productId);

    if (!product || !product.isActive) {
      return [];
    }

    return [
      {
        id: `demo_item_${product.id}`,
        cartId: demoCart.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: resolveDemoUnitPrice(product, item.quantity),
        product,
      },
    ];
  });
}

async function persistDemoCartItems(items: DemoCartCookieItem[]) {
  const cookieStore = await getCookieStoreSafe();
  if (!cookieStore) {
    return;
  }

  const normalized = normalizeDemoCartItems(items);

  if (!normalized.length) {
    try {
      cookieStore.set(DEMO_CART_COOKIE, "", {
        ...getCookieOptions(),
        maxAge: 0,
      });
    } catch {
      return;
    }
    return;
  }

  try {
    cookieStore.set(DEMO_CART_COOKIE, JSON.stringify(normalized), getCookieOptions());
  } catch {
    return;
  }
}

async function readCartSessionId() {
  const cookieStore = await getCookieStoreSafe();
  return cookieStore?.get(CART_COOKIE)?.value ?? null;
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await getCookieStoreSafe();
  let sessionId = cookieStore?.get(CART_COOKIE)?.value ?? null;

  if (!sessionId) {
    sessionId = randomUUID();

    if (cookieStore) {
      try {
        cookieStore.set(CART_COOKIE, sessionId, getCookieOptions());
      } catch {
        return sessionId;
      }
    }
  }

  return sessionId;
}

export async function getDemoCartItems() {
  try {
    const cookieStore = await getCookieStoreSafe();
    return parseDemoCartCookie(cookieStore?.get(DEMO_CART_COOKIE)?.value);
  } catch {
    return [];
  }
}

export async function addDemoCartItem(productId: string, quantity: number) {
  const items = await getDemoCartItems();
  const currentQuantity = items.find((item) => item.productId === productId)?.quantity ?? 0;
  const nextItems = items.filter((item) => item.productId !== productId);

  nextItems.push({
    productId,
    quantity: currentQuantity + Math.max(1, toSafeInteger(quantity, 1)),
  });

  await persistDemoCartItems(nextItems);
}

export async function setDemoCartItemQuantity(productId: string, quantity: number) {
  const items = await getDemoCartItems();
  const nextItems = items.filter((item) => item.productId !== productId);

  if (quantity > 0) {
    nextItems.push({
      productId,
      quantity: Math.max(1, toSafeInteger(quantity, 1)),
    });
  }

  await persistDemoCartItems(nextItems);
}

export async function clearDemoCartItems() {
  await persistDemoCartItems([]);
}

export function getDemoCartProductIdFromItemId(itemId: string) {
  return itemId.startsWith("demo_item_") ? itemId.slice("demo_item_".length) : itemId;
}

export async function getOrCreateCart(userId?: string) {
  if (DEMO_MODE) {
    try {
      const sessionId = (await readCartSessionId()) ?? demoCart.sessionId;
      const items = buildDemoCartItems(await getDemoCartItems());

      return {
        ...buildSafeCart(userId ?? demoCart.userId, sessionId),
        updatedAt: items.length ? new Date() : demoCart.updatedAt,
        items,
      };
    } catch {
      return buildSafeCart(userId ?? demoCart.userId);
    }
  }

  if (!DATABASE_ENABLED) {
    return buildSafeCart(userId);
  }

  const sessionId = await readCartSessionId();
  if (!sessionId) {
    return buildSafeCart(userId);
  }

  const cart = await prisma.cart
    .findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                priceTiers: {
                  orderBy: { minQuantity: "asc" },
                },
              },
            },
          },
        },
      },
    })
    .catch(() => null);

  if (!cart) {
    return buildSafeCart(userId, sessionId);
  }

  if (userId && cart.userId !== userId) {
    const updatedCart = await prisma.cart
      .update({
        where: { id: cart.id },
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                  priceTiers: {
                    orderBy: { minQuantity: "asc" },
                  },
                },
              },
            },
          },
        },
      })
      .catch(() => cart);

    return updatedCart ?? cart;
  }

  return cart;
}

export async function getOrCreateCartForMutation(userId?: string) {
  if (DEMO_MODE) {
    return getOrCreateCart(userId);
  }

  if (!DATABASE_ENABLED) {
    return buildSafeCart(userId);
  }

  const sessionId = await getOrCreateCartSessionId();

  let cart = await prisma.cart
    .findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                priceTiers: {
                  orderBy: { minQuantity: "asc" },
                },
              },
            },
          },
        },
      },
    })
    .catch(() => null);

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        sessionId,
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                priceTiers: {
                  orderBy: { minQuantity: "asc" },
                },
              },
            },
          },
        },
      },
    });
  }

  if (userId && cart.userId !== userId) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                priceTiers: {
                  orderBy: { minQuantity: "asc" },
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

export function getCartTotals(
  cart: Awaited<ReturnType<typeof getOrCreateCart>> | null,
  discount = 0,
) {
  const subtotal =
    cart?.items.reduce((sum, item) => {
      const unitPrice = toSafeMoney(item?.unitPrice, 0);
      const quantity = Math.max(0, toSafeInteger(item?.quantity, 0));
      return sum + unitPrice * quantity;
    }, 0) ?? 0;
  const tax = subtotal * 0.16;
  const total = Math.max(subtotal + tax - discount, 0);
  const itemsCount =
    cart?.items.reduce((sum, item) => sum + Math.max(0, toSafeInteger(item?.quantity, 0)), 0) ?? 0;

  return {
    subtotal: toSafeMoney(subtotal, 0),
    tax: toSafeMoney(tax, 0),
    discount: toSafeMoney(discount, 0),
    total: toSafeMoney(total, 0),
    itemsCount,
  };
}
