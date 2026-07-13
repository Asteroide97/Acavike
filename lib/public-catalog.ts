import type { Category } from "@prisma/client";

export const PUBLIC_NAV_TABS = [
  { label: "Catálogo", href: "/catalogo" },
  { label: "Cotización", href: "/cotizacion-rapida" },
  { label: "Fabricación", href: "/catalogo?categoria=fabricacion" },
  { label: "Servicios", href: "/contacto#servicios" },
  { label: "Nosotros", href: "/contacto#nosotros" },
] as const;

const HOME_CATEGORY_ORDER = [
  "abrasivos",
  "empaque",
  "equipo-de-seguridad",
  "herramienta",
  "fabricacion",
  "construccion",
  "limpieza",
  "comestibles",
  "oficina",
] as const;

type DemoCategoryMeta = {
  blurb: string;
  subcategories: string[];
  callout: string;
};

const FALLBACK_META: DemoCategoryMeta = {
  blurb: "Suministro industrial para operación, mantenimiento y compra recurrente.",
  subcategories: ["Línea general", "Consumibles", "Reposición", "Entrega programada"],
  callout: "Inventario sujeto a disponibilidad.",
};

export const DEMO_CATEGORY_META: Record<string, DemoCategoryMeta> = {
  abrasivos: {
    blurb: "Desbaste, corte y acabado para taller, mantenimiento y metalmecánica.",
    subcategories: ["Discos de corte", "Lijas de agua", "Ruedas flap", "Cepillos de alambre"],
    callout: "Presentaciones para mantenimiento y producción ligera.",
  },
  empaque: {
    blurb: "Cajas, cintas y protección para embarque, almacén y resguardo interno.",
    subcategories: ["Cajas corrugadas", "Cinta canela", "Película stretch", "Burbuja", "Sobres de envío"],
    callout: "Ideal para operaciones logísticas y surtido diario.",
  },
  "equipo-de-seguridad": {
    blurb: "Protección personal para almacén, planta, reparto y cuadrillas operativas.",
    subcategories: ["Guantes", "Cascos", "Lentes", "Chalecos", "Proteccion auditiva"],
    callout: "Equipos con salida rápida para uso recurrente.",
  },
  limpieza: {
    blurb: "Higiene industrial para taller, oficinas, pasillos y zonas de proceso.",
    subcategories: ["Desengrasantes", "Toallas", "Jaladores", "Sanitización", "Contenedores"],
    callout: "Formatos concentrados y artículos de reposición continua.",
  },
  construccion: {
    blurb: "Consumibles para obra, reparación, delimitación y seguridad temporal.",
    subcategories: ["Señalización", "Cintas preventivas", "Impermeabilizantes", "Selladores"],
    callout: "Material listo para cuadrillas y trabajos de campo.",
  },
  herramienta: {
    blurb: "Herramienta portátil y accesorios para mantenimiento eléctrico y mecánico.",
    subcategories: ["Taladros", "Llaves", "Dados", "Consumibles", "Herramienta manual"],
    callout: "Modelos orientados a operación diaria.",
  },
  oficina: {
    blurb: "Mobiliario y abasto para espacios administrativos y áreas de soporte.",
    subcategories: ["Sillas", "Archivo", "Papel", "Escritorio", "Consumibles"],
    callout: "Categorías para compras internas y reposición mensual.",
  },
  tornilleria: {
    blurb: "Fijación industrial para instalación, montaje y mantenimiento general.",
    subcategories: ["Tornillo hexagonal", "Tuercas", "Rondanas", "Anclas", "Birlos"],
    callout: "Disponibilidad por pieza, paquete y volumen.",
  },
  renta: {
    blurb: "Activos de apoyo para trabajos temporales y necesidades programadas.",
    subcategories: ["Escaleras", "Andamios", "Extensiones", "Equipo auxiliar"],
    callout: "Servicio sujeto a programación y cobertura.",
  },
  comestibles: {
    blurb: "Abasto básico para estaciones de café y consumo interno.",
    subcategories: ["Café", "Azúcar", "Vasos", "Snacks"],
    callout: "Kits listos para oficinas y salas de juntas.",
  },
  fabricacion: {
    blurb: "Material para adecuaciones ligeras, soporte y fabricación menor.",
    subcategories: ["Perfil estructural", "Placas", "Tubular", "Consumibles"],
    callout: "Soluciones para mantenimiento y montaje.",
  },
};

export function getHomeCategories(categories: Category[]) {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  return HOME_CATEGORY_ORDER.map((slug) => categoryMap.get(slug)).filter(
    (category): category is Category => Boolean(category),
  );
}

export function getCategoryMeta(slug: string) {
  return DEMO_CATEGORY_META[slug] ?? FALLBACK_META;
}

export function getCategorySubcategories(slug: string) {
  return getCategoryMeta(slug).subcategories.map((name, index) => ({
    name,
    href: `/catalogo/${slug}#productos`,
    code: `${slug.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
  }));
}

export function buildQuoteRequirements(input: {
  sku?: string | null;
  name?: string | null;
  quantity?: string | number | null;
}) {
  const quantity = typeof input.quantity === "number" ? String(input.quantity) : input.quantity?.trim() || "";
  const label = input.sku?.trim() ? `SKU ${input.sku.trim()}` : input.name?.trim() || "";

  if (!label && !quantity) {
    return "";
  }

  return [label || "Producto", quantity].filter(Boolean).join(" | ");
}
