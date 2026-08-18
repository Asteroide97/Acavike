import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { ADMIN_ROLES } from "@/lib/constants";
import { MAX_PRODUCT_IMAGE_SIZE_BYTES, PRODUCT_IMAGE_ALLOWED_MIME_TYPES } from "@/lib/product-images";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const extension = trimmed.includes(".") ? trimmed.split(".").pop()?.toLowerCase() || "bin" : "bin";
  const baseName = trimmed.replace(/\.[^.]+$/, "");
  const safeBaseName = slugify(baseName) || "producto";
  return `${safeBaseName}.${extension}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesion para subir imagenes." }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "No tienes permisos para subir imagenes de producto." }, { status: 403 });
  }

  if (DEMO_MODE || !DATABASE_ENABLED) {
    return NextResponse.json(
      { error: "La subida de imagenes solo esta disponible en modo real con base de datos activa." },
      { status: 400 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN no configurado" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const rawProductId = String(formData.get("productId") ?? "").trim();
  const productPathSegment = slugify(rawProductId) || "temp";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona un archivo valido." }, { status: 400 });
  }

  if (!PRODUCT_IMAGE_ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa JPG, JPEG, PNG, WEBP o SVG." },
      { status: 400 },
    );
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La imagen excede el limite de 5 MB por archivo." },
      { status: 400 },
    );
  }

  try {
    const fileName = sanitizeFileName(file.name);
    const pathname = `product-images/${productPathSegment}/${Date.now()}-${fileName}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      alt: alt || file.name,
    });
  } catch {
    return NextResponse.json(
      { error: "No fue posible completar la subida a Vercel Blob." },
      { status: 500 },
    );
  }
}
