import type {
  AuditLog,
  Category,
  ContactMessage,
  Coupon,
  Customer,
  EmailTemplate,
  Order,
  OrderItem,
  PriceTier,
  Product,
  ProductImage,
  Quote,
  QuoteItem,
  SiteSection,
  SiteSetting,
  TransferPayment,
  User,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { BANK_SETTING_KEYS } from "@/lib/constants";
import { demoProductSeeds, type DemoProductSeed } from "@/lib/demo-product-seeds";

const baseDate = new Date("2026-07-07T08:00:00.000Z");
const dayMs = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(baseDate.getTime() - days * dayMs);
}

function money(value: number) {
  return new Prisma.Decimal(value);
}

function toDemoSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DemoViewer = User & { customer?: Customer | null };
export type DemoProductRecord = Product & {
  category: Category;
  images: ProductImage[];
  priceTiers: PriceTier[];
};
export type DemoCartItemRecord = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  product: DemoProductRecord;
};
export type DemoCartRecord = {
  id: string;
  sessionId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: DemoCartItemRecord[];
};
export type DemoOrderRecord = Order & {
  customer: Customer;
  items: OrderItem[];
  payment: TransferPayment | null;
};
export type DemoQuoteRecord = Quote & {
  customer: Customer;
  items: QuoteItem[];
};

export const demoCredentials = {
  "admin@acavike.com": { password: "Admin123!", role: "SUPERADMIN" },
  "manager@acavike.com": { password: "Admin123!", role: "ADMIN" },
  "warehouse@acavike.com": { password: "Admin123!", role: "WAREHOUSE" },
  "ventas@acavike.com": { password: "Admin123!", role: "SALES" },
  "cliente@acavike.com": { password: "Cliente123!", role: "CUSTOMER" },
} as const;

export const demoSiteSettingsMap: Record<string, string> = {
  [BANK_SETTING_KEYS.bankName]: "BANCO DEMO",
  [BANK_SETTING_KEYS.beneficiary]: "ACAVIKE S.A. DE C.V.",
  [BANK_SETTING_KEYS.clabe]: "000000000000000000",
  [BANK_SETTING_KEYS.referenceHelp]: "Usa tu número de pedido como referencia de pago.",
  [BANK_SETTING_KEYS.supportPhone]: "+52 81 3082 2452",
  [BANK_SETTING_KEYS.supportEmail]: "ventas@acavike.com",
  [BANK_SETTING_KEYS.companyAddress]: "Allende, Nuevo León, México",
  [BANK_SETTING_KEYS.supportHours]: "Lun–Vie 8:00–18:00",
  [BANK_SETTING_KEYS.whatsappPhone]: "+52 81 3082 2452",
};

export const demoSiteSettings: SiteSetting[] = Object.entries(demoSiteSettingsMap).map(([key, value], index) => ({
  id: `setting_${index + 1}`,
  key,
  value,
  updatedAt: daysAgo(2),
}));

export const demoSiteSections: SiteSection[] = [
  {
    id: "section_hero",
    key: "hero_home",
    title: "Catálogo industrial para surtido operativo, fabricación y compras recurrentes",
    subtitle: "Stock visible, transferencia y respuesta comercial directa",
    body: "Acavike concentra categorías clave para planta, almacén, oficina y proyectos con una experiencia comercial simple.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Explorar catálogo",
    buttonHref: "/catalogo",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "section_quote",
    key: "quick_quote",
    title: "Cotización express para volumen, reposición o proyecto",
    subtitle: "Respuesta en menos de 24 horas",
    body: "Comparte SKU, descripción o cantidades objetivo y te respondemos con una propuesta comercial clara.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Solicitar cotización",
    buttonHref: "/cotizacion-rapida",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "section_trust",
    key: "trust_strip",
    title: "Compra empresarial con enfoque operativo y atención especializada",
    subtitle: "Cobertura de categorías clave",
    body: "Abrasivos, empaque, seguridad, fabricación, construcción, limpieza y abasto recurrente en un solo frente comercial.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Ver categorías",
    buttonHref: "/catalogo",
    isActive: true,
    sortOrder: 3,
  },
];

