import { BANK_SETTING_KEYS, TAX_RATE } from "@/lib/constants";
import { getHomepageDataRepository, getPublicNavigationDataRepository } from "@/lib/repositories/catalog";
import { getOrderDetailsRepository } from "@/lib/repositories/orders";
import { getBankSettingsRepository, getSiteSettingsMapRepository } from "@/lib/repositories/settings";

export const DEFAULT_PUBLIC_CONTACT = {
  brandName: "Acavike",
  tagline: "Catalogo industrial B2B para compras directas y cotizacion por volumen.",
  supportPhone: "+52 81 3082 2452",
  supportEmail: "ventas@acavike.com",
  companyAddress: "Allende, Nuevo Leon, Mexico",
  supportHours: "Lun-Vie 8:00 - 18:00",
  whatsappPhone: "+52 81 3082 2452",
};

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function calculateTaxes(subtotal: number, discount = 0) {
  const taxableBase = Math.max(subtotal - discount, 0);
  const tax = Number((taxableBase * TAX_RATE).toFixed(2));
  const total = Number((taxableBase + tax).toFixed(2));

  return { tax, total };
}

export async function getSiteSettingsMap() {
  return getSiteSettingsMapRepository();
}

export function getPublicContactDetails(settings: Record<string, string>) {
  const supportPhone = settings[BANK_SETTING_KEYS.supportPhone]?.trim() || DEFAULT_PUBLIC_CONTACT.supportPhone;
  const supportEmail = settings[BANK_SETTING_KEYS.supportEmail]?.trim() || DEFAULT_PUBLIC_CONTACT.supportEmail;
  const companyAddress =
    settings[BANK_SETTING_KEYS.companyAddress]?.trim() || DEFAULT_PUBLIC_CONTACT.companyAddress;
  const supportHours = settings[BANK_SETTING_KEYS.supportHours]?.trim() || DEFAULT_PUBLIC_CONTACT.supportHours;
  const whatsappPhone = settings[BANK_SETTING_KEYS.whatsappPhone]?.trim() || supportPhone;
  const whatsappDigits = normalizePhoneDigits(whatsappPhone);

  return {
    ...DEFAULT_PUBLIC_CONTACT,
    supportPhone,
    supportEmail,
    companyAddress,
    supportHours,
    whatsappPhone,
    whatsappHref: whatsappDigits
      ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hola Acavike, necesito una cotizacion.")}`
      : "/contacto",
  };
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
