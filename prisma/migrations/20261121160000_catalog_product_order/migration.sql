-- Add independent ordering scopes without updating any existing product.
CREATE TABLE "CatalogOrderScope" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CatalogOrderScope_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogOrderScope_version_check" CHECK ("version" >= 0)
);

CREATE TABLE "CatalogProductOrder" (
    "scopeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "CatalogProductOrder_pkey" PRIMARY KEY ("scopeId", "productId"),
    CONSTRAINT "CatalogProductOrder_position_check" CHECK ("position" >= 0)
);

CREATE UNIQUE INDEX "CatalogOrderScope_categoryId_key" ON "CatalogOrderScope"("categoryId");
CREATE UNIQUE INDEX "CatalogProductOrder_scopeId_position_key" ON "CatalogProductOrder"("scopeId", "position");
CREATE INDEX "CatalogProductOrder_productId_idx" ON "CatalogProductOrder"("productId");

ALTER TABLE "CatalogOrderScope" ADD CONSTRAINT "CatalogOrderScope_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogProductOrder" ADD CONSTRAINT "CatalogProductOrder_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "CatalogOrderScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogProductOrder" ADD CONSTRAINT "CatalogProductOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
