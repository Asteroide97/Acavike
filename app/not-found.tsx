import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="section-shell flex min-h-screen items-center justify-center py-24">
      <div className="surface max-w-xl p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-4 text-3xl font-semibold">No encontramos esta página</h1>
        <p className="mt-3 text-muted-foreground">
          Revisa la URL o vuelve al catálogo principal para continuar navegando.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            Ir al inicio
          </Link>
          <Link href="/catalogo" className={cn(buttonVariants({ variant: "outline" }))}>
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
