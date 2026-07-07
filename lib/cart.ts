import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_COOKIE)?.value;

  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return sessionId;
}

export async function getOrCreateCart(userId?: string) {
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
