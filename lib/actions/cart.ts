"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEntry } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import {
  addDemoCartItem,
  clearDemoCartItems,
  getDemoCartProductIdFromItemId,
  getOrCreateCart,
  setDemoCartItemQuantity,
} from "@/lib/cart";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoProductsById } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

type ProductWithTiers = {
  price: { toString(): string };
  priceTiers: Array<{
    minQuantity: number;
    price: { toString(): string };
  }>;
};

function resolveTieredPrice(product: ProductWithTiers, quantity: number) {
  const eligibleTiers = product.priceTiers
    .filter((tier) => tier.minQuantity <= quantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);

  return Number((eligibleTiers[0]?.price ?? product.price).toString());
}

function appendSearchParam(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${pathname}${pathname.includes("?") ? "&" : "?"}${searchParams.toString()}`;
}

export async function addToCartAction(formData: FormData) {
  if (DEMO_MODE) {
    const productId = String(formData.get("productId") ?? "");
    const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
    const product = demoProductsById.get(productId);

    if (!product || !product.isActive) {
      redirect("/catalogo?error=producto-invalido");
    }

    await addDemoCartItem(productId, quantity);
    revalidatePath("/carrito");
    revalidatePath("/checkout");
    redirect("/carrito?added=1&demo=1");
  }

  if (!DATABASE_ENABLED) {
    redirect("/carrito?error=configuracion");
  }

  const productId = String(formData.get("productId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));

  const [user, product] = await Promise.all([
    getCurrentUser(),
    prisma.product.findUnique({
      where: { id: productId },
      include: { priceTiers: true },
    }),
  ]);

  if (!product || !product.isActive) {
    redirect("/catalogo?error=producto-invalido");
  }

  const cart = await getOrCreateCart(user?.id);
  const existing = cart.items.find((item) => item.productId === product.id);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  const unitPrice = resolveTieredPrice(product, nextQuantity);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: nextQuantity,
        unitPrice,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        unitPrice,
      },
    });
  }

  revalidatePath("/carrito");
  revalidatePath("/checkout");
  redirect("/carrito?added=1");
}

export async function updateCartItemAction(formData: FormData) {
  if (DEMO_MODE) {
    const itemId = String(formData.get("itemId") ?? "");
    const quantity = Math.max(0, Number(formData.get("quantity") ?? 0));

    await setDemoCartItemQuantity(getDemoCartProductIdFromItemId(itemId), quantity);
    revalidatePath("/carrito");
    revalidatePath("/checkout");
    redirect("/carrito?demo=1");
  }

  if (!DATABASE_ENABLED) {
    redirect("/carrito?error=configuracion");
  }

  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.max(0, Number(formData.get("quantity") ?? 0));

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: { include: { priceTiers: true } } },
  });

  if (!item) {
    redirect("/carrito");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    const unitPrice = resolveTieredPrice(item.product, quantity);
    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity,
        unitPrice,
      },
    });
  }

  revalidatePath("/carrito");
  revalidatePath("/checkout");
  redirect("/carrito");
}

export async function removeCartItemAction(formData: FormData) {
  if (DEMO_MODE) {
    const itemId = String(formData.get("itemId") ?? "");
    await setDemoCartItemQuantity(getDemoCartProductIdFromItemId(itemId), 0);
    revalidatePath("/carrito");
    revalidatePath("/checkout");
    redirect("/carrito?demo=1");
  }

  if (!DATABASE_ENABLED) {
    redirect("/carrito?error=configuracion");
  }

  const itemId = String(formData.get("itemId") ?? "");
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  redirect("/carrito");
}

export async function clearCartAction() {
  if (DEMO_MODE) {
    await clearDemoCartItems();
    revalidatePath("/carrito");
    revalidatePath("/checkout");
    redirect("/carrito?demo=1");
  }

  if (!DATABASE_ENABLED) {
    redirect("/carrito?error=configuracion");
  }

  const user = await getCurrentUser();
  const cart = await getOrCreateCart(user?.id);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  redirect("/carrito");
}

export async function uploadTransferReceiptAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reference = String(formData.get("reference") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? `/checkout?orden=${orderNumber}`);
  const receipt = formData.get("receipt");

  if (DEMO_MODE) {
    redirect(appendSearchParam(redirectTo, { receipt: "1", demo: "1" }));
  }

  if (!DATABASE_ENABLED) {
    redirect(appendSearchParam(redirectTo, { receiptError: "1" }));
  }

  if (!(receipt instanceof File) || receipt.size === 0) {
    redirect(`${redirectTo}&receiptError=1`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payment: true },
  });

  if (!order?.payment) {
    redirect(`${redirectTo}&receiptError=1`);
  }

  const extension = receipt.name.split(".").pop()?.toLowerCase() || "bin";
  const fileName = `${orderNumber}-${Date.now()}.${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");

  await mkdir(uploadsDir, { recursive: true });
  const fileBuffer = Buffer.from(await receipt.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), fileBuffer);

  await prisma.$transaction([
    prisma.transferPayment.update({
      where: { orderId: order.id },
      data: {
        receiptUrl: `/uploads/receipts/${fileName}`,
        reference: reference || orderNumber,
        status: "IN_REVIEW",
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "RECEIPT_UPLOADED" },
    }),
  ]);

  await logAuditEntry({
    action: "TRANSFER_RECEIPT_UPLOADED",
    entity: "order",
    entityId: order.id,
    metadata: { orderNumber },
  });

  revalidatePath("/admin/pagos");
  revalidatePath(`/mis-pedidos/${orderNumber}`);
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}receipt=1`);
}
