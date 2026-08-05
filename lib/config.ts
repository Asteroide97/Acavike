const rawDemoMode = process.env.DEMO_MODE;

function normalizeEnvBoolean(value?: string) {
  if (!value) return false;

  const normalized = value
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export const HAS_DATABASE_URL = Boolean(process.env.DATABASE_URL);
export const FORCE_REAL_MODE = normalizeEnvBoolean(process.env.FORCE_REAL_MODE);
export const EXPLICIT_DEMO_MODE = normalizeEnvBoolean(rawDemoMode);
export const DEMO_MODE = EXPLICIT_DEMO_MODE || (!HAS_DATABASE_URL && !FORCE_REAL_MODE);
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
    ? "DATABASE_URL no esta configurada. Usa el demo por defecto, activa DEMO_MODE=true o define PostgreSQL para el modo real. Si necesitas bloquear el fallback demo, usa FORCE_REAL_MODE=true."
    : null;
