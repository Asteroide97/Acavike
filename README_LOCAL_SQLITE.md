# README_LOCAL_SQLITE

## Cuando usar este modo

Usa este modo para:

- correr Acavike en laptop o equipo local con persistencia
- instalar la app en un VPS con disco persistente
- probar catalogo, clientes, pedidos y cotizaciones sin PostgreSQL

No uses este modo en Vercel. El filesystem serverless no garantiza persistencia para SQLite.

## Schema Prisma

- Schema local: `prisma/schema.sqlite.prisma`
- Provider: `sqlite`
- URL esperada: `file:./prisma/local.db`

El schema de SQLite replica el modelo funcional del schema de PostgreSQL, pero evita tipos nativos especificos de Postgres para no romper `prisma db push`.

## Variables de entorno

```env
DEMO_MODE="false"
DATABASE_URL="file:./prisma/local.db"
AUTH_SECRET="cambia-esta-clave"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Notas:

- `DEMO_MODE` debe quedar en `false` o ausente.
- `DATABASE_URL` sigue siendo la misma variable, pero con una URL SQLite local.
- Este modo requiere disco persistente.

## Comandos

Instalacion inicial:

```bash
npm install
npm run db:sqlite:push
npm run db:sqlite:seed
npm run dev
```

Abrir Prisma Studio con SQLite:

```bash
npx prisma studio --schema prisma/schema.sqlite.prisma
```

## Seed

El seed reutiliza `prisma/seed.ts`.

Comando:

```bash
npm run db:sqlite:seed
```

Ese script:

- genera el cliente Prisma con `prisma/schema.sqlite.prisma`
- corre `prisma db seed` contra SQLite

## Admin

- URL: `/admin`
- Inicio esperado: modo real local, ya con persistencia SQLite
- Credenciales seed:

- `admin@acavike.com` / `Admin123!`
- `manager@acavike.com` / `Admin123!`
- `warehouse@acavike.com` / `Admin123!`
- `ventas@acavike.com` / `Admin123!`
- `cliente@acavike.com` / `Cliente123!`

## Limitaciones

- No es una configuracion recomendada para Vercel.
- No es la opcion ideal para multiusuario intensivo o escalamiento.
- Si cambias de SQLite a PostgreSQL, vuelve a correr:

```bash
npm run db:generate
```

Esto regenera `@prisma/client` con el schema canonico de PostgreSQL.
