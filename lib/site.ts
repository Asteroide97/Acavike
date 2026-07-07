import { prisma } from "@/lib/prisma";
import { BANK_SETTING_KEYS, TAX_RATE } from "@/lib/constants";

export function calculateTaxes(subtotal: number, discount = 0) {
  const taxableBase = Math.max(subtotal - discount, 0);
  const tax = Number((taxableBase * TAX_RATE).toFixed(2));
  const total = Number((taxableBase + tax).toFixed(2));

  return { tax, total };
}

export async function getSiteSettingsMap() {
  const settings = await prisma.siteSetting.findMany();
  return settings.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
}

export async function getBankSettings() {
  const settings = await getSiteSettingsMap();
  return {
    bankName: settings[BANK_SETTING_KEYS.bankName] ?? "BANCO DEMO",
    beneficiary: settings[BANK_SETTING_KEYS.beneficiary] ?? "ACAVIKE S.A. DE C.V.",
    clabe: settings[BANK_SETTING_KEYS.clabe] ?? "000000000000000000",
    referenceHelp:
      settings[BANK_SETTING_KEYS.referenceHelp] ??
      "Usa tu número de pedido como referencia bancaria.",
  };
}

export async function getPublicNavigationData() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 10,
    }),
    getSiteSettingsMap(),
  ]);

  return { categories, settings };
}

export async function getHomepageData() {
  const [sections, categories, featuredProducts] = await Promise.all([
    prisma.siteSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        category: true,
        priceTiers: {
          orderBy: { minQuantity: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { sections, categories, featuredProducts };
}

export async function getOrderDetails(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      customer: true,
      payment: true,
    },
  });
}

export function makeOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `PED-${stamp}`;
}

export function makeQuoteNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `COT-${stamp}`;
}
