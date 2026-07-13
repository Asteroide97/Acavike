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

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieLifetime,
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
  const cookieStore = await cookies();
  const normalized = normalizeDemoCartItems(items);

  if (!normalized.length) {
    cookieStore.set(DEMO_CART_COOKIE, "", {
      ...getCookieOptions(),
      maxAge: 0,
    });
    return;
  }

  cookieStore.set(DEMO_CART_COOKIE, JSON.stringify(normalized), getCookieOptions());
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_COOKIE)?.value;

  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(CART_COOKIE, sessionId, getCookieOptions());
  }

  return sessionId;
}

export async function getDemoCartItems() {
  const cookieStore = await cookies();
  return parseDemoCartCookie(cookieStore.get(DEMO_CART_COOKIE)?.value);
}

export async function addDemoCartItem(productId: string, quantity: number) {
  const items = await getDemoCartItems();
  const currentQuantity = items.find((item) => item.productId === productId)?.quantity ?? 0;
  const nextItems = items
    .filter((item) => item.productId !== productId)
    .concat({
      productId,
      quantity: currentQuantity + Math.max(1, Math.floor(quantity)),
    });

  await persistDemoCartItems(nextItems);
}

export async function setDemoCartItemQuantity(productId: string, quantity: number) {
  const items = await getDemoCartItems();
  const nextItems = items
    .filter((item) => item.productId !== productId)
    .concat(
      quantity > 0
        ? {
            productId,
            quantity: Math.max(1, Math.floor(quantity)),
          }
        : [],
    );

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
    const sessionId = await getOrCreateCartSessionId();
    const items = buildDemoCartItems(await getDemoCartItems());

    return {
      ...demoCart,
      sessionId,
      userId: userId ?? demoCart.userId,
      updatedAt: items.length ? new Date() : demoCart.updatedAt,
      items,
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      ...demoCart,
      userId: userId ?? null,
      items: [],
    };
  }

  const sessionId = await getOrCreateCartSessionId();

  let cart = await prisma.cart.findUnique({
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
  });

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
    cart?.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0) ?? 0;
  const tax = subtotal * 0.16;
  const total = Math.max(subtotal + tax - discount, 0);

  return {
    subtotal,
    tax,
    discount,
    total,
    itemsCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  };
}
