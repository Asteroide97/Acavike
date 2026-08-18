import { parseLines } from "@/lib/utils";

export const PRODUCT_IMAGE_PLACEHOLDER_URL = "/placeholder-product.svg";
export const MAX_PRODUCT_IMAGES = 8;
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

export const productImageSelect = {
  id: true,
  url: true,
  alt: true,
  sortOrder: true,
} as const;

export type ProductImageRecord = {
  id?: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  createdAt?: Date;
};

export type EditableProductImage = ProductImageRecord & {
  pathname?: string | null;
  contentType?: string | null;
  size?: number | null;
};

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toSafeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isPlaceholderProductImageUrl(url?: string | null) {
  return toTrimmedString(url) === PRODUCT_IMAGE_PLACEHOLDER_URL;
}

export function isSvgImageUrl(url?: string | null) {
  return /\.svg(?:$|[?#])/i.test(toTrimmedString(url));
}

export function normalizeEditableProductImages(input: unknown, maxImages = MAX_PRODUCT_IMAGES) {
  const items = Array.isArray(input) ? input : [];

  const normalized = items
    .flatMap((item, index) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const image = item as Record<string, unknown>;
      const url = toTrimmedString(image.url);
      if (!url) {
        return [];
      }

      const id = toTrimmedString(image.id) || undefined;
      const alt = toTrimmedString(image.alt);
      const pathname = toTrimmedString(image.pathname) || null;
      const contentType = toTrimmedString(image.contentType) || null;
      const sizeValue =
        typeof image.size === "number" || typeof image.size === "string" ? Number(image.size) : null;
      const size = sizeValue !== null && Number.isFinite(sizeValue) ? sizeValue : null;

      return [
        {
          id,
          url,
          alt,
          sortOrder: toSafeNumber(image.sortOrder, index),
          pathname,
          contentType,
          size,
        } satisfies EditableProductImage,
      ];
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const realImages = normalized.filter((image) => !isPlaceholderProductImageUrl(image.url));
  const filtered = realImages.length ? realImages : [];
  const seenUrls = new Set<string>();
  const deduped: EditableProductImage[] = [];

  for (const image of filtered) {
    const urlKey = image.url.toLowerCase();
    if (seenUrls.has(urlKey)) {
      continue;
    }

    seenUrls.add(urlKey);
    deduped.push({
      ...image,
      sortOrder: deduped.length,
    });

    if (deduped.length >= maxImages) {
      break;
    }
  }

  return deduped;
}

export function parseLegacyProductImages(value: string) {
  return normalizeEditableProductImages(
    parseLines(value).map((line, index) => {
      const [url, alt] = line.split("|").map((part) => part.trim());

      return {
        url,
        alt: alt || "",
        sortOrder: index,
      };
    }),
  );
}

export function parseProductImagesJson(value: string) {
  if (!value.trim()) {
    return [];
  }

  try {
    return normalizeEditableProductImages(JSON.parse(value));
  } catch {
    return [];
  }
}

export function serializeProductImagesInput(images: EditableProductImage[]) {
  return JSON.stringify(
    normalizeEditableProductImages(images).map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
      pathname: image.pathname ?? null,
      contentType: image.contentType ?? null,
      size: image.size ?? null,
    })),
  );
}

export function getPrimaryProductImage(
  images: Array<Pick<ProductImageRecord, "url" | "alt">> | null | undefined,
  fallbackAlt: string,
) {
  const safeImages = Array.isArray(images) ? images : [];
  const preferredImage =
    safeImages.find((image) => toTrimmedString(image?.url) && !isPlaceholderProductImageUrl(image?.url)) ||
    safeImages.find((image) => toTrimmedString(image?.url)) ||
    null;

  const url = preferredImage?.url?.trim() || PRODUCT_IMAGE_PLACEHOLDER_URL;
  const alt = preferredImage?.alt?.trim() || fallbackAlt;

  return {
    url,
    alt,
    unoptimized: isSvgImageUrl(url),
  };
}
