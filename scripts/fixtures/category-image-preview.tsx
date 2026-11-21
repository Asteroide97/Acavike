import { notFound } from "next/navigation";
import { CategoryImageUpload } from "@/components/admin/category-image-upload";
import { CategoryImage } from "@/components/public/category-image";

export default async function Preview({ searchParams }: { searchParams: Promise<{ image?: string; kind?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { image, kind } = await searchParams;
  const child = kind === "child";
  return <main className="admin-app min-h-screen p-4 md:p-8">
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{child ? "Editar subcategoría" : "Editar categoría"}</h1>
      <form action="/api/category-image-local-preview" method="POST" encType="multipart/form-data" className="admin-surface space-y-5 p-5 md:p-7">
        <input type="hidden" name="kind" value={kind || "root"} />
        <label className="block text-sm font-medium">Nombre<input readOnly className="public-input mt-2 w-full" value={child ? "Cintas adhesivas" : "Empaque"} /></label>
        {child ? <p className="text-sm text-slate-600">Categoría padre: Empaque</p> : null}
        <p className="text-sm font-medium">Imagen</p>
        <CategoryImageUpload initialImageUrl={image} categoryId={child ? "qa-child" : "qa-root"} />
        <button className="public-btn" type="submit">Guardar categoría</button>
      </form>
      <section className="admin-surface space-y-3 p-5"><h2 className="font-semibold">Vista en catálogo</h2><CategoryImage imageUrl={image} name={child ? "Cintas adhesivas" : "Empaque"} className="aspect-[4/3] w-48" /><p className="text-sm text-slate-500">Solo pruebas locales. No utiliza la base ni Blob de producción.</p></section>
    </div>
  </main>;
}
