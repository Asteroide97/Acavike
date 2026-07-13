"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, getCurrentUser } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";
import { getCartTotals, getOrCreateCartForMutation } from "@/lib/cart";
import { DATABASE_CONFIG_ERROR, DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoOrders, demoQuotes } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import { calculateTaxes, getBankSettings, makeOrderNumber, makeQuoteNumber } from "@/lib/site";
import { parseLines } from "@/lib/utils";
import { checkoutSchema, contactSchema, quickQuoteSchema } from "@/lib/validators";

type ContactActionResult =
  | { success: false; error: string }
  | { success: true };

type QuickQuoteActionResult =
  | { success: false; error: string }
  | { success: true; quoteNumber: string };

type CheckoutActionResult =
  | { success: false; error: string }
  | { success: true; orderNumber: string };

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

  const cart = await getOrCreateCartForMutation(user?.id);
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
    redirect("/carrito?demo=1");
  }

  if (!DATABASE_ENABLED) {
    redirect("/carrito?error=configuracion");
  }

  const user = await getCurrentUser();
  const cart = await getOrCreateCartForMutation(user?.id);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  redirect("/carrito");
}

export async function submitContactMessageAction(input: unknown): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "No fue posible enviar el mensaje." };
  }

  if (DEMO_MODE) {
    return { success: true };
  }

  if (!DATABASE_ENABLED) {
    return {
      success: false,
      error: DATABASE_CONFIG_ERROR ?? "La base de datos no esta configurada.",
    };
  }

  await prisma.contactMessage.create({
    data: parsed.data,
  });

  return { success: true };
}

export async function submitQuickQuoteAction(input: unknown): Promise<QuickQuoteActionResult> {
  const parsed = quickQuoteSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "No fue posible registrar la solicitud." };
  }

  if (DEMO_MODE) {
    return { success: true, quoteNumber: demoQuotes[0]?.quoteNumber ?? "COT-DEMO" };
  }

  if (!DATABASE_ENABLED) {
    return {
      success: false,
      error: DATABASE_CONFIG_ERROR ?? "La base de datos no esta configurada.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const requirementLines = parseLines(parsed.data.requirements);

  const customer = await prisma.customer.upsert({
    where: { email },
    update: {
      name: parsed.data.name,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
    },
    create: {
      name: parsed.data.name,
      companyName: parsed.data.companyName,
      email,
      phone: parsed.data.phone,
    },
  });

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: makeQuoteNumber(),
      customerId: customer.id,
      status: "DRAFT",
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: [parsed.data.notes, "Solicitud rápida:", parsed.data.requirements].filter(Boolean).join("\n\n"),
      items: {
        create: requirementLines.map((line) => {
          const [name, qty] = line.split("|").map((part) => part.trim());
          const quantity = Number(qty) > 0 ? Number(qty) : 1;

          return {
            sku: null,
            name: name || line,
            quantity,
            unitPrice: 0,
            total: 0,
          };
        }),
      },
    },
  });

  await logAuditEntry({
    action: "QUICK_QUOTE_CREATED",
    entity: "quote",
    entityId: quote.id,
    metadata: { quoteNumber: quote.quoteNumber, source: "public_form" },
  });

  return { success: true, quoteNumber: quote.quoteNumber };
}

export async function submitCheckoutAction(input: unknown): Promise<CheckoutActionResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "No fue posible procesar el checkout." };
  }

  if (DEMO_MODE) {
    return { success: true, orderNumber: demoOrders[0]?.orderNumber ?? "PED-DEMO" };
  }

  if (!DATABASE_ENABLED) {
    return {
      success: false,
      error: DATABASE_CONFIG_ERROR ?? "La base de datos no esta configurada.",
    };
  }

  const currentUser = await getCurrentUser();
  const cart = await getOrCreateCartForMutation(currentUser?.id);
  const totals = getCartTotals(cart);

  if (!cart.items.length) {
    return { success: false, error: "Tu carrito está vacío." };
  }

  const email = parsed.data.email.toLowerCase();
  const bankSettings = await getBankSettings();

  try {
    const order = await prisma.$transaction(async (tx) => {
      let customerId = currentUser?.customer?.id;

      if (!customerId && parsed.data.createAccount) {
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error("Ya existe una cuenta con este correo. Inicia sesión para continuar.");
        }

        const passwordHash = await hash(parsed.data.password!, 10);
        const createdUser = await tx.user.create({
          data: {
            name: parsed.data.name,
            email,
            passwordHash,
            role: "CUSTOMER",
            customer: {
              create: {
                name: parsed.data.name,
                companyName: parsed.data.companyName,
                rfc: parsed.data.rfc || null,
                email,
                phone: parsed.data.phone,
                address: parsed.data.address,
              },
            },
          },
          include: { customer: true },
        });

        customerId = createdUser.customer?.id;
        await createSession({ id: createdUser.id, role: createdUser.role });
      }

      if (!customerId && currentUser?.customer) {
        const updatedCustomer = await tx.customer.update({
          where: { id: currentUser.customer.id },
          data: {
            name: parsed.data.name,
            companyName: parsed.data.companyName,
            rfc: parsed.data.rfc || null,
            email,
            phone: parsed.data.phone,
            address: parsed.data.address,
          },
        });
        customerId = updatedCustomer.id;
      }

      if (!customerId) {
        const customer = await tx.customer.upsert({
          where: { email },
          update: {
            name: parsed.data.name,
            companyName: parsed.data.companyName,
            rfc: parsed.data.rfc || null,
            phone: parsed.data.phone,
            address: parsed.data.address,
          },
          create: {
            name: parsed.data.name,
            companyName: parsed.data.companyName,
            rfc: parsed.data.rfc || null,
            email,
            phone: parsed.data.phone,
            address: parsed.data.address,
          },
        });
        customerId = customer.id;
      }

      const { tax, total } = calculateTaxes(totals.subtotal, totals.discount);
      const orderNumber = makeOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "PENDING_TRANSFER",
          subtotal: totals.subtotal,
          tax,
          discount: totals.discount,
          total,
          deliveryMethod: parsed.data.deliveryMethod,
          deliveryAddress: parsed.data.address,
          notes: parsed.data.notes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              sku: item.product.sku,
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: Number(item.unitPrice) * item.quantity,
            })),
          },
          payment: {
            create: {
              bankName: bankSettings.bankName,
              beneficiary: bankSettings.beneficiary,
              clabe: bankSettings.clabe,
              reference: orderNumber,
              status: "PENDING",
            },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    await logAuditEntry({
      userId: currentUser?.id,
      action: "ORDER_CREATED",
      entity: "order",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, source: "checkout" },
    });

    revalidatePath("/carrito");
    revalidatePath("/checkout");
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    return { success: true, orderNumber: order.orderNumber };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No fue posible generar el pedido.",
    };
  }
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
