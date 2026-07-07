# Acavike Industrial

E-commerce B2B y catalogo industrial construido con `Next.js 15`, `TypeScript`, `App Router`, `Tailwind CSS`, `Prisma` y `PostgreSQL`.

La plataforma incluye:

- Sitio publico con home, catalogo, detalle de producto, carrito, checkout por transferencia, contacto, cuenta y pedidos.
- Panel admin con dashboard, analytics, pedidos, almacen, cotizaciones, clientes, productos, categorias, cupones, pagos, contenido, usuarios, mensajes, auditoria y settings.
- Compra sin gateway de pago. El flujo se cierra con transferencia bancaria y carga de comprobante.

## Requisitos

- `Node.js 20+`
- `PostgreSQL`
- `npm`

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acavike?schema=public"
SESSION_SECRET="cambia-esta-clave-por-una-cadena-larga-y-segura"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Instalacion

```bash
npm install
npx prisma generate
```

## Migraciones

Para crear y aplicar la migracion inicial:

```bash
npm run db:migrate -- --name init
```

Si solo quieres sincronizar el esquema local rapidamente:

```bash
npm run db:push
```

## Seed

Carga datos demo, categorias, productos y usuarios iniciales:

```bash
npm run db:seed
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build y validacion

```bash
npm run lint
npm run build
npx prisma generate
```

## Acceso inicial

Superadmin:

- `email`: `admin@acavike.com`
- `password`: `Admin123!`

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
- `WAREHOUSE` opera pedidos y estados logísticos.
- `SALES` administra cotizaciones y clientes.
- `CUSTOMER` consulta cuenta y pedidos desde el frente publico.
