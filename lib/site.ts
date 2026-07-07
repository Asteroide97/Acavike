import { TAX_RATE } from "@/lib/constants";
import { getHomepageDataRepository, getPublicNavigationDataRepository } from "@/lib/repositories/catalog";
import { getOrderDetailsRepository } from "@/lib/repositories/orders";
import { getBankSettingsRepository, getSiteSettingsMapRepository } from "@/lib/repositories/settings";

export function calculateTaxes(subtotal: number, discount = 0) {
  const taxableBase = Math.max(subtotal - discount, 0);
  const tax = Number((taxableBase * TAX_RATE).toFixed(2));
  const total = Number((taxableBase + tax).toFixed(2));

  return { tax, total };
}

export async function getSiteSettingsMap() {
  return getSiteSettingsMapRepository();
}

export async function getBankSettings() {
  return getBankSettingsRepository();
}

export async function getPublicNavigationData() {
  return getPublicNavigationDataRepository();
}

export async function getHomepageData() {
  return getHomepageDataRepository();
}

export async function getOrderDetails(orderNumber: string) {
  return getOrderDetailsRepository(orderNumber);
}

export function makeOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `PED-${stamp}`;
}

export function makeQuoteNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `COT-${stamp}`;
}
