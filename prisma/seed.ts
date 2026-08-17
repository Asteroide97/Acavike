import { hash } from "bcrypt";
import { PrismaClient, type Prisma, type UserRole } from "@prisma/client";
import { BANK_SETTING_KEYS } from "../lib/constants";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

const categorySeeds = [
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
];

const productSeeds = [
  {
    name: "Disco de corte industrial 4.5 pulg",
    sku: "ABR-001",
    brand: "Acavike Select",
    shortDescription: "Disco para acero con alto rendimiento en taller y mantenimiento.",
    description: "Disco de corte multiproposito para operacion continua en mantenimiento industrial.",
    categorySlug: "abrasivos",
    price: 48.5,
    unit: "pieza",
    stock: 120,
    lowStockThreshold: 20,
    leadTimeText: "Entrega inmediata",
    isFeatured: true,
    tiers: [
      { minQuantity: 10, price: 45.9 },
      { minQuantity: 50, price: 43.25 },
    ],
  },
  {
    name: "Caja corrugada doble pared 60 x 40",
    sku: "EMP-002",
    brand: "Acavike Supplies",
    shortDescription: "Caja resistente para logistica interna y embarque.",
    description: "Caja corrugada doble pared para operaciones de almacen, empaque y distribucion.",
    categorySlug: "empaque",
    price: 39.9,
    unit: "pieza",
    stock: 240,
    lowStockThreshold: 40,
    leadTimeText: "24 a 48 horas",
    isFeatured: true,
    tiers: [
      { minQuantity: 25, price: 36.4 },
      { minQuantity: 100, price: 33.8 },
    ],
  },
  {
    name: "Guante anticorte recubierto",
    sku: "SEG-003",
    brand: "Acavike Guard",
    shortDescription: "Guante para operacion industrial con buen agarre.",
    description: "Guante anticorte para almacen, manufactura y manejo general de materiales.",
    categorySlug: "equipo-de-seguridad",
    price: 89,
    unit: "par",
    stock: 75,
    lowStockThreshold: 15,
    leadTimeText: "Entrega inmediata",
    isFeatured: true,
    tiers: [
      { minQuantity: 12, price: 83.5 },
      { minQuantity: 48, price: 79.9 },
    ],
  },
  {
    name: "Desengrasante industrial concentrado",
    sku: "LMP-004",
    brand: "Acavike Clean",
    shortDescription: "Limpieza profunda para taller, piso y maquinaria ligera.",
    description: "Solucion concentrada para mantenimiento industrial y limpieza de superficies.",
    categorySlug: "limpieza",
    price: 315,
    unit: "garrafa",
    stock: 32,
    lowStockThreshold: 10,
    leadTimeText: "48 horas",
    isFeatured: false,
    tiers: [
      { minQuantity: 4, price: 299 },
      { minQuantity: 12, price: 287.5 },
    ],
  },
  {
    name: "Taladro percutor 1/2",
    sku: "HER-009",
    brand: "Acavike Tools",
    shortDescription: "Herramienta portatil para mantenimiento general.",
    description: "Taladro percutor de uso industrial ligero para instalacion y mantenimiento.",
    categorySlug: "herramienta",
    price: 1890,
    unit: "pieza",
    stock: 9,
    lowStockThreshold: 4,
    leadTimeText: "48 horas",
    isFeatured: true,
    tiers: [{ minQuantity: 5, price: 1785 }],
  },
  {
    name: "Perfil estructural ligero 3 m",
    sku: "FAB-006",
    brand: "Acavike Metal",
    shortDescription: "Perfil para fabricacion ligera y adecuaciones de planta.",
    description: "Perfil estructural comercial para soporte, racks y fabricacion menor.",
    categorySlug: "fabricacion",
    price: 185,
    unit: "barra",
    stock: 26,
    lowStockThreshold: 8,
    leadTimeText: "72 horas",
    isFeatured: false,
    tiers: [
      { minQuantity: 10, price: 176 },
      { minQuantity: 30, price: 169.5 },
    ],
  },
  {
    name: "Tornillo hexagonal galvanizado",
    sku: "TOR-010",
    brand: "Acavike Fix",
    shortDescription: "Fijacion estandar para mantenimiento e instalacion.",
    description: "Tornillo galvanizado de uso general con cabeza hexagonal.",
    categorySlug: "tornilleria",
    price: 3.8,
    unit: "pieza",
    stock: 900,
    lowStockThreshold: 120,
    leadTimeText: "Entrega inmediata",
    isFeatured: false,
    tiers: [
      { minQuantity: 100, price: 3.4 },
      { minQuantity: 500, price: 3.1 },
    ],
  },
  {
    name: "Silla operativa tapizada",
    sku: "OFF-007",
    brand: "Acavike Office",
    shortDescription: "Mobiliario funcional para areas administrativas.",
    description: "Silla operativa con altura ajustable y respaldo de soporte medio.",
    categorySlug: "oficina",
    price: 1399,
    unit: "pieza",
    stock: 14,
    lowStockThreshold: 4,
    leadTimeText: "3 a 5 dias habiles",
    isFeatured: true,
    tiers: [{ minQuantity: 10, price: 1299 }],
  },
];

