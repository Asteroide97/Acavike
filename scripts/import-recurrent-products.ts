import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { importSlug, planProductImport, reviewProductImport } from "../lib/product-import";

async function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => args[args.indexOf(name) + 1];
  if (!args.includes("--file")) throw new Error("Indica --file con el manifiesto revisado.");
  const review = reviewProductImport(JSON.parse(fs.readFileSync(option("--file"), "utf8")));
  console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply-requested" : "plan-only", products: review.manifest.products.length, issues: review.issues, ready: review.ready }, null, 2));
  if (!args.includes("--apply")) return;
  if (!review.ready) throw new Error("Importación bloqueada: completa SKU y unidad de venta sin inventar datos.");
  if (!args.includes("--owner-approved") || !args.includes("--expected-host") || !args.includes("--expected-database")) throw new Error("Se requiere autorización y destino explícitos.");
  const url = process.env.ACAVIKE_IMPORT_DATABASE_URL;
  if (!url) throw new Error("Proporciona ACAVIKE_IMPORT_DATABASE_URL mediante un mecanismo privado. No se usan .env ni DATABASE_URL implícitos.");
  const target = new URL(url);
  if (!["postgres:", "postgresql:"].includes(target.protocol) || target.hostname !== option("--expected-host") || decodeURIComponent(target.pathname.slice(1)) !== option("--expected-database") || target.searchParams.get("sslmode") !== "require") throw new Error("Destino o TLS no coinciden con la autorización.");
  if (!["localhost", "127.0.0.1"].includes(target.hostname) && !args.includes("--allow-remote")) throw new Error("La escritura remota requiere --allow-remote y aprobación específica.");
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  try {
    const result = await db.$transaction(async tx => {
      const [identity] = await tx.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
      if (identity.database !== option("--expected-database")) throw new Error("Identidad de base inesperada.");
      const [tls] = await tx.$queryRaw<Array<{ ssl: boolean }>>`SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()`;
      if (!tls?.ssl) throw new Error("TLS no está activo.");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261121, 25)`;
      const rows = review.manifest.products;
      const existing = await tx.product.findMany({ where: { OR: [{ alegraId: { in: rows.map(row => row.alegraId) } }, { sku: { in: rows.map(row => row.sku!) } }] }, select: { id: true, alegraId: true, sku: true } });
      let created = 0;
      const { create, skipped } = planProductImport(review.manifest, existing);
      for (const row of create) {
        async function category(name: string, parentId: string | null, parentName = "") {
          const slug = importSlug(parentName ? `${parentName}-${name}` : name);
          const found = await tx.category.findUnique({ where: { slug } });
          if (found && (found.parentId !== parentId || found.name !== name)) throw new Error("Colisión en jerarquía; operación revertida.");
          return found ?? tx.category.create({ data: { name, slug, parentId, isActive: false } });
        }
        const root = await category(row.category, null);
        const leaf = await category(row.subcategory, root.id, row.category);
        await tx.product.create({ data: {
          alegraId: row.alegraId, sku: row.sku!, name: row.name,
          slug: `${importSlug(row.name)}-${importSlug(row.alegraId)}`, categoryId: leaf.id,
          description: row.description, price: row.publicPrice, unit: row.unit!,
          ...(row.verifiedStock !== null ? { stock: row.verifiedStock } : {}),
          isActive: false, isFeatured: false,
          importReference: { sourceFile: review.manifest.sourceFile, sha256: review.manifest.sourceSha256, sourceSheet: row.sourceSheet, sourceRow: row.sourceRow,
            referenceDiscountPrice: row.referenceDiscountPrice, currency: row.currency, priceExcludesVat: true, discountsEnabled: false,
            inventoryVerified: row.verifiedStock !== null, originalStock: row.verifiedStock, publication: "draft" },
        } });
        created++;
      }
      if (created) await tx.auditLog.create({ data: { action: "PRODUCT_IMPORT_DRAFT", entity: "product", metadata: { sourceSha256: review.manifest.sourceSha256, created, skipped } } });
      return { created, skipped, publication: "INACTIVE_DRAFTS_ONLY" };
    }, { timeout: 60000 });
    console.log(JSON.stringify(result));
  } finally { await db.$disconnect(); }
}

main().catch(() => { console.error("IMPORT_FAILED: revisión, permisos, esquema o conflicto. Transacción sin cambios parciales; no se muestran credenciales."); process.exitCode = 1; });
