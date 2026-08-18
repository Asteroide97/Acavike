"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  PRODUCT_IMAGE_ALLOWED_MIME_TYPES,
  PRODUCT_IMAGE_PLACEHOLDER_URL,
  isSvgImageUrl,
  type EditableProductImage,
  normalizeEditableProductImages,
  serializeProductImagesInput,
} from "@/lib/product-images";

type ProductImageUploadProps = {
  initialImages?: EditableProductImage[];
  productId?: string | null;
};

type UploadResponse =
  | {
      ok: true;
      url: string;
      pathname: string;
      contentType: string | null;
      size: number;
      alt: string;
    }
  | {
      error: string;
    };

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) {
    return "";
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function buildImageAlt(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imagen de producto";
}

export function ProductImageUpload({ initialImages = [], productId }: ProductImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<EditableProductImage[]>(() =>
    normalizeEditableProductImages(initialImages),
  );
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const hiddenImagesValue = useMemo(() => serializeProductImagesInput(images), [images]);
  const remainingSlots = Math.max(0, MAX_PRODUCT_IMAGES - images.length);

  function updateImages(nextImages: EditableProductImage[]) {
    setImages(normalizeEditableProductImages(nextImages));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    const nextImages = [...images];
    const [image] = nextImages.splice(index, 1);
    nextImages.splice(nextIndex, 0, image);

    updateImages(
      nextImages.map((currentImage, currentIndex) => ({
        ...currentImage,
        sortOrder: currentIndex,
      })),
    );
  }

  function setPrimary(index: number) {
    if (index === 0) {
      return;
    }

    const nextImages = [...images];
    const [image] = nextImages.splice(index, 1);
    nextImages.unshift(image);

    updateImages(
      nextImages.map((currentImage, currentIndex) => ({
        ...currentImage,
        sortOrder: currentIndex,
      })),
    );
  }

  function removeImage(index: number) {
    updateImages(
      images
        .filter((_, currentIndex) => currentIndex !== index)
        .map((image, currentIndex) => ({
          ...image,
          sortOrder: currentIndex,
        })),
    );
  }

  function updateAlt(index: number, alt: string) {
    updateImages(
      images.map((image, currentIndex) =>
        currentIndex === index
          ? {
              ...image,
              alt,
            }
          : image,
      ),
    );
  }

  function handleUpload() {
    const files = Array.from(fileRef.current?.files ?? []);

    if (!files.length) {
      setFeedback({ type: "error", message: "Selecciona al menos una imagen antes de subirla." });
      return;
    }

    if (!remainingSlots) {
      setFeedback({ type: "error", message: `Solo puedes guardar hasta ${MAX_PRODUCT_IMAGES} imágenes por producto.` });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const invalidFile = filesToUpload.find(
      (file) =>
        !PRODUCT_IMAGE_ALLOWED_MIME_TYPES.has(file.type) || file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES,
    );

    if (invalidFile) {
      const validationMessage = !PRODUCT_IMAGE_ALLOWED_MIME_TYPES.has(invalidFile.type)
        ? "Formato no permitido. Usa JPG, JPEG, PNG, WEBP o SVG."
        : "Cada imagen debe pesar máximo 5 MB.";

      setFeedback({ type: "error", message: validationMessage });
      return;
    }

    startTransition(async () => {
      try {
        const uploadedImages: EditableProductImage[] = [];

        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("alt", buildImageAlt(file.name));
          if (productId) {
            formData.append("productId", productId);
          }

          const response = await fetch("/api/admin/product-images", {
            method: "POST",
            body: formData,
          });
          const payload = (await response.json()) as UploadResponse;

          if (!response.ok || !("ok" in payload)) {
            setFeedback({
              type: "error",
              message: "error" in payload ? payload.error : "No fue posible subir la imagen.",
            });
            return;
          }

          uploadedImages.push({
            url: payload.url,
            alt: payload.alt || buildImageAlt(file.name),
            sortOrder: images.length + uploadedImages.length,
            pathname: payload.pathname,
            contentType: payload.contentType,
            size: payload.size,
          });
        }

        updateImages([...images, ...uploadedImages]);

        if (fileRef.current) {
          fileRef.current.value = "";
        }

        setFeedback({
          type: "success",
          message:
            files.length > filesToUpload.length
              ? `Se subieron ${uploadedImages.length} imágenes. Se omitieron las excedentes por el límite de ${MAX_PRODUCT_IMAGES}.`
              : `Se subieron ${uploadedImages.length} imágenes. Guarda el producto para persistir la galería.`,
        });
      } catch {
        setFeedback({
          type: "error",
          message: "La subida fallo. Verifica Blob y vuelve a intentarlo.",
        });
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <input type="hidden" name="imagesJson" value={hiddenImagesValue} readOnly />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <Input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple />
        <Button type="button" variant="outline" onClick={handleUpload} disabled={isPending}>
          {isPending ? "Subiendo..." : "Subir imágenes"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La galería admite JPG, JPEG, PNG, WEBP y SVG de hasta 5 MB. La primera imagen se usará como principal.
      </p>
      <p className="text-xs text-slate-500">
        {images.length} / {MAX_PRODUCT_IMAGES} imágenes guardadas en el formulario.
      </p>

      {images.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div key={image.id || image.url} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-square border-b border-slate-200 bg-slate-50">
                <Image
                  src={image.url || PRODUCT_IMAGE_PLACEHOLDER_URL}
                  alt={image.alt || `Imagen ${index + 1}`}
                  fill
                  className="object-contain p-3"
                  unoptimized={isSvgImageUrl(image.url || PRODUCT_IMAGE_PLACEHOLDER_URL)}
                />
                {index === 0 ? (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    Principal
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 p-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Alt text
                  </label>
                  <Input
                    value={image.alt ?? ""}
                    onChange={(event) => updateAlt(index, event.target.value)}
                    placeholder={`Imagen ${index + 1}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Orden {index + 1}</span>
                  {image.size ? <span>{formatBytes(image.size)}</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {index > 0 ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setPrimary(index)}>
                      Principal
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                  >
                    Subir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                  >
                    Bajar
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => removeImage(index)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Este producto no tiene imágenes guardadas. Si no agregas ninguna, el sitio público usará el fallback
          <span className="font-semibold"> /placeholder-product.svg</span>.
        </div>
      )}

      {feedback ? (
        <p className={feedback.type === "error" ? "text-xs text-red-600" : "text-xs text-emerald-700"}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
