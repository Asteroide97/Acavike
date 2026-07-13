import type { UserRole } from "@prisma/client";

export const TAX_RATE = 0.16;
export const CART_COOKIE = "acavike_cart";
export const DEMO_CART_COOKIE = "acavike_demo_cart";
export const SESSION_COOKIE = "acavike_session";

export const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN"];
export const BACKOFFICE_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "WAREHOUSE", "SALES"];
export const ORDER_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "WAREHOUSE"];
export const QUOTE_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "SALES"];
export const CUSTOMER_ACCOUNT_ROLES: UserRole[] = ["CUSTOMER"];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Administrador",
  WAREHOUSE: "Almacén",
  SALES: "Ventas",
  CUSTOMER: "Cliente",
};

export const ORDER_STATUS_LABELS = {
  PENDING_TRANSFER: "Pendiente de transferencia",
  RECEIPT_UPLOADED: "Comprobante subido",
  PAYMENT_APPROVED: "Pago aprobado",
  PAYMENT_REJECTED: "Pago rechazado",
  TO_PICK: "Listo para surtir",
  WAITING_STOCK: "Esperando stock",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
} as const;

export const TRANSFER_STATUS_LABELS = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
} as const;

export const QUOTE_STATUS_LABELS = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Expirada",
  CONVERTED: "Convertida",
} as const;

export const MESSAGE_STATUS_LABELS = {
  NEW: "Nuevo",
  READ: "Leído",
  CLOSED: "Cerrado",
} as const;

export const CUSTOMER_LEVEL_LABELS = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
} as const;

export const PUBLIC_SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "newest", label: "Más recientes" },
] as const;

export const BANK_SETTING_KEYS = {
  bankName: "bank_name",
  beneficiary: "bank_beneficiary",
  clabe: "bank_clabe",
  referenceHelp: "bank_reference_help",
  supportPhone: "support_phone",
  supportEmail: "support_email",
  companyAddress: "company_address",
  supportHours: "support_hours",
  whatsappPhone: "whatsapp_phone",
};