const siteSections = [
  {
    key: "hero_home",
    title: "Suministros industriales para empresas",
    subtitle: "Acavike Supplies",
    body: "Empaque, limpieza, seguridad, herramientas y abastecimiento B2B.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Ver catalogo",
    buttonHref: "/catalogo",
    sortOrder: 1,
  },
  {
    key: "quick_quote",
    title: "Cotizacion express para compras por proyecto",
    subtitle: "Respuesta comercial",
    body: "Solicita apoyo comercial para volumen, resurtido y compras recurrentes.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Solicitar cotizacion",
    buttonHref: "/cotizacion-rapida",
    sortOrder: 2,
  },
  {
    key: "trust_strip",
    title: "Catalogo industrial con operacion centralizada",
    subtitle: "Abasto B2B",
    body: "Productos, inventario, carrito y pedidos por transferencia desde un mismo panel.",
    imageUrl: "/placeholder-category.svg",
    buttonText: "Ir al admin",
    buttonHref: "/admin",
    sortOrder: 3,
  },
];

const siteSettingSeeds = [
  { key: BANK_SETTING_KEYS.bankName, value: "BANCO DE PRUEBA" },
  { key: BANK_SETTING_KEYS.beneficiary, value: "ACAVIKE SUPPLIES" },
  { key: BANK_SETTING_KEYS.clabe, value: "000000000000000000" },
  { key: BANK_SETTING_KEYS.referenceHelp, value: "Usa tu numero de pedido como referencia de transferencia." },
  { key: BANK_SETTING_KEYS.supportEmail, value: "ventas@acavike.com" },
  { key: BANK_SETTING_KEYS.supportPhone, value: "+52 81 3082 2452" },
  { key: BANK_SETTING_KEYS.companyAddress, value: "Allende, Nuevo León, México" },
  { key: BANK_SETTING_KEYS.supportHours, value: "Lun–Vie 8:00–18:00" },
  { key: BANK_SETTING_KEYS.whatsappPhone, value: "+528130822452" },
];

const userSeeds: Array<{
  name: string;
  email: string;
  role: UserRole;
  password: string;
}> = [
  {
    name: "Acavike Superadmin",
    email: "admin@acavike.com",
    role: "SUPERADMIN",
    password: "Admin123!",
  },
  {
    name: "Administrador Acavike",
    email: "manager@acavike.com",
    role: "ADMIN",
    password: "Admin123!",
  },
  {
    name: "Operaciones Acavike",
    email: "warehouse@acavike.com",
    role: "WAREHOUSE",
    password: "Admin123!",
  },
  {
    name: "Ventas Acavike",
    email: "ventas@acavike.com",
    role: "SALES",
    password: "Admin123!",
  },
  {
    name: "Compras Cliente",
    email: "cliente@acavike.com",
    role: "CUSTOMER",
    password: "Cliente123!",
  },
];

async function upsertUser(seed: (typeof userSeeds)[number], passwordHash: string) {
  return prisma.user.upsert({
    where: { email: seed.email },
    update: {
      name: seed.name,
      role: seed.role,
      passwordHash,
    },
    create: {
      name: seed.name,
      email: seed.email,
      role: seed.role,
      passwordHash,
    },
  });
}

