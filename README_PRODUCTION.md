# README_PRODUCTION

## Cuando usar este modo

Usa este modo para:

- despliegues reales de clientes
- hosting formal con base de datos administrada
- operacion persistente de catalogo, pedidos, clientes, pagos por transferencia y cotizaciones

Este es el modo canonico de produccion.

## Schema Prisma

- Schema canonico: `prisma/schema.prisma`
- Provider: `postgresql`
- URL esperada: `postgresql://...`

`prisma/schema.prisma` se mantiene como fuente principal de verdad para instalaciones reales.

## Variables de entorno

```env
DEMO_MODE="false"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acavike?schema=public"
AUTH_SECRET="cambia-esta-clave"
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
```

Notas:

- Si `DEMO_MODE=false` y falta `DATABASE_URL`, la app conserva el guardrail actual y entra en `real-missing-database`.
- Para produccion real, siempre define `DATABASE_URL`.

## Comandos

Preparacion local o staging:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run build
```

Inicio local:

```bash
npm run start
```

Aplicacion de migraciones ya comprometidas en un servidor real:

```bash
npx prisma migrate deploy
```

Studio:

```bash
npm run db:studio
```

## Seed

Seed inicial:

```bash
npm run db:seed
```

El seed reutiliza `prisma/seed.ts` y crea:

- usuarios demo/admin
- categorias y productos base
- pedidos, cotizaciones y settings iniciales

## Admin

- URL: `/admin`
- En este modo el admin opera contra PostgreSQL real
- Si corres el seed inicial, puedes entrar con:

- `admin@acavike.com` / `Admin123!`

## Limitaciones y notas operativas

- `npm run db:migrate` usa `prisma migrate dev` y esta pensado para crear migraciones en desarrollo.
- Para despliegues reales, genera migraciones en desarrollo o staging y aplica en produccion con `npx prisma migrate deploy`.
- No uses SQLite para este modo.
