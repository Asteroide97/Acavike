import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsfUploadPending() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-800">Constancia de Situación Fiscal (opcional)</p>
      <Button type="button" variant="outline" disabled aria-describedby="csf-upload-pending-help">
        <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
        Subir tu CSF
      </Button>
      <p id="csf-upload-pending-help" className="mt-2 text-xs text-slate-600">
        Próximamente: carga segura de CSF. Por ahora no se reciben documentos fiscales.
      </p>
    </div>
  );
}
