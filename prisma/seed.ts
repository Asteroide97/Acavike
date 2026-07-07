import { hash } from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { BANK_SETTING_KEYS } from "../lib/constants";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Admin123!", 10);
  const customerPasswordHash = await hash("Cliente123!", 10);

  await prisma.auditLog.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.transferPayment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.priceTier.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.siteSection.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const superadmin = await prisma.user.create({
    data: {
      name: "Acavike Superadmin",
      email: "admin@acavike.com",
      passwordHash,
      role: "SUPERADMIN",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        name: "Operaciones Acavike",
        email: "warehouse@acavike.com",
        passwordHash,
        role: "WAREHOUSE",
      },
      {
        name: "Ventas Acavike",
        email: "ventas@acavike.com",
        passwordHash,
        role: "SALES",
      },
      {
        name: "Administrador Acavike",
        email: "manager@acavike.com",
        passwordHash,
        role: "ADMIN",
      },
    ],
  });

  const customerUser = await prisma.user.create({
    data: {
      name: "Compras Demo",
      email: "cliente@acavike.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      name: "María López",
      companyName: "Manufacturas del Norte",
      rfc: "MNO010203AB1",
      email: customerUser.email,
      phone: "8112345678",
      address: "Parque Industrial Oriente 220, Monterrey, Nuevo León",
      level: "GOLD",
    },
  });

  const categories = await Promise.all(
    [
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
    ].map((name, index) =>
      prisma.category.create({
        data: {
          name,
          slug: slugify(name),
          description: `Línea ${name.toLowerCase()} para operación, mantenimiento y abastecimiento industrial.`,
          imageUrl: "/placeholder-category.svg",
          sortOrder: index,
          isActive: true,
        },
      }),
    ),
  );

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const products = [
    {
      name: "Disco de corte industrial 4.5 pulg",
      sku: "ABR-001",
      brand: "Acavike Select",
      shortDescription: "Disco para acero con alto rendimiento en taller y mantenimiento.",
      description: "Disco de corte multipropósito para operaciones industriales de uso continuo.",
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
      brand: "Acavike Supply",
      shortDescription: "Empaque resistente para logística interna y embarque.",
      description: "Caja corrugada doble pared con buena resistencia para cargas medianas.",
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
      shortDescription: "Guante para operación industrial con buen agarre.",
      description: "Guante anticorte nivel intermedio para almacén, manufactura y empaque.",
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
      description: "Solución concentrada de limpieza industrial para mantenimiento y sanitización.",
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
      name: "Kit de café y azúcar para oficina",
      sku: "COM-005",
      brand: "Acavike Pantry",
      shortDescription: "Abasto básico para estaciones de servicio internas.",
      description: "Kit genérico para consumo interno con café soluble, azúcar y vasos.",
      categorySlug: "comestibles",
      price: 420,
      unit: "kit",
      stock: 18,
      lowStockThreshold: 6,
      leadTimeText: "24 horas",
      isFeatured: false,
      tiers: [{ minQuantity: 6, price: 399 }],
    },
    {
      name: "Perfil estructural ligero 3 m",
      sku: "FAB-006",
      brand: "Acavike Metal",
      shortDescription: "Perfil para fabricación ligera y adecuaciones de planta.",
      description: "Perfil estructural comercial para soporte, racks y fabricación menor.",
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
      name: "Silla operativa tapizada",
      sku: "OFF-007",
      brand: "Acavike Office",
      shortDescription: "Mobiliario funcional para áreas administrativas.",
      description: "Silla operativa con altura ajustable y respaldo de soporte medio.",
      categorySlug: "oficina",
      price: 1399,
      unit: "pieza",
      stock: 14,
      lowStockThreshold: 4,
      leadTimeText: "3 a 5 días hábiles",
      isFeatured: false,
      tiers: [{ minQuantity: 10, price: 1299 }],
    },
    {
      name: "Cinta de señalización amarilla",
      sku: "CON-008",
      brand: "Acavike Build",
      shortDescription: "Cinta para delimitación temporal de zonas de trabajo.",
      description: "Cinta de señalización visible para obra, mantenimiento y seguridad perimetral.",
      categorySlug: "construccion",
      price: 62,
      unit: "rollo",
      stock: 190,
      lowStockThreshold: 25,
      leadTimeText: "Entrega inmediata",
      isFeatured: true,
      tiers: [
        { minQuantity: 24, price: 58.5 },
        { minQuantity: 96, price: 54.1 },
      ],
    },
    {
      name: "Taladro percutor 1/2",
      sku: "HER-009",
      brand: "Acavike Tools",
      shortDescription: "Herramienta portátil para mantenimiento general.",
      description: "Taladro percutor de uso industrial ligero con mandril metálico.",
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
      name: "Tornillo hexagonal galvanizado",
      sku: "TOR-010",
      brand: "Acavike Fix",
      shortDescription: "Fijación estándar para mantenimiento e instalación.",
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
      name: "Renta de escalera dieléctrica",
      sku: "REN-011",
      brand: "Acavike Rental",
      shortDescription: "Renta diaria para trabajos de mantenimiento y seguridad.",
      description: "Servicio de renta con disponibilidad sujeta a programación.",
      categorySlug: "renta",
      price: 650,
      unit: "día",
      stock: 4,
      lowStockThreshold: 1,
      leadTimeText: "Bajo programación",
      isFeatured: false,
      tiers: [{ minQuantity: 5, price: 590 }],
    },
    {
      name: "Lija de agua grano 400",
      sku: "ABR-012",
      brand: "Acavike Select",
      shortDescription: "Acabado fino para procesos de detallado.",
      description: "Lija de agua flexible para acabado y preparación de superficie.",
      categorySlug: "abrasivos",
      price: 12.9,
      unit: "pieza",
      stock: 360,
      lowStockThreshold: 50,
      leadTimeText: "Entrega inmediata",
      isFeatured: false,
      tiers: [
        { minQuantity: 50, price: 11.8 },
        { minQuantity: 200, price: 10.9 },
      ],
    },
  ];

  const createdProducts = [];

  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug: slugify(product.name),
        sku: product.sku,
        brand: product.brand,
        shortDescription: product.shortDescription,
        description: product.description,
        categoryId: categoryBySlug.get(product.categorySlug)?.id ?? categories[0].id,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        leadTimeText: product.leadTimeText,
        isActive: true,
        isFeatured: product.isFeatured,
        images: {
          create: [
            {
              url: "/placeholder-product.svg",
              alt: product.name,
              sortOrder: 0,
            },
          ],
        },
        priceTiers: {
          create: product.tiers,
        },
      },
    });

    createdProducts.push(created);
  }

  await prisma.siteSetting.createMany({
    data: [
      { key: BANK_SETTING_KEYS.bankName, value: "BANCO DEMO" },
      { key: BANK_SETTING_KEYS.beneficiary, value: "ACAVIKE S.A. DE C.V." },
      { key: BANK_SETTING_KEYS.clabe, value: "000000000000000000" },
      { key: BANK_SETTING_KEYS.referenceHelp, value: "Usa tu número de pedido como referencia de pago." },
      { key: BANK_SETTING_KEYS.supportEmail, value: "ventas@acavike.com" },
      { key: BANK_SETTING_KEYS.supportPhone, value: "81 0000 0000" },
      {
        key: BANK_SETTING_KEYS.companyAddress,
        value: "Centro de Operaciones Acavike, Monterrey, Nuevo León",
      },
    ],
  });

  await prisma.siteSection.createMany({
    data: [
      {
        key: "hero_home",
        title: "Abasto industrial con operación simple y respuesta rápida",
        subtitle: "Acavike Industrial",
        body: "Catálogo B2B para compras técnicas, resurtido recurrente y atención comercial centralizada.",
        imageUrl: "/placeholder-category.svg",
        buttonText: "Explorar catálogo",
        buttonHref: "/catalogo",
        isActive: true,
        sortOrder: 1,
      },
      {
        key: "quick_quote",
        title: "Cotización rápida para compras urgentes",
        subtitle: "Respuesta comercial",
        body: "Envía tus requerimientos por SKU, descripción o consumo estimado y arma tu pedido por transferencia.",
        imageUrl: "/placeholder-category.svg",
        buttonText: "Solicitar cotización",
        buttonHref: "/cotizacion-rapida",
        isActive: true,
        sortOrder: 2,
      },
      {
        key: "trust_strip",
        title: "Operación enfocada en industria, mantenimiento y abastecimiento",
        subtitle: "Cobertura de categorías clave",
        body: "Abrasivos, empaque, EPP, limpieza, tornillería, herramienta y líneas operativas para planta.",
        imageUrl: "/placeholder-category.svg",
        buttonText: "Ver categorías",
        buttonHref: "/catalogo",
        isActive: true,
        sortOrder: 3,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "BIENVENIDA5",
        description: "Descuento demo de bienvenida",
        type: "PERCENTAGE",
        amount: 5,
        isActive: true,
      },
      {
        code: "FLETE250",
        description: "Apoyo demo para compras recurrentes",
        type: "FIXED",
        amount: 250,
        isActive: true,
      },
    ],
  });

  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "quote_sent",
        name: "Cotización enviada",
        subject: "Tu cotización de Acavike está lista",
        body: "Hola {{cliente}},\n\nAdjuntamos la cotización {{folio}} con vigencia {{vigencia}}.\n\nEquipo Acavike",
        isActive: true,
      },
      {
        key: "order_pending_transfer",
        name: "Pedido pendiente de transferencia",
        subject: "Instrucciones de pago para tu pedido",
        body: "Hola {{cliente}},\n\nTu pedido {{folio}} fue generado. Comparte tu comprobante para validarlo.\n\nEquipo Acavike",
        isActive: true,
      },
    ],
  });

  const demoQuote = await prisma.quote.create({
    data: {
      quoteNumber: "COT-1001",
      customerId: customer.id,
      status: "SENT",
      subtotal: 3890,
      tax: 622.4,
      total: 4512.4,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      notes: "Cotización demo para revisión comercial.",
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            sku: createdProducts[0].sku,
            name: createdProducts[0].name,
            quantity: 20,
            unitPrice: 45.9,
            total: 918,
          },
          {
            productId: createdProducts[8].id,
            sku: createdProducts[8].sku,
            name: createdProducts[8].name,
            quantity: 1,
            unitPrice: 1785,
            total: 1785,
          },
        ],
      },
    },
  });

  const pendingOrder = await prisma.order.create({
    data: {
      orderNumber: "PED-1001",
      customerId: customer.id,
      status: "RECEIPT_UPLOADED",
      subtotal: 2320,
      tax: 371.2,
      total: 2691.2,
      deliveryMethod: "Entrega local",
      deliveryAddress: customer.address ?? "",
      notes: "Pedido demo pendiente de validación.",
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            sku: createdProducts[1].sku,
            name: createdProducts[1].name,
            quantity: 20,
            unitPrice: 36.4,
            total: 728,
          },
          {
            productId: createdProducts[2].id,
            sku: createdProducts[2].sku,
            name: createdProducts[2].name,
            quantity: 12,
            unitPrice: 83.5,
            total: 1002,
          },
        ],
      },
      payment: {
        create: {
          status: "IN_REVIEW",
          bankName: "BANCO DEMO",
          beneficiary: "ACAVIKE S.A. DE C.V.",
          clabe: "000000000000000000",
          reference: "PED-1001",
          adminNotes: "Validar referencia bancaria.",
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "PED-1002",
      customerId: customer.id,
      status: "DELIVERED",
      subtotal: 1570,
      tax: 251.2,
      total: 1821.2,
      deliveryMethod: "Paquetería",
      deliveryAddress: customer.address ?? "",
      notes: "Pedido demo entregado.",
      items: {
        create: [
          {
            productId: createdProducts[9].id,
            sku: createdProducts[9].sku,
            name: createdProducts[9].name,
            quantity: 200,
            unitPrice: 3.1,
            total: 620,
          },
          {
            productId: createdProducts[3].id,
            sku: createdProducts[3].sku,
            name: createdProducts[3].name,
            quantity: 3,
            unitPrice: 315,
            total: 945,
          },
        ],
      },
      payment: {
        create: {
          status: "APPROVED",
          bankName: "BANCO DEMO",
          beneficiary: "ACAVIKE S.A. DE C.V.",
          clabe: "000000000000000000",
          reference: "PED-1002",
          reviewedById: superadmin.id,
          reviewedAt: new Date(),
        },
      },
    },
  });

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Julio García",
        companyName: "Talleres Integrales del Bajío",
        email: "julio@tib.com",
        phone: "4420001122",
        message: "Necesito cotización para guantes, cajas corrugadas y desengrasante industrial.",
      },
      {
        name: "Ana Ruiz",
        companyName: "Servicios de Planta Sur",
        email: "ana@sps.mx",
        phone: "5555007788",
        message: "Solicito visita comercial para revisar abasto mensual de abrasivos.",
        status: "READ",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: superadmin.id,
        action: "SEED_RUN",
        entity: "system",
        entityId: null,
        metadata: { source: "prisma/seed.ts" },
      },
      {
        userId: superadmin.id,
        action: "QUOTE_CREATED",
        entity: "quote",
        entityId: demoQuote.id,
        metadata: { quoteNumber: demoQuote.quoteNumber },
      },
      {
        userId: superadmin.id,
        action: "ORDER_CREATED",
        entity: "order",
        entityId: pendingOrder.id,
        metadata: { orderNumber: pendingOrder.orderNumber },
      },
    ],
  });

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
