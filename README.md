# Acavike Industrial

Catalogo B2B construido con `Next.js 15`, `TypeScript`, `App Router`, `Tailwind CSS` y `Prisma`.

La aplicacion mantiene el demo actual sin base obligatoria y deja preparada una ruta clara para SQLite local y PostgreSQL real.

## Modos de operacion

### 1. Demo sin base

- Uso recomendado: demo comercial en Vercel o muestras internas.
- Variables clave: `DEMO_MODE=true` y sin `DATABASE_URL`.
- Persistencia: no.
- Fuente de datos: `lib/demo-data.ts` y repositorios demo.
- Health esperado: `{"ok":true,"mode":"demo"}`.

Documentacion completa: [README_DEMO.md](C:/Users/joseh/OneDrive/Desktop/Acavike/README_DEMO.md)

### 2. Local con SQLite

- Uso recomendado: laptop, VPS con disco persistente o instalacion local de un cliente.
- Variables clave: `DEMO_MODE=false` y `DATABASE_URL="file:./prisma/local.db"`.
- Persistencia: si.
- Provider Prisma: `sqlite`.
- Schema Prisma: `prisma/schema.sqlite.prisma`.
- No usar en Vercel.

Documentacion completa: [README_LOCAL_SQLITE.md](C:/Users/joseh/OneDrive/Desktop/Acavike/README_LOCAL_SQLITE.md)

### 3. Produccion con PostgreSQL

- Uso recomendado: cliente real en hosting formal.
- Variables clave: `DEMO_MODE=false` y `DATABASE_URL="postgresql://..."`.
- Persistencia: si.
- Provider Prisma: `postgresql`.
- Schema Prisma canonico: `prisma/schema.prisma`.

Documentacion completa: [README_PRODUCTION.md](C:/Users/joseh/OneDrive/Desktop/Acavike/README_PRODUCTION.md)

## Decision tecnica sobre Prisma

- `prisma/schema.prisma` se conserva como schema canonico para PostgreSQL real.
- `prisma/schema.sqlite.prisma` replica el mismo modelo funcional para SQLite local.
- Esta fase no cambia la logica de runtime actual para inferir modos automaticamente.
- El demo-memory sigue entrando por `DEMO_MODE=true`.
- Si alguien deja `DEMO_MODE=false` y no define `DATABASE_URL`, la app mantiene el guardrail actual y responde con modo controlado `real-missing-database`.

Esto evita una migracion riesgosa y mantiene intacto el comportamiento del demo ya publicado.

## Scripts utiles

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
npm run db:sqlite:push
npm run db:sqlite:seed
```

## Notas de uso

- `npm run db:generate` genera el cliente Prisma usando `prisma/schema.prisma` de PostgreSQL.
- `npm run db:sqlite:push` y `npm run db:sqlite:seed` regeneran el cliente Prisma usando `prisma/schema.sqlite.prisma`.
- Si cambias de SQLite local a PostgreSQL o al flujo normal del repo, vuelve a correr `npm run db:generate`.
- `prisma/seed.ts` se reutiliza para SQLite y PostgreSQL porque el modelo funcional es el mismo.

## Acceso demo

Superadmin:

- `admin@acavike.com` / `Admin123!`

Usuarios demo adicionales:

- `manager@acavike.com` / `Admin123!`
- `warehouse@acavike.com` / `Admin123!`
- `ventas@acavike.com` / `Admin123!`
- `cliente@acavike.com` / `Cliente123!`
