import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createCatalogSku } from "../lib/catalog-sku";
import { catalogHref, categoryPath, descendantCategoryIds, orderedCategoryTree, parseCatalogFilters, visibleCategories } from "../lib/catalog-filters";
import { importSlug, planProductImport, reviewProductImport } from "../lib/product-import";
import { getCatalogPageDataRepository } from "../lib/repositories/catalog";

const categories = [
  { id: "r", name: "Empaque", slug: "empaque", parentId: null, isActive: true },
  { id: "c", name: "Cintas", slug: "cintas", parentId: "r", isActive: true },
  { id: "g", name: "Transparente", slug: "transparente", parentId: "c", isActive: true },
];
test("jerarquía: ancestros y descendientes a varias profundidades", () => {
  assert.deepEqual(descendantCategoryIds(categories, "r"), ["r", "c", "g"]);
  assert.deepEqual(categoryPath(categories, "g").map(category => category.id), ["r", "c", "g"]);
  assert.deepEqual(orderedCategoryTree([...categories].reverse()).map(category => category.id), ["r", "c", "g"]);
});
test("categorías inactivas, huérfanas y ciclos no aparecen", () => {
  assert.equal(visibleCategories(categories.map(category => category.id === "r" ? { ...category, isActive: false } : category)).length, 0);
  assert.equal(visibleCategories([{ ...categories[0], parentId: "missing" }]).length, 0);
  assert.equal(visibleCategories([{ ...categories[0], parentId: "g" }, ...categories.slice(1)]).length, 0);
});
test("parámetros inválidos no producen NaN ni orden arbitrario", () => {
  const filters = parseCatalogFilters({ min: "bad", max: "-1", orden: "sql", q: ["  cinta ", "ignored"] });
  assert.equal(filters.minPrice, undefined); assert.equal(filters.maxPrice, undefined);
  assert.equal(filters.sort, "custom"); assert.equal(filters.query, "cinta");
  assert.equal(parseCatalogFilters({ min: "0" }).minPrice, 0);
});
test("cambiar categoría conserva búsqueda, orden, precio y disponibilidad", () => {
  const href = catalogHref({ query: "cinta & caja", categorySlug: "", sort: "price_asc", minPrice: 0, maxPrice: 100, inStock: true }, "cintas");
  const url = new URL(href, "http://localhost");
  assert.equal(url.pathname, "/catalogo/cintas"); assert.equal(url.searchParams.get("q"), "cinta & caja"); assert.equal(url.searchParams.get("min"), "0");
});
test("demo: búsqueda por descripción, filtro de precio y categoría", async () => {
  assert.equal(process.env.DEMO_MODE, "true", "Estas pruebas nunca deben ejecutarse contra una base real");
  const all = await getCatalogPageDataRepository({ query: "", categorySlug: "", sort: "name_asc" });
  assert.equal(all.products.length, 44);
  const packaging = await getCatalogPageDataRepository({ query: "", categorySlug: "empaque", sort: "price_asc" });
  assert.equal(packaging.products.length, 4);
  assert.ok(packaging.products.every((product, i, list) => !i || Number(list[i - 1].price) <= Number(product.price)));
  const matches = await getCatalogPageDataRepository({ query: "", categorySlug: "", sort: "price_desc", minPrice: 100, maxPrice: 400, inStock: true });
  assert.ok(matches.products.every(product => Number(product.price) >= 100 && Number(product.price) <= 400 && product.stock > 0));
  const product = all.products.find(item => item.description?.trim());
  assert.ok(product);
  const search = await getCatalogPageDataRepository({ query: product.description!, categorySlug: "", sort: "featured" });
  assert.ok(search.products.some(item => item.id === product.id));
});
const hasSource = existsSync("output/catalog-review/import-review.json");
const source = hasSource ? JSON.parse(readFileSync("output/catalog-review/import-review.json", "utf8")) : {
  sourceFile: "test-only.xlsx", sourceSha256: "a".repeat(64), pricing: { publicPriceExcludesVat: true, discountReferenceOnly: true, ownerConfirmed: true },
  products: [{ sourceSheet: "Test", sourceRow: 1, alegraId: "TEST", name: "Test", description: null, publicPrice: "1.00", referenceDiscountPrice: "1.00", currency: "MXN", category: "Test", subcategory: "Test", sku: null, unit: null, verifiedStock: null, images: [] }],
};
test("Excel auditado: 25 referencias únicas, seis familias y 16 líneas", { skip: !hasSource }, () => {
  const { manifest, issues } = reviewProductImport(source);
  assert.equal(manifest.products.length, 25); assert.equal(new Set(manifest.products.map(row => row.alegraId)).size, 25);
  assert.equal(new Set(manifest.products.map(row => row.category)).size, 6);
  assert.equal(new Set(manifest.products.map(row => row.subcategory)).size, 16);
  assert.equal(issues.length, 50); assert.ok(manifest.products.every(row => row.verifiedStock === null && row.images.length === 0));
});
test("SKU automático: formato estable sin reutilizar identificadores", () => {
  const skus = Array.from({ length: 100 }, createCatalogSku);
  assert.ok(skus.every(sku => /^ACV-[A-F0-9]{16}$/.test(sku)));
  assert.equal(new Set(skus).size, skus.length);
});
test("no se importa sin confirmar IVA/precios ni con duplicados", () => {
  assert.throws(() => reviewProductImport({ ...source, pricing: { ...source.pricing, ownerConfirmed: false } }));
  assert.equal(reviewProductImport({ ...source, products: [source.products[0], source.products[0]] }).ready, false);
  assert.equal(importSlug("Protección y empaque"), "proteccion-y-empaque");
});
test("plan idempotente: omite ID existente y rechaza colisiones SKU sin sobrescribir", () => {
  const manifest = reviewProductImport(source).manifest;
  const row = { ...manifest.products[0], sku: "TEST-ONLY", unit: "TEST-ONLY" };
  const reviewed = { ...manifest, products: [row] };
  assert.equal(planProductImport(reviewed, []).create.length, 1);
  const existing = [{ alegraId: row.alegraId, sku: row.sku }];
  assert.equal(planProductImport(reviewed, existing).create.length, 0);
  assert.deepEqual(existing, [{ alegraId: row.alegraId, sku: row.sku }]);
  assert.throws(() => planProductImport(reviewed, [{ alegraId: "OTHER", sku: row.sku }]));
});