export const demoCategories: Category[] = [
  "Abrasivos",
  "Empaque",
  "Equipo de Seguridad",
  "Limpieza",
  "Comestibles",
  "Fabricación",
  "Oficina",
  "Construcción",
  "Herramienta",
  "Tornillería",
  "Renta",
].map((name, index) => ({
  id: `cat_${index + 1}`,
  name,
  slug: name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""),
  description: `Línea ${name.toLowerCase()} para operación, mantenimiento y abastecimiento industrial.`,
  imageUrl: `/demo-products/category-${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.svg`,
  parentId: null,
  sortOrder: index,
  isActive: true,
  createdAt: daysAgo(45 - index),
  updatedAt: daysAgo(5),
}));

const categoryBySlug = new Map(demoCategories.map((category) => [category.slug, category]));

function getDemoProductImageUrl(imageKey?: string) {
  return `/demo-products/product-${imageKey?.trim() || "box"}.svg`;
}

const demoProductsBase: Array<
  Omit<Product, "price" | "createdAt" | "updatedAt"> & {
    price: number;
    createdAt: Date;
    updatedAt: Date;
    imageAlt: string;
    imageKey: string;
    categorySlug: string;
    tiers: Array<{ id: string; minQuantity: number; price: number }>;
  }
> = demoProductSeeds.map((product: DemoProductSeed, index) => ({
  id: `prod_${index + 1}`,
  name: product.name?.trim() || `Producto demo ${index + 1}`,
  slug: toDemoSlug(product.name?.trim() || `producto-demo-${index + 1}`),
  sku: product.sku?.trim() || `DEMO-${String(index + 1).padStart(3, "0")}`,
  brand: product.brand?.trim() || "Acavike",
  shortDescription:
    product.shortDescription?.trim() ||
    "Producto demo disponible para operación, reposición o compra por volumen.",
  description:
    product.description?.trim() ||
    product.shortDescription?.trim() ||
    "Producto demo disponible para operación, reposición o compra por volumen.",
  categoryId: "",
  categorySlug: product.categorySlug?.trim() || demoCategories[0]?.slug || "abrasivos",
  price: Number.isFinite(product.price) ? product.price : 0,
  unit: product.unit?.trim() || "pieza",
  stock: Number.isFinite(product.stock) ? product.stock : 0,
  lowStockThreshold: Number.isFinite(product.lowStockThreshold) ? product.lowStockThreshold : 0,
  leadTimeText: product.leadTimeText?.trim() || "Entrega sujeta a disponibilidad",
  isActive: true,
  isFeatured: Boolean(product.isFeatured),
  createdAt: daysAgo(Number.isFinite(product.daysOffset) ? product.daysOffset : 0),
  updatedAt: daysAgo(Math.max(1, (Number.isFinite(product.daysOffset) ? product.daysOffset : 0) - 2)),
  imageAlt: product.imageAlt?.trim() || product.name?.trim() || "Producto demo",
  imageKey: product.imageKey?.trim() || "box",
  tiers: (product.tiers || [])
    .filter((tier) => Number.isFinite(tier.minQuantity) && Number.isFinite(tier.price))
    .map((tier, tierIndex) => ({
    id: `tier_${index + 1}_${tierIndex + 1}`,
    minQuantity: tier.minQuantity,
    price: tier.price,
  })),
}));

export const demoProducts: DemoProductRecord[] = demoProductsBase.map((product, index) => {
  const category = categoryBySlug.get(product.categorySlug) ?? demoCategories[0];
  const productRecord: Product = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: category.id,
    price: money(product.price),
    unit: product.unit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    leadTimeText: product.leadTimeText,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  const images: ProductImage[] = [
    {
      id: `image_${index + 1}_1`,
      productId: product.id,
      url: getDemoProductImageUrl(product.imageKey),
      alt: product.imageAlt,
      sortOrder: 0,
    },
  ];

  const priceTiers: PriceTier[] = product.tiers.map((tier) => ({
    id: tier.id,
    productId: product.id,
    minQuantity: tier.minQuantity,
    price: money(tier.price),
  }));

  return {
    ...productRecord,
    category,
    images,
    priceTiers,
  };
});

