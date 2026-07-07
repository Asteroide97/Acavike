export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const HAS_DATABASE_URL = Boolean(process.env.DATABASE_URL);
export const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
export const DATABASE_ENABLED = !DEMO_MODE && HAS_DATABASE_URL;
export const APP_MODE = DEMO_MODE
  ? "demo"
  : HAS_DATABASE_URL
    ? "real"
    : "real-missing-database";
export const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "acavike-dev-secret";

export const RUNTIME_NOTICE =
  APP_MODE === "real-missing-database"
    ? {
        tone: "warning" as const,
        message:
          "Falta DATABASE_URL. La aplicacion usa estados seguros y no puede consultar la base real.",
      }
    : null;

export const DATABASE_CONFIG_ERROR =
  APP_MODE === "real-missing-database"
    ? "DATABASE_URL no esta configurada. Activa DEMO_MODE=true para usar el demo o define PostgreSQL para el modo real."
    : null;
