import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import {
  demoAuditLogs,
  demoCustomers,
  demoOrders,
  demoPayments,
  demoProducts,
  demoQuotes,
  demoUsers,
} from "@/lib/demo-data";

export async function getAdminDashboardRepository() {
  if (DEMO_MODE) {
    const totalSales = demoOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const orderCount = demoOrders.length;
    const avgTicket = orderCount ? totalSales / orderCount : 0;
    const lowStockProducts = demoProducts.filter((product) => product.stock <= product.lowStockThreshold);

    return {
      orderMetrics: {
        _sum: { total: totalSales },
        _count: { _all: orderCount },
        _avg: { total: avgTicket },
      },
      customersCount: demoCustomers.length,
      openQuotesCount: demoQuotes.filter((quote) => ["DRAFT", "SENT"].includes(quote.status)).length,
      pendingOrdersCount: demoOrders.filter((order) =>
        ["PENDING_TRANSFER", "RECEIPT_UPLOADED", "PAYMENT_APPROVED", "TO_PICK", "WAITING_STOCK"].includes(order.status),
      ).length,
      pendingTransfersCount: demoPayments.filter((payment) => ["PENDING", "IN_REVIEW"].includes(payment.status)).length,
      products: [...demoProducts].sort((left, right) => left.stock - right.stock),
      recentOrders: [...demoOrders].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 5),
      recentQuotes: [...demoQuotes].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 5),
      lowStockProducts,
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      orderMetrics: {
        _sum: { total: 0 },
        _count: { _all: 0 },
        _avg: { total: 0 },
      },
      customersCount: 0,
      openQuotesCount: 0,
      pendingOrdersCount: 0,
      pendingTransfersCount: 0,
      products: [],
      recentOrders: [],
      recentQuotes: [],
      lowStockProducts: [],
    };
  }

  const [orderMetrics, customersCount, openQuotesCount, pendingOrdersCount, pendingTransfersCount, products, recentOrders, recentQuotes] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        _avg: { total: true },
      }),
      prisma.customer.count(),
      prisma.quote.count({
        where: { status: { in: ["DRAFT", "SENT"] } },
      }),
      prisma.order.count({
        where: { status: { in: ["PENDING_TRANSFER", "RECEIPT_UPLOADED", "PAYMENT_APPROVED", "TO_PICK", "WAITING_STOCK"] } },
      }),
      prisma.transferPayment.count({
        where: { status: { in: ["PENDING", "IN_REVIEW"] } },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { stock: "asc" },
      }),
      prisma.order.findMany({
        include: { customer: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.quote.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);

  return {
    orderMetrics,
    customersCount,
    openQuotesCount,
    pendingOrdersCount,
    pendingTransfersCount,
    products,
    recentOrders,
    recentQuotes,
    lowStockProducts,
  };
}

export async function getAdminAnalyticsRepository() {
  if (DEMO_MODE) {
    const ordersByStatus = Object.values(
      demoOrders.reduce<Record<string, { status: string; _count: { _all: number }; _sum: { total: number } }>>((acc, order) => {
        if (!acc[order.status]) {
          acc[order.status] = {
            status: order.status,
            _count: { _all: 0 },
            _sum: { total: 0 },
          };
        }

        acc[order.status]._count._all += 1;
        acc[order.status]._sum.total += Number(order.total);
        return acc;
      }, {}),
    );

    const quotesByStatus = Object.values(
      demoQuotes.reduce<Record<string, { status: string; _count: { _all: number }; _sum: { total: number } }>>((acc, quote) => {
        if (!acc[quote.status]) {
          acc[quote.status] = {
            status: quote.status,
            _count: { _all: 0 },
            _sum: { total: 0 },
          };
        }

        acc[quote.status]._count._all += 1;
        acc[quote.status]._sum.total += Number(quote.total);
        return acc;
      }, {}),
    );

    const orderItemsMap = new Map<
      string,
      { productId: string; sku: string; name: string; _sum: { quantity: number; total: number } }
    >();

    for (const order of demoOrders) {
      for (const item of order.items) {
        const key = `${item.productId}-${item.sku}`;
        const current = orderItemsMap.get(key) || {
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          _sum: { quantity: 0, total: 0 },
        };

        current._sum.quantity += item.quantity;
        current._sum.total += Number(item.total);
        orderItemsMap.set(key, current);
      }
    }

    const categories = demoProducts.reduce<Record<string, { id: string; name: string; slug: string; _count: { products: number } }>>(
      (acc, product) => {
        if (!acc[product.categoryId]) {
          acc[product.categoryId] = {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            _count: { products: 0 },
          };
        }

        acc[product.categoryId]._count.products += 1;
        return acc;
      },
      {},
    );

    return {
      ordersByStatus,
      quotesByStatus,
      orderItems: [...orderItemsMap.values()].sort((left, right) => right._sum.total - left._sum.total).slice(0, 8),
      categories: Object.values(categories),
      auditLogs: demoAuditLogs
        .map((log) => ({
          ...log,
          user: demoUsers.find((user) => user.id === log.userId) || null,
        }))
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .slice(0, 8),
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      ordersByStatus: [],
      quotesByStatus: [],
      orderItems: [],
      categories: [],
      auditLogs: [],
    };
  }

  const [ordersByStatus, quotesByStatus, orderItems, categories, auditLogs] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.quote.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "sku", "name"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { ordersByStatus, quotesByStatus, orderItems, categories, auditLogs };
}

export async function listAdminUsersRepository() {
  if (DEMO_MODE) {
    return demoUsers.map((user) => ({
      ...user,
      customer: demoCustomers.find((customer) => customer.userId === user.id) || null,
    }));
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.user.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}