export const demoProductsById = new Map(demoProducts.map((product) => [product.id, product]));
export const demoProductsBySlug = new Map(demoProducts.map((product) => [product.slug, product]));

export type DemoCatalogDiagnostics = {
  totalCategories: number;
  totalProducts: number;
  totalFeatured: number;
  empaqueProducts: number;
  hasCajaProduct: boolean;
  invalidCategorySlugs: string[];
  missingFields: Array<{
    productId: string;
    productSlug: string;
    missing: string[];
  }>;
};

export function getDemoCatalogDiagnostics(): DemoCatalogDiagnostics {
  const validCategorySlugs = new Set(demoCategories.map((category) => category.slug));
  const missingFields = demoProductsBase.flatMap((product) => {
    const imageUrl = getDemoProductImageUrl(product.imageKey);
    const fieldsToValidate: Array<[string, unknown]> = [
      ["id", product.id],
      ["slug", product.slug],
      ["sku", product.sku],
      ["name", product.name],
      ["price", product.price],
      ["stock", product.stock],
      ["unit", product.unit],
      ["categorySlug", product.categorySlug],
      ["imageUrl", imageUrl],
    ];
    const missing = fieldsToValidate.flatMap<string>(([field, value]) => {
      if (typeof value === "string") {
        return value.trim() ? [] : [field];
      }

      if (typeof value === "number") {
        return Number.isFinite(value) ? [] : [field];
      }

      return value ? [] : [field];
    });

    return missing.length
      ? [
          {
            productId: product.id,
            productSlug: product.slug,
            missing,
          },
        ]
      : [];
  });

  const invalidCategorySlugs = Array.from(
    new Set(
      demoProductsBase
        .map((product) => product.categorySlug)
        .filter((categorySlug) => !validCategorySlugs.has(categorySlug)),
    ),
  );

  return {
    totalCategories: demoCategories.length,
    totalProducts: demoProducts.length,
    totalFeatured: demoProducts.filter((product) => product.isFeatured).length,
    empaqueProducts: demoProducts.filter((product) => product.category.slug === "empaque").length,
    hasCajaProduct: demoProducts.some(
      (product) => product.slug === "caja-corrugada-doble-pared-60-x-40",
    ),
    invalidCategorySlugs,
    missingFields,
  };
}

export const demoUsers: User[] = [
  {
    id: "user_superadmin",
    name: "Acavike Superadmin",
    email: "admin@acavike.com",
    passwordHash: "demo",
    role: "SUPERADMIN",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
  },
  {
    id: "user_admin",
    name: "Administrador Acavike",
    email: "manager@acavike.com",
    passwordHash: "demo",
    role: "ADMIN",
    createdAt: daysAgo(58),
    updatedAt: daysAgo(2),
  },
  {
    id: "user_warehouse",
    name: "Operaciones Acavike",
    email: "warehouse@acavike.com",
    passwordHash: "demo",
    role: "WAREHOUSE",
    createdAt: daysAgo(57),
    updatedAt: daysAgo(2),
  },
  {
    id: "user_sales",
    name: "Ventas Acavike",
    email: "ventas@acavike.com",
    passwordHash: "demo",
    role: "SALES",
    createdAt: daysAgo(56),
    updatedAt: daysAgo(2),
  },
  {
    id: "user_customer",
    name: "Compras Demo",
    email: "cliente@acavike.com",
    passwordHash: "demo",
    role: "CUSTOMER",
    createdAt: daysAgo(54),
    updatedAt: daysAgo(2),
  },
];

const userByEmail = new Map(demoUsers.map((user) => [user.email.toLowerCase(), user]));

