"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_IMAGE_PLACEHOLDER, categoryImageUrl, validateCategoryImageFile } from "@/lib/category-images";

export function CategoryImageUpload({ initialImageUrl, categoryId, disabled = false }: {
  initialImageUrl?: string | null; categoryId?: string | null; disabled?: boolean;
}) {
  const [url, setUrl] = useState(initialImageUrl?.trim() || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [broken, setBroken] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const form = input.current?.form;
    const preventUnsavedUpload = (event: Event) => { if (pending.current) event.preventDefault(); };
    form?.addEventListener("submit", preventUnsavedUpload);
    return () => form?.removeEventListener("submit", preventUnsavedUpload);
  }, []);

  async function upload(file?: File) {
    if (!file || disabled || pending.current) return;
    const invalid = validateCategoryImageFile(file);
    if (invalid) { setMessage({ error: true, text: invalid }); if (input.current) input.current.value = ""; return; }
    pending.current = true;
    setBusy(true); setBroken(false);
    setMessage({ error: false, text: "Subiendo fotografía… Espera antes de guardar." });
    setPreview(URL.createObjectURL(file));
    try {
      const form = new FormData();
      form.append("file", file);
      if (categoryId) form.append("categoryId", categoryId);
      const response = await fetch("/api/admin/category-images", { method: "POST", body: form, credentials: "same-origin" });
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok || data.ok !== true || !categoryImageUrl(data.url)?.startsWith("https://")) {
        setPreview(null); setMessage({ error: true, text: data.error || "No se pudo subir la imagen." }); return;
      }
      setUrl(data.url); setPreview(null); setBroken(false);
      setMessage({ error: false, text: "Imagen lista. Guarda la categoría para conservar el cambio." });
    } catch {
      if (mounted.current) { setPreview(null); setMessage({ error: true, text: "No se pudo subir la imagen. Comprueba la conexión y la configuración de Blob." }); }
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); if (input.current) input.current.value = ""; }
    }
  }

  function remove() {
    if (disabled || busy) return;
    setUrl(""); setPreview(null); setBroken(false);
    setMessage({ error: false, text: "Imagen quitada del formulario. Guarda la categoría para confirmar." });
  }

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="imageUrl" value={url} readOnly />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Seleccionar fotografía de categoría" disabled={disabled || busy} onChange={event => void upload(event.target.files?.[0])} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Image src={broken ? CATEGORY_IMAGE_PLACEHOLDER : preview || categoryImageUrl(url) || CATEGORY_IMAGE_PLACEHOLDER} alt="Vista previa de la categoría" fill sizes="(max-width: 640px) 80vw, 160px" unoptimized className="object-contain p-3" onError={() => setBroken(true)} />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? "Subiendo…" : url ? "Reemplazar imagen" : "Subir imagen"}</Button>
            {url ? <Button type="button" variant="ghost" disabled={disabled || busy} onClick={remove}>Quitar imagen</Button> : null}
          </div>
          <p className="text-xs leading-5 text-slate-600">JPG, PNG o WebP. Máximo 4 MB. La fotografía se muestra completa, sin recortes.</p>
          {!url && !preview ? <p className="text-xs text-slate-500">Sin fotografía: se utilizará una imagen de referencia neutral.</p> : null}
          {disabled ? <p className="text-xs text-slate-500">Modo demo: carga y guardado deshabilitados.</p> : null}
          {message ? <p role={message.error ? "alert" : "status"} aria-live="polite" className={`text-xs ${message.error ? "text-red-700" : "text-emerald-700"}`}>{message.text}</p> : null}
        </div>
      </div>
    </div>
  );
}
