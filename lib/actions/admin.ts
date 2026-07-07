"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";
import { ADMIN_ROLES, ORDER_ROLES, QUOTE_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getBankSettings, makeOrderNumber, makeQuoteNumber } from "@/lib/site";
import { parseCheckbox, parseLines, slugify, toNumber, toStringValue } from "@/lib/utils";

function redirectWithMessage(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  redirect(`${path}?${searchParams.toString()}`);
}

function parseImageLines(value: string) {
  return parseLines(value).map((line, index) => {
    const [url, alt] = line.split("|").map((part) => part.trim());
    return {
      url,
      alt: alt || null,
      sortOrder: index,
    };
  });
}

function parseTierLines(value: string) {
  return parseLines(value)
    .map((line) => {
      const [minQuantity, price] = line.split("|").map((part) => part.trim());
      const quantity = Number(minQuantity);
      const parsedPrice = Number(price);

      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return null;
      }

      return {
        minQuantity: quantity,
        price: parsedPrice,
      };
    })
    .filter(Boolean) as Array<{ minQuantity: number; price: number }>;
}

function parseQuoteItems(value: string) {
  return parseLines(value)
    .map((line) => {
      const [sku, name, quantityValue, priceValue, productId] = line.split("|").map((part) => part.trim());
      const quantity = Number(quantityValue);
      const unitPrice = Number(priceValue);

      if (!name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
        return null;
      }

      return {
        productId: productId || null,
        sku: sku || null,
        name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    })
    .filter(Boolean) as Array<{
      productId: string | null;
      sku: string | null;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
}

export async function saveCategoryAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const categoryId = toStringValue(formData.get("categoryId"));
  const name = toStringValue(formData.get("name"));

  if (!name) {
    redirectWithMessage(categoryId ? `/admin/categorias/${categoryId}` : "/admin/categorias/nueva", {
      error: "El nombre de la categoría es obligatorio.",
    });
  }

  const slug = toStringValue(formData.get("slug")) || slugify(name);
  const parentId = toStringValue(formData.get("parentId"));

  if (categoryId && parentId === categoryId) {
    redirectWithMessage(`/admin/categorias/${categoryId}`, {
      error: "Una categoría no puede depender de sí misma.",
    });
  }

  const data = {
    name,
    slug,
    description: toStringValue(formData.get("description")) || null,
    imageUrl: toStringValue(formData.get("imageUrl")) || null,
    parentId: parentId || null,
    sortOrder: toNumber(formData.get("sortOrder")),
    isActive: parseCheckbox(formData.get("isActive")),
  };

  const category = categoryId
    ? await prisma.category.update({
        where: { id: categoryId },
        data,
      })
    : await prisma.category.create({ data });

  await logAuditEntry({
    userId: user.id,
    action: categoryId ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
    entity: "category",
    entityId: category.id,
  });

  revalidatePath("/catalogo");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?saved=1");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const categoryId = toStringValue(formData.get("categoryId"));

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { products: true, children: true },
  });

  if (!category) {
    redirect("/admin/categorias");
  }

  if (category.products.length || category.children.length) {
    redirectWithMessage("/admin/categorias", {
      error: "No puedes eliminar una categoría con productos o subcategorías asociadas.",
    });
  }

  await prisma.category.delete({ where: { id: category.id } });
  await logAuditEntry({
    userId: user.id,
    action: "CATEGORY_DELETED",
    entity: "category",
    entityId: category.id,
  });
  revalidatePath("/catalogo");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?deleted=1");
}