export const demoCustomers: Customer[] = [
  {
    id: "customer_1",
    userId: "user_customer",
    name: "Maria Lopez",
    companyName: "Manufacturas del Norte",
    rfc: "MNO010203AB1",
    email: "cliente@acavike.com",
    phone: "8112345678",
    address: "Parque Industrial Oriente 220, Monterrey, Nuevo Leon",
    level: "GOLD",
    createdAt: daysAgo(54),
  },
  {
    id: "customer_2",
    userId: null,
    name: "Julio Garcia",
    companyName: "Talleres Integrales del Bajio",
    rfc: "TIB020304BC2",
    email: "julio@tib.com",
    phone: "4420001122",
    address: "Av. Soldadura 500, Queretaro",
    level: "SILVER",
    createdAt: daysAgo(40),
  },
  {
    id: "customer_3",
    userId: null,
    name: "Ana Ruiz",
    companyName: "Servicios de Planta Sur",
    rfc: "SPS030405CD3",
    email: "ana@sps.mx",
    phone: "5555007788",
    address: "Circuito Industrial 80, CDMX",
    level: "PLATINUM",
    createdAt: daysAgo(32),
  },
];

export const demoOrders: DemoOrderRecord[] = [
  {
    id: "order_1",
    orderNumber: "PED-1001",
    customerId: "customer_1",
    status: "RECEIPT_UPLOADED",
    subtotal: money(2320),
    tax: money(371.2),
    discount: money(0),
    total: money(2691.2),
    deliveryMethod: "Entrega local",
    deliveryAddress: "Parque Industrial Oriente 220, Monterrey, Nuevo Leon",
    notes: "Pedido demo pendiente de validacion.",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
    customer: demoCustomers[0],
    items: [
      {
        id: "order_item_1",
        orderId: "order_1",
        productId: "prod_2",
        sku: "EMP-002",
        name: "Caja corrugada doble pared 60 x 40",
        quantity: 20,
        unitPrice: money(36.4),
        total: money(728),
      },
      {
        id: "order_item_2",
        orderId: "order_1",
        productId: "prod_3",
        sku: "SEG-003",
        name: "Guante anticorte recubierto",
        quantity: 12,
        unitPrice: money(83.5),
        total: money(1002),
      },
    ],
    payment: {
      id: "payment_1",
      orderId: "order_1",
      status: "IN_REVIEW",
      bankName: "BANCO DEMO",
      beneficiary: "ACAVIKE S.A. DE C.V.",
      clabe: "000000000000000000",
      reference: "PED-1001",
      receiptUrl: "/uploads/receipts/.gitkeep",
      adminNotes: "Validar referencia bancaria.",
      reviewedById: null,
      reviewedAt: null,
      createdAt: daysAgo(7),
    },
  },
  {
    id: "order_2",
    orderNumber: "PED-1002",
    customerId: "customer_1",
    status: "DELIVERED",
    subtotal: money(1570),
    tax: money(251.2),
    discount: money(0),
    total: money(1821.2),
    deliveryMethod: "Paqueteria",
    deliveryAddress: "Parque Industrial Oriente 220, Monterrey, Nuevo Leon",
    notes: "Pedido demo entregado.",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(10),
    customer: demoCustomers[0],
    items: [
      {
        id: "order_item_3",
        orderId: "order_2",
        productId: "prod_7",
        sku: "TOR-010",
        name: "Tornillo hexagonal galvanizado",
        quantity: 200,
        unitPrice: money(3.1),
        total: money(620),
      },
      {
        id: "order_item_4",
        orderId: "order_2",
        productId: "prod_4",
        sku: "LMP-004",
        name: "Desengrasante industrial concentrado",
        quantity: 3,
        unitPrice: money(315),
        total: money(945),
      },
    ],
    payment: {
      id: "payment_2",
      orderId: "order_2",
      status: "APPROVED",
      bankName: "BANCO DEMO",
      beneficiary: "ACAVIKE S.A. DE C.V.",
      clabe: "000000000000000000",
      reference: "PED-1002",
      receiptUrl: "/uploads/receipts/.gitkeep",
      adminNotes: "Pago aprobado en demo.",
      reviewedById: "user_superadmin",
      reviewedAt: daysAgo(17),
      createdAt: daysAgo(18),
    },
  },
  {
    id: "order_3",
    orderNumber: "PED-1003",
    customerId: "customer_2",
    status: "PAYMENT_APPROVED",
    subtotal: money(3104),
    tax: money(496.64),
    discount: money(0),
    total: money(3600.64),
    deliveryMethod: "Recoleccion en almacen",
    deliveryAddress: "Av. Soldadura 500, Queretaro",
    notes: "Listo para preparacion de embarque.",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    customer: demoCustomers[1],
    items: [
      {
        id: "order_item_5",
        orderId: "order_3",
        productId: "prod_1",
        sku: "ABR-001",
        name: "Disco de corte industrial 4.5 pulg",
        quantity: 40,
        unitPrice: money(43.25),
        total: money(1730),
      },
      {
        id: "order_item_6",
        orderId: "order_3",
        productId: "prod_6",
        sku: "HER-009",
        name: "Taladro percutor 1/2",
        quantity: 1,
        unitPrice: money(1785),
        total: money(1785),
      },
    ],
    payment: {
      id: "payment_3",
      orderId: "order_3",
      status: "APPROVED",
      bankName: "BANCO DEMO",
      beneficiary: "ACAVIKE S.A. DE C.V.",
      clabe: "000000000000000000",
      reference: "PED-1003",
      receiptUrl: "/uploads/receipts/.gitkeep",
      adminNotes: "Transferencia confirmada.",
      reviewedById: "user_admin",
      reviewedAt: daysAgo(2),
      createdAt: daysAgo(3),
    },
  },
];

