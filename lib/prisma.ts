import { PrismaClient } from "@prisma/client";
import { DATABASE_ENABLED } from "@/lib/config";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prismaClient =
  global.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prismaClient;
}

function makeAggregateFallback(selection: Record<string, unknown> | undefined) {
  const result: Record<string, unknown> = {};

  for (const key of ["_sum", "_avg", "_min", "_max"] as const) {
    const block = selection?.[key];
    if (block && typeof block === "object") {
      result[key] = Object.fromEntries(Object.keys(block as Record<string, unknown>).map((field) => [field, 0]));
    }
  }

  const countSelection = selection?._count;
  if (countSelection === true) {
    result._count = 0;
  } else if (countSelection && typeof countSelection === "object") {
    result._count = Object.fromEntries(
      Object.keys(countSelection as Record<string, unknown>).map((field) => [field, 0]),
    );
  }

  return result;
}

function makeModelFallback(method: PropertyKey, args: unknown[]) {
  if (method === "findMany" || method === "groupBy") {
    return [];
  }

  if (method === "findUnique" || method === "findFirst") {
    return null;
  }

  if (method === "count") {
    return 0;
  }

  if (method === "aggregate") {
    return makeAggregateFallback((args[0] || {}) as Record<string, unknown>);
  }

  return null;
}

function makeModelProxy() {
  return new Proxy(
    {},
    {
      get(_target, method: PropertyKey) {
        return async (...args: unknown[]) => makeModelFallback(method, args);
      },
    },
  );
}

const prismaProxy = new Proxy(prismaClient, {
  get(target, property: keyof PrismaClient | string, receiver) {
    if (DATABASE_ENABLED) {
      return Reflect.get(target, property, receiver);
    }

    if (typeof property === "string" && property.startsWith("$")) {
      if (property === "$transaction") {
        return async () => [];
      }

      return async () => null;
    }

    return makeModelProxy();
  },
});

export const prisma = prismaProxy as PrismaClient;
