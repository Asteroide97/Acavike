import { prisma } from "@/lib/prisma";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCategories, demoProducts, demoProductsBySlug, demoSiteSections } from "@/lib/demo-data";
import { productImageSelect } from "@/lib/product-images";
import { getSiteSettingsMapRepository } from "@/lib/repositories/settings";
import { descendantCategoryIds, visibleCategories, type CatalogFilters, type CatalogSort } from "@/lib/catalog-filters";
import { sortCustomProducts } from "@/lib/product-order";
import { getCustomOrderEntriesRepository } from "@/lib/repositories/product-order";

type SortOption = CatalogSort;

function filterAndSortDemoProducts(query: string, categorySlug: string, sort: SortOption) {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = demoProducts.filter((product) => {
    const matchesQuery = normalizedQuery
      ? [product.name, product.sku, product.brand || "", product.description || "", product.shortDescription || "", product.alegraId || "", product.category.name]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;

    const matchesCategory = categorySlug ? product.category.slug === categorySlug : true;
    return product.isActive && matchesQuery && matchesCategory;
  });

  if (sort === "custom") return sortCustomProducts(filtered, []);
  return filtered.sort((left, right) => {
    if (sort === "name_asc" || sort === "name_desc") return left.name.localeCompare(right.name, "es") * (sort === "name_desc" ? -1 : 1);
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
      categories: demoCategories.filter((category) => category.isActive),
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
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: {
          select: productImageSelect,
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

export async function getCatalogPageDataRepository(input: CatalogFilters) {
  if (DEMO_MODE) {
    const categories = visibleCategories(demoCategories);
    const selected = categories.find(category => category.slug === input.categorySlug);
    const ids = selected ? descendantCategoryIds(categories, selected.id) : [];
    return {
      categories,
      products: filterAndSortDemoProducts(input.query, "", input.sort).filter(product =>
        categories.some(category => category.id === product.categoryId) &&
        (!input.categorySlug || ids.includes(product.categoryId)) &&
        (!input.inStock || product.stock > 0) &&
        (input.minPrice === undefined || Number(product.price) >= input.minPrice) &&
        (input.maxPrice === undefined || Number(product.price) <= input.maxPrice)),
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      categories: [],
      products: [],
    };
  }

  const allCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const categories = visibleCategories(allCategories);
  const selected = categories.find(category => category.slug === input.categorySlug);
  const ids = input.categorySlug ? selected ? descendantCategoryIds(categories, selected.id) : [] : categories.map(category => category.id);

  const orderBy =
    input.sort === "price_asc"
      ? { price: "asc" as const }
      : input.sort === "price_desc"
        ? { price: "desc" as const }
        : input.sort === "name_asc"
          ? { name: "asc" as const }
          : input.sort === "name_desc"
            ? { name: "desc" as const }
        : input.sort === "newest"
          ? { createdAt: "desc" as const }
          : input.sort === "custom" ? { createdAt: "asc" as const } : { isFeatured: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: input.query
        ? [
            { name: { contains: input.query, mode: "insensitive" } },
            { sku: { contains: input.query, mode: "insensitive" } },
            { description: { contains: input.query, mode: "insensitive" } },
            { shortDescription: { contains: input.query, mode: "insensitive" } },
            { alegraId: { contains: input.query, mode: "insensitive" } },
            { brand: { contains: input.query, mode: "insensitive" } },
            { category: { name: { contains: input.query, mode: "insensitive" } } },
          ]
        : undefined,
      categoryId: { in: ids },
      stock: input.inStock ? { gt: 0 } : undefined,
      price: { gte: input.minPrice, lte: input.maxPrice },
    },
    include: {
      images: {
        select: productImageSelect,
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      category: true,
      priceTiers: {
        orderBy: { minQuantity: "asc" },
      },
    },
    orderBy: [orderBy, { id: "asc" }],
  });

  return { categories, products: input.sort === "custom" ? sortCustomProducts(products, await getCustomOrderEntriesRepository(selected?.id || null)) : products };
}

export async function getCategoryCatalogDataRepository(slug: string) {
  if (DEMO_MODE) {
    const category = demoCategories.find((item) => item.slug === slug) || null;
    const products = sortCustomProducts(demoProducts.filter((product) => product.category.slug === slug && product.isActive), []);
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
        select: productImageSelect,
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

  return { category, products: sortCustomProducts(products, await getCustomOrderEntriesRepository(category.id)) };
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
        select: productImageSelect,
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
        select: productImageSelect,
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
