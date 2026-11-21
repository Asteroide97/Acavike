-- Additive only. Apply to production only after explicit owner approval.
ALTER TABLE "Product" ADD COLUMN "alegraId" TEXT;
ALTER TABLE "Product" ADD COLUMN "importReference" JSONB;
CREATE UNIQUE INDEX "Product_alegraId_key" ON "Product"("alegraId");
