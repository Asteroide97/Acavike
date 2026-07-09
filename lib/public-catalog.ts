import type { Category } from "@prisma/client";

export const PUBLIC_NAV_TABS = [
  { label: "Productos", href: "/catalogo" },
  { label: "Marca Acavike", href: "/catalogo?q=Acavike" },
  { label: "Cotizacion Express", href: "/cotizacion-rapida" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "Ofertas Especiales", href: "/catalogo?orden=price_asc" },
  { label: "Acerca de Nosotros", href: "/contacto" },
] as const;

const HOME_CATEGORY_ORDER = [
  "empaque",
  "abrasivos",
  "construccion",
  "herramienta",
  "limpieza",
  "equipo-de-seguridad",
  "oficina",
  "tornilleria",
  "renta",
] as const;

type DemoCategoryMeta = {
  blurb: string;
  subcategories: string[];
  callout: string;
};

const FALLBACK_META: DemoCategoryMeta = {
  blurb: "Suministro industrial para operacion, mantenimiento y compra recurrente.",
  subcategories: ["Linea general", "Consumibles", "Reposicion", "Entrega programada"],
  callout: "Inventario sujeto a disponibilidad.",
};

export const DEMO_CATEGORY_META: Record<string, DemoCategoryMeta> = {
  abrasivos: {
    blurb: "Desbaste, corte y acabado para taller, mantenimiento y metalmecanica.",
    subcategories: ["Discos de corte", "Lijas de agua", "Ruedas flap", "Cepillos de alambre"],
    callout: "Presentaciones para mantenimiento y produccion ligera.",
  },
  empaque: {
    blurb: "Cajas, cintas y proteccion para embarque, almacen y resguardo interno.",
    subcategories: ["Cajas corrugadas", "Cinta canela", "Pelicula stretch", "Burbuja", "Sobres de envio"],
    callout: "Ideal para operaciones logisticas y surtido diario.",
  },
  "equipo-de-seguridad": {
    blurb: "Proteccion personal para almacen, planta, reparto y cuadrillas operativas.",
    subcategories: ["Guantes", "Cascos", "Lentes", "Chalecos", "Proteccion auditiva"],
    callout: "Equipos con salida rapida para uso recurrente.",
  },
  limpieza: {
    blurb: "Higiene industrial para taller, oficinas, pasillos y zonas de proceso.",
    subcategories: ["Desengrasantes", "Toallas", "Jaladores", "Sanitizacion", "Contenedores"],
    callout: "Formatos concentrados y articulos de reposicion continua.",
  },
  construccion: {
    blurb: "Consumibles para obra, reparacion, delimitacion y seguridad temporal.",
    subcategories: ["Senalizacion", "Cintas preventivas", "Impermeabilizantes", "Selladores"],
    callout: "Material listo para cuadrillas y trabajos de campo.",
  },
  herramienta: {
    blurb: "Herramienta portatil y accesorios para mantenimiento electrico y mecanico.",
    subcategories: ["Taladros", "Llaves", "Dados", "Consumibles", "Herramienta manual"],
    callout: "Modelos orientados a operacion diaria.",
  },
  oficina: {
    blurb: "Mobiliario y abasto para espacios administrativos y areas de soporte.",
    subcategories: ["Sillas", "Archivo", "Papel", "Escritorio", "Consumibles"],
    callout: "Categorias para compras internas y reposicion mensual.",
  },
  tornilleria: {
    blurb: "Fijacion industrial para instalacion, montaje y mantenimiento general.",
    subcategories: ["Tornillo hexagonal", "Tuercas", "Rondanas", "Anclas", "Birlos"],
    callout: "Disponibilidad por pieza, paquete y volumen.",
  },
  renta: {
    blurb: "Activos de apoyo para trabajos temporales y necesidades programadas.",
    subcategories: ["Escaleras", "Andamios", "Extensiones", "Equipo auxiliar"],
    callout: "Servicio sujeto a programacion y cobertura.",
  },
  comestibles: {
    blurb: "Abasto basico para estaciones de cafe y consumo interno.",
    subcategories: ["Cafe", "Azucar", "Vasos", "Snacks"],
    callout: "Kits listos para oficinas y salas de juntas.",
  },
  fabricacion: {
    blurb: "Material para adecuaciones ligeras, soporte y fabricacion menor.",
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
