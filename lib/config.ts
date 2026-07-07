export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
export const DATABASE_ENABLED = !DEMO_MODE && DATABASE_URL.length > 0;
export const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "acavike-dev-secret";

export const RUNTIME_NOTICE = DEMO_MODE
  ? {
      tone: "info" as const,
      message: "Modo demo activo. Los datos y acciones se muestran de forma simulada.",
    }
  : !DATABASE_ENABLED
    ? {
        tone: "warning" as const,
        message:
          "Falta DATABASE_URL. La aplicacion usa estados seguros y no puede consultar la base real.",
      }
    : null;

export const DATABASE_CONFIG_ERROR =
  !DEMO_MODE && !DATABASE_ENABLED
    ? "DATABASE_URL no esta configurada. Activa DEMO_MODE=true para usar el demo o define PostgreSQL para el modo real."
    : null;
