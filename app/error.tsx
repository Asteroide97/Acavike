"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="surface max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Ocurrió un error inesperado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {error.message || "Intenta de nuevo. Si el problema persiste, revisa la configuración del proyecto."}
          </p>
          <Button className="mt-6" onClick={() => reset()}>
            Intentar de nuevo
          </Button>
        </div>
      </body>
    </html>
  );
}