export async function saveProductAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const productId = toStringValue(formData.get("productId"));
  const name = toStringValue(formData.get("name"));
  const sku = toStringValue(formData.get("sku"));
  const categoryId = toStringValue(formData.get("categoryId"));

  if (!name || !sku || !categoryId) {
    redirectWithMessage(productId ? `/admin/productos/${productId}` : "/admin/productos/nuevo", {
      error: "Nombre, SKU y categoría son obligatorios.",
    });
  }

  const slug = toStringValue(formData.get("slug")) || slugify(name);
  const images = parseImageLines(toStringValue(formData.get("imagesText")) || "/placeholder-product.svg");
  const tiers = parseTierLines(toStringValue(formData.get("tiersText")));

  const productData = {
    name,
    slug,
    sku,
    brand: toStringValue(formData.get("brand")) || null,
    shortDescription: toStringValue(formData.get("shortDescription")) || null,
    description: toStringValue(formData.get("description")) || null,
    categoryId,
    price: toNumber(formData.get("price")),
    unit: toStringValue(formData.get("unit")) || "pieza",
    stock: Math.max(0, toNumber(formData.get("stock"))),
    lowStockThreshold: Math.max(0, toNumber(formData.get("lowStockThreshold"), 5)),
    leadTimeText: toStringValue(formData.get("leadTimeText")) || null,
    isActive: parseCheckbox(formData.get("isActive")),
    isFeatured: parseCheckbox(formData.get("isFeatured")),
  };

  const product = productId
    ? await prisma.product.update({
        where: { id: productId },
        data: {
          ...productData,
          images: {
            deleteMany: {},
            create: images,
          },
          priceTiers: {
            deleteMany: {},
            create: tiers,
          },
        },
      })
    : await prisma.product.create({
        data: {
          ...productData,
          images: {
            create: images,
          },
          priceTiers: {
            create: tiers,
          },
        },
      });

  await logAuditEntry({
    userId: user.id,
    action: productId ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
    entity: "product",
    entityId: product.id,
  });

  revalidatePath("/catalogo");
  revalidatePath(`/producto/${product.slug}`);
  revalidatePath("/admin/productos");
  redirect("/admin/productos?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const productId = toStringValue(formData.get("productId"));

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    redirect("/admin/productos");
  }

  await prisma.product.delete({ where: { id: product.id } });
  await logAuditEntry({
    userId: user.id,
    action: "PRODUCT_DELETED",
    entity: "product",
    entityId: product.id,
  });
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");
  redirect("/admin/productos?deleted=1");
}

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requireUser(ORDER_ROLES);
  const orderId = toStringValue(formData.get("orderId"));
  const status = toStringValue(formData.get("status"));

  const allowedForWarehouse = ["TO_PICK", "WAITING_STOCK", "SHIPPED", "DELIVERED"];
  if (user.role === "WAREHOUSE" && !allowedForWarehouse.includes(status)) {
    redirectWithMessage(`/admin/pedidos/${orderId}`, {
      error: "Tu rol solo puede actualizar estados operativos.",
    });
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as never },
  });

  await logAuditEntry({
    userId: user.id,
    action: "ORDER_STATUS_UPDATED",
    entity: "order",
    entityId: order.id,
    metadata: { status },
  });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${order.id}`);
  redirect(`/admin/pedidos/${order.id}?saved=1`);
}

export async function reviewTransferPaymentAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const paymentId = toStringValue(formData.get("paymentId"));
  const status = toStringValue(formData.get("status"));
  const adminNotes = toStringValue(formData.get("adminNotes"));

  const payment = await prisma.transferPayment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    redirect("/admin/pagos");
  }

  const orderStatus = status === "APPROVED" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED";

  await prisma.$transaction([
    prisma.transferPayment.update({
      where: { id: payment.id },
      data: {
        status: status as never,
        adminNotes: adminNotes || null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: orderStatus as never },
    }),
  ]);

  await logAuditEntry({
    userId: user.id,
    action: "TRANSFER_REVIEWED",
    entity: "payment",
    entityId: payment.id,
    metadata: { status, orderNumber: payment.order.orderNumber },
  });
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/pedidos");
  redirect("/admin/pagos?saved=1");
}

export async function saveQuoteAction(formData: FormData) {
  const user = await requireUser(QUOTE_ROLES);
  const quoteId = toStringValue(formData.get("quoteId"));
  const customerId = toStringValue(formData.get("customerId"));
  const items = parseQuoteItems(toStringValue(formData.get("itemsText")));

  if (!customerId || !items.length) {
    redirectWithMessage(quoteId ? `/admin/cotizaciones/${quoteId}` : "/admin/cotizaciones/nueva", {
      error: "Selecciona un cliente y agrega al menos una partida válida.",
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = Number((subtotal * 0.16).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const validUntil = toStringValue(formData.get("validUntil"));

  const data = {
    customerId,
    status: (toStringValue(formData.get("status")) || "DRAFT") as never,
    subtotal,
    tax,
    total,
    validUntil: validUntil ? new Date(validUntil) : null,
    notes: toStringValue(formData.get("notes")) || null,
  };

  const quote = quoteId
    ? await prisma.quote.update({
        where: { id: quoteId },
        data: {
          ...data,
          items: {
            deleteMany: {},
            create: items,
          },
        },
      })
    : await prisma.quote.create({
        data: {
          ...data,
          quoteNumber: makeQuoteNumber(),
          items: {
            create: items,
          },
        },
      });

  await logAuditEntry({
    userId: user.id,
    action: quoteId ? "QUOTE_UPDATED" : "QUOTE_CREATED",
    entity: "quote",
    entityId: quote.id,
    metadata: { status: data.status },
  });
  revalidatePath("/admin/cotizaciones");
  redirect("/admin/cotizaciones?saved=1");
}

export async function updateQuoteStatusAction(formData: FormData) {
  const user = await requireUser(QUOTE_ROLES);
  const quoteId = toStringValue(formData.get("quoteId"));
  const status = toStringValue(formData.get("status"));

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: status as never },
  });

  await logAuditEntry({
    userId: user.id,
    action: "QUOTE_STATUS_UPDATED",
    entity: "quote",
    entityId: quoteId,
    metadata: { status },
  });
  revalidatePath("/admin/cotizaciones");
  redirect("/admin/cotizaciones?saved=1");
}

export async function convertQuoteToOrderAction(formData: FormData) {
  const user = await requireUser(QUOTE_ROLES);
  const quoteId = toStringValue(formData.get("quoteId"));
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, customer: true },
  });

  if (!quote || !quote.items.length) {
    redirectWithMessage("/admin/cotizaciones", {
      error: "No fue posible convertir la cotización seleccionada.",
    });
  }

  const sourceQuote = quote!;

  const bankSettings = await getBankSettings();

  const order = await prisma.$transaction(async (tx) => {
    const fallbackProduct = await tx.product.findFirst({
      select: { id: true },
    });

    if (!fallbackProduct) {
      throw new Error("No hay productos disponibles para convertir la cotización.");
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        customerId: sourceQuote.customerId,
        status: "PENDING_TRANSFER",
        subtotal: sourceQuote.subtotal,
        tax: sourceQuote.tax,
        total: sourceQuote.total,
        deliveryMethod: "Pendiente de definir",
        deliveryAddress: sourceQuote.customer.address ?? "Dirección por confirmar",
        notes: `Pedido convertido desde cotización ${sourceQuote.quoteNumber}.`,
        items: {
          create: sourceQuote.items.map((item) => ({
            productId: item.productId ?? fallbackProduct.id,
            sku: item.sku ?? "SIN-SKU",
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
        payment: {
          create: {
            bankName: bankSettings.bankName,
            beneficiary: bankSettings.beneficiary,
            clabe: bankSettings.clabe,
            reference: sourceQuote.quoteNumber,
            status: "PENDING",
          },
        },
      },
    });

    await tx.quote.update({
      where: { id: sourceQuote.id },
      data: { status: "CONVERTED" },
    });

    return createdOrder;
  });

  await logAuditEntry({
    userId: user.id,
    action: "QUOTE_CONVERTED",
    entity: "quote",
    entityId: sourceQuote.id,
    metadata: { orderNumber: order.orderNumber },
  });
  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/pedidos");
  redirect(`/admin/pedidos/${order.id}?converted=1`);
}

export async function saveCouponAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const couponId = toStringValue(formData.get("couponId"));
  const data = {
    code: toStringValue(formData.get("code")).toUpperCase(),
    description: toStringValue(formData.get("description")) || null,
    type: (toStringValue(formData.get("type")) || "PERCENTAGE") as never,
    amount: toNumber(formData.get("amount")),
    isActive: parseCheckbox(formData.get("isActive")),
    startsAt: toStringValue(formData.get("startsAt")) ? new Date(toStringValue(formData.get("startsAt"))) : null,
    endsAt: toStringValue(formData.get("endsAt")) ? new Date(toStringValue(formData.get("endsAt"))) : null,
    usageLimit: toStringValue(formData.get("usageLimit")) ? toNumber(formData.get("usageLimit")) : null,
  };

  if (!data.code || !data.amount) {
    redirectWithMessage(couponId ? `/admin/cupones/${couponId}` : "/admin/cupones/nuevo", {
      error: "Código y monto son obligatorios.",
    });
  }

  const coupon = couponId
    ? await prisma.coupon.update({ where: { id: couponId }, data })
    : await prisma.coupon.create({ data });

  await logAuditEntry({
    userId: user.id,
    action: couponId ? "COUPON_UPDATED" : "COUPON_CREATED",
    entity: "coupon",
    entityId: coupon.id,
  });
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones?saved=1");
}

export async function deleteCouponAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const couponId = toStringValue(formData.get("couponId"));
  await prisma.coupon.delete({ where: { id: couponId } }).catch(() => null);
  await logAuditEntry({
    userId: user.id,
    action: "COUPON_DELETED",
    entity: "coupon",
    entityId: couponId,
  });
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones?deleted=1");
}

export async function saveEmailTemplateAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const templateId = toStringValue(formData.get("templateId"));
  const key = toStringValue(formData.get("key"));

  if (!key) {
    redirectWithMessage(templateId ? `/admin/email-templates/${templateId}` : "/admin/email-templates", {
      error: "La clave interna es obligatoria.",
    });
  }

  const data = {
    key,
    name: toStringValue(formData.get("name")),
    subject: toStringValue(formData.get("subject")),
    body: toStringValue(formData.get("body")),
    isActive: parseCheckbox(formData.get("isActive")),
  };

  const template = templateId
    ? await prisma.emailTemplate.update({ where: { id: templateId }, data })
    : await prisma.emailTemplate.create({ data });

  await logAuditEntry({
    userId: user.id,
    action: templateId ? "EMAIL_TEMPLATE_UPDATED" : "EMAIL_TEMPLATE_CREATED",
    entity: "email_template",
    entityId: template.id,
  });
  revalidatePath("/admin/email-templates");
  redirect("/admin/email-templates?saved=1");
}

export async function updateSiteSectionAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const sectionId = toStringValue(formData.get("sectionId"));

  const section = await prisma.siteSection.update({
    where: { id: sectionId },
    data: {
      title: toStringValue(formData.get("title")),
      subtitle: toStringValue(formData.get("subtitle")) || null,
      body: toStringValue(formData.get("body")) || null,
      imageUrl: toStringValue(formData.get("imageUrl")) || null,
      buttonText: toStringValue(formData.get("buttonText")) || null,
      buttonHref: toStringValue(formData.get("buttonHref")) || null,
      isActive: parseCheckbox(formData.get("isActive")),
      sortOrder: toNumber(formData.get("sortOrder")),
    },
  });

  await logAuditEntry({
    userId: user.id,
    action: "SITE_SECTION_UPDATED",
    entity: "site_section",
    entityId: section.id,
  });
  revalidatePath("/");
  revalidatePath("/admin/contenido");
  redirect("/admin/contenido?saved=1");
}

export async function updateSiteSettingAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const key = toStringValue(formData.get("key"));
  const value = toStringValue(formData.get("value"));

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  await logAuditEntry({
    userId: user.id,
    action: "SITE_SETTING_UPDATED",
    entity: "site_setting",
    entityId: key,
  });
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function updateUserRoleAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const userId = toStringValue(formData.get("userId"));
  const role = toStringValue(formData.get("role"));

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as never },
  });

  await logAuditEntry({
    userId: user.id,
    action: "USER_ROLE_UPDATED",
    entity: "user",
    entityId: userId,
    metadata: { role },
  });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?saved=1");
}

export async function updateMessageStatusAction(formData: FormData) {
  const user = await requireUser(ADMIN_ROLES);
  const messageId = toStringValue(formData.get("messageId"));
  const status = toStringValue(formData.get("status"));

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: { status: status as never },
  });

  await logAuditEntry({
    userId: user.id,
    action: "CONTACT_MESSAGE_UPDATED",
    entity: "contact_message",
    entityId: messageId,
    metadata: { status },
  });
  revalidatePath("/admin/mensajes");
  redirect("/admin/mensajes?saved=1");
}
