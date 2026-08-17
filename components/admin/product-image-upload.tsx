"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductImageUploadProps = {
  textareaId: string;
};

type UploadResponse =
  | {
      ok: true;
      line: string;
    }
  | {
      error: string;
    };

const placeholderLine = "/placeholder-product.svg|Imagen principal";

function mergeImageLines(currentValue: string, nextLine: string) {
  const existingLines = currentValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== placeholderLine && line !== "/placeholder-product.svg");

  if (!existingLines.includes(nextLine)) {
    existingLines.push(nextLine);
  }

  return existingLines.length ? existingLines.join("\n") : nextLine;
}

export function ProductImageUpload({ textareaId }: ProductImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload() {
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setFeedback({ type: "error", message: "Selecciona una imagen antes de subirla." });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (alt.trim()) {
          formData.append("alt", alt.trim());
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

        const textarea = document.getElementById(textareaId);
        if (!(textarea instanceof HTMLTextAreaElement)) {
          setFeedback({
            type: "error",
            message: "No se encontro el campo de imagenes del producto.",
          });
          return;
        }

        textarea.value = mergeImageLines(textarea.value, payload.line);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        if (fileRef.current) {
          fileRef.current.value = "";
        }

        setAlt("");
        setFeedback({
          type: "success",
          message: "Imagen subida. Guarda el producto para persistirla en la base.",
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
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
        <Input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" />
        <Input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="Texto alternativo opcional"
        />
        <Button type="button" variant="outline" onClick={handleUpload} disabled={isPending}>
          {isPending ? "Subiendo..." : "Subir imagen"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La ruta segura usa Vercel Blob y agrega la URL al campo inferior para guardarla en ProductImage.
      </p>
      {feedback ? (
        <p className={feedback.type === "error" ? "text-xs text-red-600" : "text-xs text-emerald-700"}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
