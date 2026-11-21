import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { createCategoryImageUploadHandler } from "@/lib/category-image-upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const POST = createCategoryImageUploadHandler({
  getUser: getCurrentUser,
  enabled: () => !DEMO_MODE && DATABASE_ENABLED,
  configured: () => Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() || process.env.VERCEL === "1" || process.env.VERCEL_ENV,
  ),
  categoryExists: async id => Boolean(await prisma.category.findUnique({ where: { id }, select: { id: true } })),
  putImage: async (pathname, file, contentType) => put(pathname, file, {
    access: "public", addRandomSuffix: true, contentType,
  }),
});
