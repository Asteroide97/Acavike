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
EMAIL_FROM="Acavike <ventas@acavike.com>"
SALES_EMAIL="ventas@acavike.com"
RESEND_API_KEY="re_..."
BLOB_STORE_ID="store_..."
# Opcional si no usas Blob conectado con OIDC en Vercel:
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Notas:

- Si existe `DATABASE_URL` y no activas `DEMO_MODE=true`, la app opera en modo real.
- Si quieres impedir el fallback automatico a demo cuando falta base, define `FORCE_REAL_MODE=true`.
- Si `FORCE_REAL_MODE=true` y falta `DATABASE_URL`, la app entra en `real-missing-database`.
- Para produccion real, siempre define `DATABASE_URL`.
- `BLOB_STORE_ID` o `BLOB_READ_WRITE_TOKEN` habilitan la subida a Vercel Blob.
- En proyectos conectados a Blob con OIDC en Vercel, `BLOB_STORE_ID` suele ser suficiente.
- `EMAIL_FROM`, `SALES_EMAIL` y `RESEND_API_KEY` habilitan correos transaccionales no bloqueantes para pedidos y validaciones de pago.

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

### Pedidos, comprobantes y correos

- El checkout real genera pedidos con transferencia bancaria y precios con IVA incluido.
- El cliente puede subir comprobantes desde `/checkout?orden=...` o `/mis-pedidos/[folio]`.
- Los comprobantes ya no se guardan en disco local: se suben a Vercel Blob y la URL queda en `TransferPayment.receiptUrl`.
- Formatos permitidos para comprobantes: PDF, JPG, JPEG, PNG y WEBP.
- Limite de comprobantes: 5 MB por archivo.
- Si Blob no esta disponible, el pedido no se rompe: la pantalla muestra un error amigable al intentar subir el comprobante.
- Si `RESEND_API_KEY` no esta configurado, los pedidos y validaciones siguen funcionando; solo se registra una advertencia en audit log.

## Limitaciones y notas operativas

- `npm run db:migrate` usa `prisma migrate dev` y esta pensado para crear migraciones en desarrollo.
- Para despliegues reales, genera migraciones en desarrollo o staging y aplica en produccion con `npx prisma migrate deploy`.
- No uses SQLite para este modo.
- Mantén `NEXT_PUBLIC_SITE_URL` apuntando al dominio real para que los flujos de pedido y acceso administrativo queden consistentes.
