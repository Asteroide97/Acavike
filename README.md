# Acavike Industrial

E-commerce B2B y catalogo industrial construido con `Next.js 15`, `TypeScript`, `App Router`, `Tailwind CSS`, `Prisma` y `PostgreSQL`.

La plataforma incluye:

- Sitio publico con home, catalogo, detalle de producto, carrito, checkout por transferencia, contacto, cuenta y pedidos.
- Panel admin con dashboard, analytics, pedidos, almacen, cotizaciones, clientes, productos, categorias, cupones, pagos, contenido, usuarios, mensajes, auditoria y settings.
- Compra sin gateway de pago. El flujo se cierra con transferencia bancaria y carga de comprobante.

## Requisitos

- `Node.js 20+`
- `npm`
- `PostgreSQL` solo para instalaciones reales con base de datos

## Variables de entorno

La aplicacion soporta dos modos.

### Modo demo sin base de datos

```env
DEMO_MODE="true"
AUTH_SECRET="cambia-esta-clave-por-una-cadena-larga-y-segura"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Notas:

- `DATABASE_URL` no es obligatoria.
- La home, el catalogo, los productos, las categorias, el carrito visual, el checkout visual y el admin cargan con datos demo internos.
- Las acciones del admin se muestran en modo simulado.

### Modo real con PostgreSQL

```env
DEMO_MODE="false"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acavike?schema=public"
AUTH_SECRET="cambia-esta-clave-por-una-cadena-larga-y-segura"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Notas:

- Si `DEMO_MODE=false` y falta `DATABASE_URL`, la aplicacion muestra errores controlados y no rompe los Server Components.
- `AUTH_SECRET` es la variable recomendada. Tambien se aceptan `JWT_SECRET` o `SESSION_SECRET` por compatibilidad.

## Instalacion

```bash
npm install
npx prisma generate
```

## Desarrollo

### Correr en modo demo

```bash
npm run dev
```

Con `DEMO_MODE=true`, el sitio funciona sin base de datos.

### Correr en modo real

1. Configura `DEMO_MODE=false`.
2. Define `DATABASE_URL`.
3. Genera Prisma y aplica migraciones.

```bash
npx prisma generate
npm run db:migrate -- --name init
npm run dev
```

Si solo quieres sincronizar el esquema local rapidamente:

```bash
npm run db:push
```

Si necesitas datos iniciales para entorno real:

```bash
npm run db:seed
```

## Variables de Vercel

### Demo

```env
DEMO_MODE="true"
AUTH_SECRET="..."
```

### Produccion real

```env
DEMO_MODE="false"
DATABASE_URL="..."
AUTH_SECRET="..."
```

## Build y validacion

```bash
npm run lint
npm run build
npx prisma generate
```

## Acceso demo

Superadmin:

- `admin@acavike.com` / `Admin123!`

Usuarios demo adicionales:

- `manager@acavike.com` / `Admin123!`
- `warehouse@acavike.com` / `Admin123!`
- `ventas@acavike.com` / `Admin123!`
- `cliente@acavike.com` / `Cliente123!`

## Comandos utiles

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
```

## Notas funcionales

- El checkout genera pedidos con estado `PENDING_TRANSFER`.
- El comprobante se carga en `public/uploads/receipts`.
- Solo `SUPERADMIN` y `ADMIN` pueden editar catalogo, contenido, precios y usuarios.
- `WAREHOUSE` opera pedidos y estados logisticos.
- `SALES` administra cotizaciones y clientes.
- `CUSTOMER` consulta cuenta y pedidos desde el frente publico.
