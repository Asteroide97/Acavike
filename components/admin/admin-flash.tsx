import { Alert } from "@/components/ui/alert";
import { getStatusParam } from "@/lib/utils";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function AdminFlash({ searchParams }: { searchParams: SearchParamsRecord }) {
  const error = getStatusParam(searchParams, "error");
  const denied = getStatusParam(searchParams, "denied");
  const saved = getStatusParam(searchParams, "saved");
  const deleted = getStatusParam(searchParams, "deleted");
  const converted = getStatusParam(searchParams, "converted");

  if (error) {
    return <Alert tone="danger">{error}</Alert>;
  }

  if (denied) {
    return <Alert tone="warning">Tu rol no tiene permisos para acceder a esta seccion.</Alert>;
  }

  if (deleted) {
    return <Alert tone="success">El registro se elimino correctamente.</Alert>;
  }

  if (converted) {
    return <Alert tone="success">La cotizacion se convirtio en pedido correctamente.</Alert>;
  }

  if (saved) {
    return <Alert tone="success">Los cambios se guardaron correctamente.</Alert>;
  }

  return null;
}
