import { randomUUID } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { ADMIN_ROLES } from "@/lib/constants";
import { categoryImageUrl, detectCategoryImageType, MAX_CATEGORY_IMAGE_BYTES, validateCategoryImageFile } from "@/lib/category-images";

type UploadDependencies = {
  getUser: () => Promise<{ role: UserRole } | null>;
  enabled: () => boolean;
  configured: () => boolean;
  categoryExists: (id: string) => Promise<boolean>;
  putImage: (pathname: string, file: File, contentType: string) => Promise<{ url: string; pathname: string }>;
};

const error = (message: string, status: number) => Response.json({ error: message }, { status });

async function boundedFormData(request: Request) {
  const limit = MAX_CATEGORY_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = Buffer.concat(chunks);
  return new Response(body, { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
}

export function createCategoryImageUploadHandler(deps: UploadDependencies) {
  return async function POST(request: Request) {
    try {
      const user = await deps.getUser();
      if (!user) return error("Debes iniciar sesión para subir imágenes.", 401);
      if (!ADMIN_ROLES.includes(user.role)) return error("No tienes permisos para modificar imágenes de categorías.", 403);
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) return error("Origen de solicitud no permitido.", 403);
      if (!deps.enabled()) return error("La carga de fotografías no está disponible en modo demo.", 400);
      let form: FormData | null;
      try { form = await boundedFormData(request); }
      catch { return error("No se pudo leer el archivo seleccionado.", 400); }
      if (!form) return error("La imagen debe pesar como máximo 4 MB.", 413);
      const file = form.get("file");
      if (!(file instanceof File) || form.getAll("file").length !== 1) return error("Selecciona una sola fotografía.", 400);
      const invalid = validateCategoryImageFile(file);
      if (invalid) return error(invalid, file.size > MAX_CATEGORY_IMAGE_BYTES ? 413 : 400);
      const type = detectCategoryImageType(new Uint8Array(await file.arrayBuffer()));
      if (!type || type !== file.type) return error("El contenido del archivo no corresponde a una imagen JPG, PNG o WebP válida.", 400);
      const categoryId = String(form.get("categoryId") || "").trim();
      if (categoryId && !/^[a-z0-9_-]{1,100}$/i.test(categoryId)) return error("La categoría no es válida.", 400);
      if (categoryId && !await deps.categoryExists(categoryId)) return error("La categoría ya no existe.", 404);
      if (!deps.configured()) return error("Blob no está configurado para este entorno.", 503);
      const extension = type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
      const pathname = `category-images/${categoryId || "temp"}/${randomUUID()}.${extension}`;
      const blob = await deps.putImage(pathname, file, type);
      if (!categoryImageUrl(blob.url)?.startsWith("https://")) return error("El almacenamiento devolvió una URL no válida.", 502);
      return Response.json({ ok: true, url: blob.url, pathname: blob.pathname, contentType: type, size: file.size });
    } catch {
      // SDK error messages may contain credentials or request headers.
      return error("No se pudo subir la imagen a Vercel Blob. Intenta de nuevo.", 500);
    }
  };
}
