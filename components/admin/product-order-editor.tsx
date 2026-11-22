"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryPath, descendantCategoryIds, orderedCategoryTree, type CatalogCategory } from "@/lib/catalog-filters";
import { MAX_ORDER_PRODUCTS, moveOrderedItem } from "@/lib/product-order";

export type OrderProductCard = { id: string; name: string; sku: string; imageUrl: string; isActive: boolean };
const PAGE_SIZE = 12;

export function ProductOrderEditor({ categories, products, categoryId, initialVersion, demoMode, available }: {
  categories: CatalogCategory[]; products: OrderProductCard[]; categoryId: string | null; initialVersion: number; demoMode: boolean; available: boolean;
}) {
  const router = useRouter();
  const [ids, setIds] = useState(products.map(product => product.id));
  const [baseline, setBaseline] = useState(ids);
  const [version, setVersion] = useState(initialVersion);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const dirty = ids.some((id, index) => id !== baseline[index]);
  const canEdit = available && products.length <= MAX_ORDER_PRODUCTS;
  const byId = new Map(products.map(product => [product.id, product]));
  const filtered = ids.filter(id => `${byId.get(id)?.name} ${byId.get(id)?.sku}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount);
  const shown = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const rootId = categoryId ? categoryPath(categories, categoryId)[0]?.id || "" : "";
  const childIds = rootId ? descendantCategoryIds(categories, rootId) : [];
  const children = orderedCategoryTree(categories).filter(category => category.id !== rootId && childIds.includes(category.id));

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const leave = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (anchor && !window.confirm("Hay cambios de orden sin guardar. ¿Quieres salir y descartarlos?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", leave, true); };
  }, [dirty]);

  function selectScope(value: string) {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y cambiar de categoría?")) return;
    router.push(`/admin/productos/ordenar${value ? `?categoria=${encodeURIComponent(value)}` : ""}`);
  }

  function move(id: string, to: number) {
    if (busy || !canEdit) return;
    const from = ids.indexOf(id);
    if (to < 0 || to >= ids.length || from < 0) return;
    setIds(moveOrderedItem(ids, from, to)); setError(false);
    if (!query) setPage(Math.floor(to / PAGE_SIZE) + 1);
    setMessage(`${byId.get(id)?.name}: posición ${to + 1} de ${ids.length}. Cambios sin guardar.`);
  }

  async function save() {
    if (busy || !dirty || !canEdit) return;
    setBusy(true); setError(false);
    try {
      if (demoMode) { setBaseline([...ids]); setMessage("Orden simulado. En modo demo no se conserva al recargar ni cambia el catálogo público."); return; }
      const response = await fetch("/api/admin/product-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ categoryId, version, productIds: ids }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !Number.isSafeInteger(result.version)) throw new Error(result.error || "No se pudo confirmar el guardado. Recarga para comprobar el orden.");
      setVersion(result.version); setBaseline([...ids]); setMessage("Orden guardado correctamente. Ya puedes recargar para comprobarlo.");
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "No se pudo guardar el orden."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4" aria-busy={busy}>
    <div className="admin-surface grid gap-4 p-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">Categoría<select disabled={busy} aria-label="Categoría" className="public-select" value={rootId} onChange={event => selectScope(event.target.value)}><option value="">Todo el catálogo</option>{categories.filter(category => !category.parentId).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold">Subcategoría<select aria-label="Subcategoría" disabled={busy || !rootId || !children.length} className="public-select disabled:opacity-60" value={categoryId !== rootId ? categoryId || "" : ""} onChange={event => selectScope(event.target.value || rootId)}><option value="">Toda la categoría</option>{children.map(category => <option key={category.id} value={category.id}>{categoryPath(categories, category.id).slice(1).map(part => part.name).join(" / ")}</option>)}</select></label>
      <p className="text-sm text-muted-foreground sm:col-span-2">Cada ámbito conserva su propio orden. Una categoría incluye sus subcategorías; ordenarla no altera el orden guardado en ellas. También se muestran productos inactivos.</p>
    </div>
    {!available ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Ordenación no disponible. Verifica la conexión y la migración aditiva antes de habilitar el guardado.</p> : null}
    {products.length > MAX_ORDER_PRODUCTS ? <p role="alert">Este ámbito supera 5000 productos. Selecciona una categoría más específica.</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="grid w-full gap-1 text-sm sm:w-80">Buscar nombre o SKU<input className="public-input" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label>
      <p className="text-sm text-muted-foreground">{filtered.length} de {ids.length} productos · {dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}</p>
    </div>
    <p className="text-xs text-muted-foreground">Arrastra desde el control o usa Subir/Bajar. Con el control enfocado: Alt + ↑/↓ para mover; Alt + Inicio/Fin para llevar al principio/final. La búsqueda y la paginación no eliminan productos del orden.</p>
    <ol className="grid gap-2" aria-label="Orden de productos">
      {shown.map(id => {
        const product = byId.get(id)!; const index = ids.indexOf(id);
        return <li key={id} data-product-id={id} className="grid min-w-0 grid-cols-[auto_48px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-white p-3 sm:grid-cols-[auto_48px_minmax(0,1fr)_auto]" onDragOver={event => { if (canEdit && !busy) event.preventDefault(); }} onDrop={event => { event.preventDefault(); const dragged = event.dataTransfer.getData("text/plain"); if (dragged === dragId) move(dragged, index); setDragId(null); }}>
          <button type="button" draggable={canEdit && !busy} disabled={!canEdit || busy} aria-label={`Mover ${product.sku}`} title="Arrastrar o usar Alt + flechas / Inicio / Fin" className="cursor-grab rounded-md p-2 text-primary focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing disabled:opacity-50" onDragStart={event => { setDragId(id); event.dataTransfer.setData("text/plain", id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragId(null)} onKeyDown={event => {
            if (!event.altKey || !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
            event.preventDefault(); move(id, event.key === "Home" ? 0 : event.key === "End" ? ids.length - 1 : index + (event.key === "ArrowUp" ? -1 : 1));
          }}><GripVertical size={20} aria-hidden="true" /></button>
          <Image src={product.imageUrl} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded border bg-white object-contain p-1" onError={event => { event.currentTarget.src = "/placeholder-product.svg"; }} />
          <div className="min-w-0"><p className="break-words text-sm font-semibold">{product.name}</p><p className="break-all text-xs text-muted-foreground">{product.sku}{!product.isActive ? " · Inactivo" : ""}</p><p className="text-xs text-primary">Posición {index + 1}</p></div>
          <div className="col-span-3 flex gap-2 justify-self-end sm:col-span-1"><Button size="sm" variant="outline" aria-label={`Subir ${product.sku}`} disabled={busy || !canEdit || index === 0} onClick={() => move(id, index - 1)}><ArrowUp size={14} className="mr-1" />Subir</Button><Button size="sm" variant="outline" aria-label={`Bajar ${product.sku}`} disabled={busy || !canEdit || index === ids.length - 1} onClick={() => move(id, index + 1)}><ArrowDown size={14} className="mr-1" />Bajar</Button></div>
        </li>;
      })}
    </ol>
    {!shown.length ? <p className="admin-surface p-8 text-center">No hay productos para esta selección.</p> : null}
    <nav aria-label="Páginas de ordenación" className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>Anterior</Button><span className="text-sm">Página {activePage} de {pageCount}</span><Button variant="outline" size="sm" disabled={activePage === pageCount} onClick={() => setPage(activePage + 1)}>Siguiente</Button></nav>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-panel">
      <Button disabled={busy || !dirty || !canEdit} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar orden"}</Button>
      <Button variant="outline" disabled={busy || !dirty} onClick={() => { setIds([...baseline]); setPage(1); setMessage("Cambios cancelados. Se recuperó el último orden guardado."); setError(false); }}>Cancelar cambios</Button>
      <button type="button" className="text-sm text-primary underline" disabled={busy} onClick={() => { if (!dirty || window.confirm("¿Descartar los cambios y recargar?")) window.location.reload(); }}>Recargar</button>
      {demoMode ? <span className="text-xs text-muted-foreground">Modo demo: acciones simuladas, sin persistencia.</span> : null}
    </div>
    <p role={error ? "alert" : "status"} aria-live="polite" className={`text-sm ${error ? "text-red-700" : "text-primary"}`}>{message}</p>
  </div>;
}
