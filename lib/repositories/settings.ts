import { prisma } from "@/lib/prisma";
import { BANK_SETTING_KEYS } from "@/lib/constants";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoSiteSections, demoSiteSettings, demoSiteSettingsMap } from "@/lib/demo-data";

export async function getSiteSettingsMapRepository() {
  if (DEMO_MODE) {
    return demoSiteSettingsMap;
  }

  if (!DATABASE_ENABLED) {
    return {};
  }

  const settings = await prisma.siteSetting.findMany();
  return settings.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
}

export async function getBankSettingsRepository() {
  const settings = await getSiteSettingsMapRepository();

  return {
    bankName: settings[BANK_SETTING_KEYS.bankName] ?? "BANCO DEMO",
    beneficiary: settings[BANK_SETTING_KEYS.beneficiary] ?? "ACAVIKE S.A. DE C.V.",
    clabe: settings[BANK_SETTING_KEYS.clabe] ?? "000000000000000000",
    referenceHelp:
      settings[BANK_SETTING_KEYS.referenceHelp] ??
      "Usa tu numero de pedido como referencia bancaria.",
  };
}

export async function getSiteSectionsRepository() {
  if (DEMO_MODE) {
    return demoSiteSections;
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.siteSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllSiteSectionsRepository() {
  if (DEMO_MODE) {
    return demoSiteSections;
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.siteSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllSiteSettingsRepository() {
  if (DEMO_MODE) {
    return demoSiteSettings;
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });
}
