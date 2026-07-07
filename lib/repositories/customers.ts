import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCustomers, demoOrders, demoQuotes, demoUsers } from "@/lib/demo-data";

export async function listCustomersRepository() {
  if (DEMO_MODE) {
    return [...demoCustomers]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((customer) => ({
        ...customer,
        user: demoUsers.find((user) => user.id === customer.userId) || null,
        _count: {
          orders: demoOrders.filter((order) => order.customerId === customer.id).length,
          quotes: demoQuotes.filter((quote) => quote.customerId === customer.id).length,
        },
      }));
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.customer.findMany({
    include: {
      user: true,
      _count: {
        select: {
          orders: true,
          quotes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerByIdRepository(id: string) {
  if (DEMO_MODE) {
    const customer = demoCustomers.find((item) => item.id === id);
    if (!customer) {
      return null;
    }

    return {
      ...customer,
      user: demoUsers.find((user) => user.id === customer.userId) || null,
      orders: demoOrders
        .filter((order) => order.customerId === customer.id)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
      quotes: demoQuotes
        .filter((quote) => quote.customerId === customer.id)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    };
  }

  if (!DATABASE_ENABLED) {
    return null;
  }

  return prisma.customer.findUnique({
    where: { id },
    include: {
      user: true,
      orders: {
        include: { payment: true },
        orderBy: { createdAt: "desc" },
      },
      quotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
