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
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
```

Notas:

- Si existe `DATABASE_URL` y no activas `DEMO_MODE=true`, la app opera en modo real.
- Si quieres impedir el fallback automatico a demo cuando falta base, define `FORCE_REAL_MODE=true`.
- Si `FORCE_REAL_MODE=true` y falta `DATABASE_URL`, la app entra en `real-missing-database`.
- Para produccion real, siempre define `DATABASE_URL`.
- `BLOB_READ_WRITE_TOKEN` habilita la subida de imagenes de producto desde `/admin/productos`.

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

El seed reutiliza `prisma/seed.ts` y hace bootstrap seguro, sin limpiar tablas. Crea o actualiza:

- superadmin `admin@acavike.com` / `Admin123!`
- usuarios operativos basicos para pruebas internas
- cliente de prueba `cliente@acavike.com` / `Cliente123!`
- categorias base
- catalogo inicial para probar admin, carrito y checkout
- settings operativos para transferencia
- secciones publicas iniciales

## Admin

- URL: `/admin`
- En este modo el admin opera contra PostgreSQL real
- Si corres el seed inicial, puedes entrar con:

- `admin@acavike.com` / `Admin123!`

### Productos e imagenes

- `/admin/productos` ya opera contra Prisma cuando hay `DATABASE_URL`.
- El editor de producto permite subir imagenes a Vercel Blob.
- La ruta segura es `POST /api/admin/product-images`.
- Solo admite usuarios con rol `SUPERADMIN` o `ADMIN`.
- Formatos permitidos: JPG, PNG y WEBP.
- Limite recomendado para server uploads en Vercel: 4 MB por archivo.
- Despues de subir la imagen, guarda el producto para persistir la URL en `ProductImage`.

## Limitaciones y notas operativas

- `npm run db:migrate` usa `prisma migrate dev` y esta pensado para crear migraciones en desarrollo.
- Para despliegues reales, genera migraciones en desarrollo o staging y aplica en produccion con `npx prisma migrate deploy`.
- No uses SQLite para este modo.
- Al 5 de agosto de 2026 no hay una carpeta `prisma/migrations` comprometida en este repositorio; crea la migracion inicial en tu entorno antes de desplegar con `migrate deploy`.
- La subida de comprobantes de transferencia sigue usando almacenamiento local del servidor. Si vas a operar pedidos reales en Vercel, conviene migrarla tambien a Blob en un siguiente paso.
