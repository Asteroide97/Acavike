import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { ADMIN_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadSizeBytes = 4 * 1024 * 1024;
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
      { error: "Falta BLOB_READ_WRITE_TOKEN para habilitar la subida de imagenes." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona un archivo valido." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa JPG, PNG o WEBP." },
      { status: 400 },
    );
  }

  if (file.size > maxUploadSizeBytes) {
    return NextResponse.json(
      { error: "La imagen excede el limite de 4 MB recomendado para uploads server-side en Vercel." },
      { status: 400 },
    );
  }

  try {
    const fileName = sanitizeFileName(file.name);
    const pathname = `products/${new Date().toISOString().slice(0, 10)}/${fileName}`;
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
      alt: alt || file.name,
      line: `${blob.url}|${alt || file.name}`,
    });
  } catch {
    return NextResponse.json(
      { error: "No fue posible completar la subida a Vercel Blob." },
      { status: 500 },
    );
  }
}
