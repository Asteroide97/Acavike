import { parseOrderInput, ProductOrderError, type OrderInput } from "@/lib/product-order";

export function createProductOrderHandler(deps: {
  getUser: () => Promise<{ role: string } | null>;
  save: (input: OrderInput) => Promise<{ version: number }>;
  revalidate: () => void;
}) {
  return async (request: Request) => {
    try {
      const user = await deps.getUser();
      if (!user) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
      if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return Response.json({ error: "No tienes permiso para ordenar productos." }, { status: 403 });
      if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Origen no permitido." }, { status: 403 });
      if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Formato de solicitud no válido." }, { status: 415 });
      const reader = request.body?.getReader();
      if (!reader) throw new ProductOrderError("La solicitud está vacía.");
      let size = 0; const parts: Uint8Array[] = [];
      try {
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          size += value.byteLength;
          if (size > 600000) { await reader.cancel(); throw new ProductOrderError("La solicitud es demasiado grande.", 413); }
          parts.push(value);
        }
      } finally { reader.releaseLock(); }
      let body: unknown;
      try { body = JSON.parse(Buffer.concat(parts).toString("utf8")); } catch { throw new ProductOrderError("La solicitud no contiene JSON válido."); }
      const input = parseOrderInput(body);
      const result = await deps.save(input);
      deps.revalidate();
      return Response.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof ProductOrderError) return Response.json({ error: error.message }, { status: error.status });
      return Response.json({ error: "No se pudo guardar el orden. Recarga para comprobar el estado actual." }, { status: 500 });
    }
  };
}