async function upsertSiteSetting(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function upsertSiteSection(section: (typeof siteSections)[number]) {
  await prisma.siteSection.upsert({
    where: { key: section.key },
    update: {
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
      imageUrl: section.imageUrl,
      buttonText: section.buttonText,
      buttonHref: section.buttonHref,
      sortOrder: section.sortOrder,
      isActive: true,
    },
    create: {
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
      imageUrl: section.imageUrl,
      buttonText: section.buttonText,
      buttonHref: section.buttonHref,
      sortOrder: section.sortOrder,
      isActive: true,
    },
  });
}

async function upsertProduct(
  seed: (typeof productSeeds)[number],
  categoryId: string,
) {
  const productData: Prisma.ProductUncheckedCreateInput = {
    name: seed.name,
    slug: slugify(seed.name),
    sku: seed.sku,
    brand: seed.brand,
    shortDescription: seed.shortDescription,
    description: seed.description,
    categoryId,
    price: seed.price,
    unit: seed.unit,
    stock: seed.stock,
    lowStockThreshold: seed.lowStockThreshold,
    leadTimeText: seed.leadTimeText,
    isActive: true,
    isFeatured: seed.isFeatured,
  };

  await prisma.product.upsert({
    where: { sku: seed.sku },
    update: {
      ...productData,
      images: {
        deleteMany: {},
        create: [
          {
            url: "/placeholder-product.svg",
            alt: seed.name,
            sortOrder: 0,
          },
        ],
      },
      priceTiers: {
        deleteMany: {},
        create: seed.tiers,
      },
    },
    create: {
      ...productData,
      images: {
        create: [
          {
            url: "/placeholder-product.svg",
            alt: seed.name,
            sortOrder: 0,
          },
        ],
      },
      priceTiers: {
        create: seed.tiers,
      },
    },
  });
}

async function main() {
  const passwordHashes = new Map<string, string>();

  for (const seed of userSeeds) {
    passwordHashes.set(seed.email, await hash(seed.password, 10));
  }

  const seededUsers = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();
  for (const seed of userSeeds) {
    const user = await upsertUser(seed, passwordHashes.get(seed.email) ?? "");
    seededUsers.set(seed.email, user);
  }

  const customerUser = seededUsers.get("cliente@acavike.com");
  if (customerUser) {
    await prisma.customer.upsert({
      where: { email: customerUser.email },
      update: {
        userId: customerUser.id,
        name: "Compras Cliente",
        companyName: "Cliente de Prueba Acavike",
        phone: "+52 81 3082 2452",
        address: "Allende, Nuevo León, México",
        rfc: "XAXX010101000",
        level: "BRONZE",
      },
      create: {
        userId: customerUser.id,
        name: "Compras Cliente",
        companyName: "Cliente de Prueba Acavike",
        email: customerUser.email,
        phone: "+52 81 3082 2452",
        address: "Allende, Nuevo León, México",
        rfc: "XAXX010101000",
        level: "BRONZE",
      },
    });
  }

  const categoryBySlug = new Map<string, string>();
  for (const [index, name] of categorySeeds.entries()) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {
        name,
        description: `Linea ${name.toLowerCase()} para operacion, mantenimiento y abastecimiento industrial.`,
        imageUrl: "/placeholder-category.svg",
        sortOrder: index,
        isActive: true,
      },
      create: {
        name,
        slug,
        description: `Linea ${name.toLowerCase()} para operacion, mantenimiento y abastecimiento industrial.`,
        imageUrl: "/placeholder-category.svg",
        sortOrder: index,
        isActive: true,
      },
    });
    categoryBySlug.set(slug, category.id);
  }

  for (const seed of productSeeds) {
    const categoryId = categoryBySlug.get(seed.categorySlug);
    if (!categoryId) {
      throw new Error(`No existe la categoria ${seed.categorySlug} para el producto ${seed.sku}.`);
    }

    await upsertProduct(seed, categoryId);
  }

  for (const setting of siteSettingSeeds) {
    await upsertSiteSetting(setting.key, setting.value);
  }

  for (const section of siteSections) {
    await upsertSiteSection(section);
  }

  console.log("Seed real completado.");
  console.log("Superadmin: admin@acavike.com / Admin123!");
  console.log("Cliente de prueba: cliente@acavike.com / Cliente123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
