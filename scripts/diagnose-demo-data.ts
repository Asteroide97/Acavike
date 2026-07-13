import { getDemoCatalogDiagnostics } from "../lib/demo-data";

const diagnostics = getDemoCatalogDiagnostics();
const hasExpectedCatalogShape =
  diagnostics.totalCategories === 11 &&
  diagnostics.totalProducts === 44 &&
  diagnostics.totalFeatured === 8 &&
  diagnostics.empaqueProducts === 4 &&
  diagnostics.hasCajaProduct &&
  diagnostics.invalidCategorySlugs.length === 0 &&
  diagnostics.missingFields.length === 0;

console.log(
  JSON.stringify(
    {
      ...diagnostics,
      hasExpectedCatalogShape,
    },
    null,
    2,
  ),
);

if (!hasExpectedCatalogShape) {
  process.exitCode = 1;
}
