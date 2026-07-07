import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import {
  demoMessages,
  demoOrders,
  demoOrdersById,
  demoOrdersByNumber,
  demoPayments,
  demoProducts,
  demoQuotes,
  demoQuotesById,
} from "@/lib/demo-data";

export async function getOrderDetailsRepository(orderNumber: string) {
  if (DEMO_MODE) {
    return demoOrdersByNumber.get(orderNumber) || null;
  }

  if (!DATABASE_ENABLED) {
    return null;
  }

  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      customer: true,
      payment: true,
    },
  });
}

export async function listAdminOrdersRepository() {
  if (DEMO_MODE) {
    return [...demoOrders].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.order.findMany({
    include: {
      customer: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminOrderByIdRepository(id: string) {
  if (DEMO_MODE) {
    return demoOrdersById.get(id) || null;
  }

  if (!DATABASE_ENABLED) {
    return null;
  }

  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      payment: {
        include: {
          reviewedBy: true,
        },
      },
    },
  });
}

export async function listAdminPaymentsRepository() {
  if (DEMO_MODE) {
    return demoPayments;
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.transferPayment.findMany({
    include: {
      reviewedBy: true,
      order: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminQuotesRepository() {
  if (DEMO_MODE) {
    return [...demoQuotes].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.quote.findMany({
    include: {
      customer: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminQuoteByIdRepository(id: string) {
  if (DEMO_MODE) {
    return demoQuotesById.get(id) || null;
  }

  if (!DATABASE_ENABLED) {
    return null;
  }

  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  });
}

export async function listAdminMessagesRepository() {
  if (DEMO_MODE) {
    return [...demoMessages].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteEditorSupportRepository() {
  if (DEMO_MODE) {
    return {
      products: demoProducts.slice(0, 10),
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      products: [],
    };
  }

  return {
    products: await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 10,
    }),
  };
}
