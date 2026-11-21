export const CATEGORY_IMAGE_PLACEHOLDER = "/placeholder-category.svg";
export const MAX_CATEGORY_IMAGE_BYTES = 4 * 1024 * 1024;
export const CATEGORY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateCategoryImageFile(file: { size: number; type: string; name: string }) {
  if (!file.size) return "Selecciona una imagen válida.";
  if (file.size > MAX_CATEGORY_IMAGE_BYTES) return "La imagen debe pesar como máximo 4 MB.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  const extensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"],
  };
  if (!extensions[file.type]?.includes(extension || "")) return "Formato no permitido. Usa JPG, PNG o WebP.";
  return null;
}

export function detectCategoryImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) && String.fromCharCode(...bytes.slice(12, 16)) === "IHDR") return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function categoryImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (url.length > 2048 || /[\\\u0000-\u0020]/.test(url)) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    if (!/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(parsed.hostname) || parsed.port) return null;
    return url;
  } catch { return null; }
}

export function parseCategoryImageField(value: FormDataEntryValue | null) {
  if (value !== null && typeof value !== "string") throw new Error("Se esperaba la URL de una fotografía ya cargada.");
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const safe = categoryImageUrl(raw);
  if (!safe) throw new Error("La URL de imagen no es válida. Sube una fotografía desde tu computadora.");
  return safe;
}
