import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCategories, demoProducts, demoProductsBySlug, demoSiteSections } from "@/lib/demo-data";
import { getSiteSettingsMapRepository } from "@/lib/repositories/settings";

type SortOption = "featured" | "price_asc" | "price_desc" | "newest";

function filterAndSortDemoProducts(query: string, categorySlug: string, sort: SortOption) {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = demoProducts.filter((product) => {
    const matchesQuery = normalizedQuery
      ? [product.name, product.sku, product.brand || "", product.category.name]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;

    const matchesCategory = categorySlug ? product.category.slug === categorySlug : true;
    return product.isActive && matchesQuery && matchesCategory;
  });

  return filtered.sort((left, right) => {
    if (sort === "price_asc") {
      return Number(left.price) - Number(right.price);
    }

    if (sort === "price_desc") {
      return Number(right.price) - Number(left.price);
    }

    if (sort === "newest") {
      return right.createdAt.getTime() - left.createdAt.getTime();
    }

    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export async function getPublicNavigationDataRepository() {
  const settings = await getSiteSettingsMapRepository();

  if (DEMO_MODE) {
    return {
      categories: demoCategories.filter((category) => category.isActive).slice(0, 10),
      settings,
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      categories: [],
      settings,
    };
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 10,
  });

  return { categories, settings };
}

export async function getHomepageDataRepository() {
  if (DEMO_MODE) {
    return {
      sections: demoSiteSections,
      categories: demoCategories.filter((category) => category.isActive).slice(0, 6),
      featuredProducts: demoProducts.filter((product) => product.isFeatured).slice(0, 8),
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      sections: [],
      categories: [],
      featuredProducts: [],
    };
  }

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

export async function getCatalogPageDataRepository(input: {
  query: string;
  categorySlug: string;
  sort: SortOption;
}) {
  if (DEMO_MODE) {
    return {
      categories: demoCategories.filter((category) => category.isActive),
      products: filterAndSortDemoProducts(input.query, input.categorySlug, input.sort),
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      categories: [],
      products: [],
    };
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const orderBy =
    input.sort === "price_asc"
      ? { price: "asc" as const }
      : input.sort === "price_desc"
        ? { price: "desc" as const }
        : input.sort === "newest"
          ? { createdAt: "desc" as const }
          : { isFeatured: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: input.query
        ? [
            { name: { contains: input.query, mode: "insensitive" } },
            { sku: { contains: input.query, mode: "insensitive" } },
            { brand: { contains: input.query, mode: "insensitive" } },
            { category: { name: { contains: input.query, mode: "insensitive" } } },
          ]
        : undefined,
      category: input.categorySlug ? { slug: input.categorySlug } : undefined,
    },
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
    orderBy,
  });

  return { categories, products };
}

export async function getCategoryCatalogDataRepository(slug: string) {
  if (DEMO_MODE) {
    const category = demoCategories.find((item) => item.slug === slug) || null;
    const products = demoProducts.filter((product) => product.category.slug === slug && product.isActive);
    return { category, products };
  }

  if (!DATABASE_ENABLED) {
    return { category: null, products: [] };
  }

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    return { category: null, products: [] };
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
    },
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
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return { category, products };
}

export async function getProductDetailDataRepository(slug: string) {
  if (DEMO_MODE) {
    const product = demoProductsBySlug.get(slug) || null;
    const relatedProducts = product
      ? demoProducts
          .filter((item) => item.categoryId === product.categoryId && item.id !== product.id && item.isActive)
          .slice(0, 4)
      : [];
    return { product, relatedProducts };
  }

  if (!DATABASE_ENABLED) {
    return { product: null, relatedProducts: [] };
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      priceTiers: {
        orderBy: { minQuantity: "asc" },
      },
    },
  });

  if (!product) {
    return { product: null, relatedProducts: [] };
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      NOT: { id: product.id },
    },
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
    take: 4,
  });

  return { product, relatedProducts };
}

export async function listAdminProductsRepository() {
  if (DEMO_MODE) {
    return [...demoProducts].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminCategoriesRepository() {
  if (DEMO_MODE) {
    return demoCategories.map((category) => ({
      ...category,
      parent: null,
      _count: {
        products: demoProducts.filter((product) => product.categoryId === category.id).length,
        children: demoCategories.filter((child) => child.parentId === category.id).length,
      },
    }));
  }

  if (!DATABASE_ENABLED) {
    return [];
  }

  return prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