export const demoOrdersById = new Map(demoOrders.map((order) => [order.id, order]));
export const demoOrdersByNumber = new Map(demoOrders.map((order) => [order.orderNumber, order]));
export const demoPayments = demoOrders
  .filter((order): order is DemoOrderRecord & { payment: TransferPayment } => Boolean(order.payment))
  .map((order) => ({
    ...order.payment,
    order,
    reviewedBy:
      order.payment.reviewedById
        ? demoUsers.find((user) => user.id === order.payment.reviewedById) || null
        : null,
  }));

export const demoQuotes: DemoQuoteRecord[] = [
  {
    id: "quote_1",
    quoteNumber: "COT-1001",
    customerId: "customer_1",
    status: "SENT",
    subtotal: money(3890),
    tax: money(622.4),
    total: money(4512.4),
    validUntil: daysAgo(-10),
    notes: "Cotizacion demo para revision comercial.",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(8),
    customer: demoCustomers[0],
    items: [
      {
        id: "quote_item_1",
        quoteId: "quote_1",
        productId: "prod_1",
        sku: "ABR-001",
        name: "Disco de corte industrial 4.5 pulg",
        quantity: 20,
        unitPrice: money(45.9),
        total: money(918),
      },
      {
        id: "quote_item_2",
        quoteId: "quote_1",
        productId: "prod_6",
        sku: "HER-009",
        name: "Taladro percutor 1/2",
        quantity: 1,
        unitPrice: money(1785),
        total: money(1785),
      },
    ],
  },
  {
    id: "quote_2",
    quoteNumber: "COT-1002",
    customerId: "customer_3",
    status: "DRAFT",
    subtotal: money(2140),
    tax: money(342.4),
    total: money(2482.4),
    validUntil: daysAgo(-6),
    notes: "Solicitud en preparacion para cliente platinum.",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    customer: demoCustomers[2],
    items: [
      {
        id: "quote_item_3",
        quoteId: "quote_2",
        productId: "prod_3",
        sku: "SEG-003",
        name: "Guante anticorte recubierto",
        quantity: 24,
        unitPrice: money(79.9),
        total: money(1917.6),
      },
      {
        id: "quote_item_4",
        quoteId: "quote_2",
        productId: null,
        sku: "SERV-001",
        name: "Visita tecnica de levantamiento",
        quantity: 1,
        unitPrice: money(222.4),
        total: money(222.4),
      },
    ],
  },
];

export const demoQuotesById = new Map(demoQuotes.map((quote) => [quote.id, quote]));

