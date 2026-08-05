# README_DEMO

## Cuando usar este modo

Usa este modo para:

- mostrar la plantilla en Vercel sin pagar una base externa
- vender o ensenar el demo con datos internos
- revisar home, catalogo, producto, cotizacion, checkout visual y admin demo

No usa persistencia real.

## Variables de entorno

```env
DEMO_MODE="true"
AUTH_SECRET="cambia-esta-clave"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Notas:

- `DATABASE_URL` no es obligatoria.
- Si `DATABASE_URL` no existe y `DEMO_MODE=true`, el sitio usa `lib/demo-data.ts`.
- `/api/health` debe responder `{"ok":true,"mode":"demo"}` en produccion.

## Comandos

```bash
npm install
npx prisma generate
npm run dev
```

Build de validacion:

```bash
DEMO_MODE=true AUTH_SECRET=codex-demo-secret npm run build
```

## Seed

No aplica.

- El demo-memory no usa `prisma db seed`.
- Los datos salen de `lib/demo-data.ts` y repositorios demo.

## Admin

- URL: `/admin`
- Estado esperado: muestra badge o mensaje de `Modo demo`
- Las acciones pueden ser simuladas o deshabilitadas

Credenciales demo:

- `admin@acavike.com` / `Admin123!`
- `manager@acavike.com` / `Admin123!`
- `warehouse@acavike.com` / `Admin123!`
- `ventas@acavike.com` / `Admin123!`
- `cliente@acavike.com` / `Cliente123!`

## Limitaciones

- No hay persistencia entre despliegues.
- No debes esperar escrituras reales en pedidos, clientes, productos o cotizaciones.
- No sirve para operacion real.
- No reemplaza PostgreSQL para un cliente productivo.