export const demoCoupons: Coupon[] = [
  {
    id: "coupon_1",
    code: "BIENVENIDA5",
    description: "Descuento demo de bienvenida",
    type: "PERCENTAGE",
    amount: money(5),
    isActive: true,
    startsAt: daysAgo(30),
    endsAt: daysAgo(-30),
    usageLimit: 100,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: "coupon_2",
    code: "FLETE250",
    description: "Apoyo demo para compras recurrentes",
    type: "FIXED",
    amount: money(250),
    isActive: false,
    startsAt: daysAgo(45),
    endsAt: daysAgo(-5),
    usageLimit: 50,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(2),
  },
];

export const demoEmailTemplates: EmailTemplate[] = [
  {
    id: "email_1",
    key: "quote_sent",
    name: "Cotizacion enviada",
    subject: "Tu cotizacion de Acavike esta lista",
    body: "Hola {{cliente}},\n\nAdjuntamos la cotizacion {{folio}} con vigencia {{vigencia}}.\n\nEquipo Acavike",
    isActive: true,
    updatedAt: daysAgo(4),
  },
  {
    id: "email_2",
    key: "order_pending_transfer",
    name: "Pedido pendiente de transferencia",
    subject: "Instrucciones de pago para tu pedido",
    body: "Hola {{cliente}},\n\nTu pedido {{folio}} fue generado. Comparte tu comprobante para validarlo.\n\nEquipo Acavike",
    isActive: true,
    updatedAt: daysAgo(4),
  },
];

export const demoMessages: ContactMessage[] = [
  {
    id: "message_1",
    name: "Julio Garcia",
    companyName: "Talleres Integrales del Bajio",
    email: "julio@tib.com",
    phone: "4420001122",
    message: "Necesito cotizacion para guantes, cajas corrugadas y desengrasante industrial.",
    status: "NEW",
    createdAt: daysAgo(6),
  },
  {
    id: "message_2",
    name: "Ana Ruiz",
    companyName: "Servicios de Planta Sur",
    email: "ana@sps.mx",
    phone: "5555007788",
    message: "Solicito visita comercial para revisar abasto mensual de abrasivos.",
    status: "READ",
    createdAt: daysAgo(4),
  },
];

export const demoAuditLogs: AuditLog[] = [
  {
    id: "audit_1",
    userId: "user_superadmin",
    action: "DEMO_MODE_BOOT",
    entity: "system",
    entityId: null,
    metadata: { source: "lib/demo-data.ts" },
    createdAt: daysAgo(7),
  },
  {
    id: "audit_2",
    userId: "user_admin",
    action: "QUOTE_UPDATED",
    entity: "quote",
    entityId: "quote_1",
    metadata: { quoteNumber: "COT-1001" },
    createdAt: daysAgo(5),
  },
  {
    id: "audit_3",
    userId: "user_warehouse",
    action: "ORDER_STATUS_UPDATED",
    entity: "order",
    entityId: "order_3",
    metadata: { orderNumber: "PED-1003", status: "PAYMENT_APPROVED" },
    createdAt: daysAgo(2),
  },
];

export const demoViewers: DemoViewer[] = demoUsers.map((user) => ({
  ...user,
  customer: demoCustomers.find((customer) => customer.userId === user.id) || null,
}));

export const demoBackofficeUser =
  demoViewers.find((user) => user.role === "SUPERADMIN") || demoViewers[0];
export const demoCustomerUser =
  demoViewers.find((user) => user.role === "CUSTOMER") || demoViewers[0];

export const demoCart: DemoCartRecord = {
  id: "cart_demo",
  sessionId: "demo-session",
  userId: null,
  createdAt: daysAgo(1),
  updatedAt: daysAgo(0),
  items: [],
};

export function findDemoUserByEmail(email: string) {
  return userByEmail.get(email.toLowerCase()) || null;
}

export function findDemoViewerById(userId: string) {
  return demoViewers.find((user) => user.id === userId) || null;
}

export function findDemoCustomerById(customerId: string) {
  return demoCustomers.find((customer) => customer.id === customerId) || null;
}

export function getDemoRuntimeUser(role: User["role"] = "SUPERADMIN"): DemoViewer {
  return demoViewers.find((user) => user.role === role) || demoBackofficeUser;
}
