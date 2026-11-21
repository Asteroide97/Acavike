# Catálogo e importación Alegra

## Estado de la revisión

El archivo recurrente contiene 25 productos: Empaque (12), Abrasivos (6), Herramientas (3), Seguridad industrial (2), Limpieza (1) y Consumibles de oficina (1). La propuesta usa 16 subcategorías, sin crear líneas vacías. La tabla completa y los campos faltantes están en `output/catalog-review/AUDIT.md` y `products-review.csv`.

El propietario confirmó el precio público general **sin IVA** como candidato al precio visible. El precio con descuento se conserva solo como referencia: no se convierte en PriceTier ni activa descuentos. El Excel no contiene SKU, unidad comercial, existencias verificadas ni imágenes. No inferir unidad de venta de textos como “1000PZ” o “10KG”.

## Auditoría sin base de datos

Requiere Python 3; utiliza únicamente su biblioteca estándar. No modifica el Excel.

```powershell
python scripts/audit-recurrent-products.py "RUTA/Productos_recurrentes_ACAVIKE.xlsx" --confirm-pricing
npx tsx scripts/import-recurrent-products.ts --file output/catalog-review/import-review.json
```

El segundo comando es un plan: no instancia Prisma ni abre una conexión. El manifiesto conserva hoja/fila, SHA-256 del archivo y precios de origen. Completar `sku` y `unit` solamente con información autorizada. `verifiedStock: null` significa desconocido, no una existencia real de cero. El plan actual informa 50 campos obligatorios pendientes y no permite aplicar.

## Esquema y migración pendiente

`Category` ya soporta jerarquía mediante `parentId`; no requiere migración de categorías. El catálogo consulta categorías reales y sus descendientes, con protección ante ciclos/inactivas. El admin impide asignar una categoría a su propia descendiente.

La migración **no aplicada** `20261121030000_product_import_reference` agrega únicamente `Product.alegraId` nullable con índice único y `Product.importReference` JSONB nullable. No elimina ni reemplaza datos. El schema SQLite conserva los campos equivalentes; no generar SQL PostgreSQL contra SQLite.

**No desplegar el nuevo cliente Prisma antes de aprobar y aplicar la migración.** Las lecturas del cliente regenerado esperan las columnas nuevas. Migraciones y pruebas de integración con PostgreSQL deben hacerse primero en una base local/de pruebas autorizada; no usar producción para QA.

## Escritura futura, solo tras aprobación

No ejecutar todavía. El importador exige todos estos controles:

- Un manifiesto revisado, sin SKU duplicados ni IDs repetidos, con precios explícitamente confirmados.
- `ACAVIKE_IMPORT_DATABASE_URL` proporcionada privadamente; no carga implícitamente la conexión del proyecto. Nunca escribirla en comandos, Git ni reportes.
- `--apply --owner-approved --expected-host HOST --expected-database BASE`. Para un servidor remoto exige además `--allow-remote`.
- Base y hostname coincidentes; `sslmode=require` y TLS comprobado en la sesión.

La operación es transaccional y serializada con bloqueo asesor. Solo crea referencias no existentes; no usa upsert ni actualiza productos existentes. Si un SKU pertenece a otra referencia o una categoría colisiona con otra jerarquía, revierte la transacción completa. Las categorías nuevas y **todos** los productos nuevos quedan inactivos. No crea usuarios, imágenes, pedidos, pagos, cuentas bancarias ni descuentos. Registra una auditoría del lote; repetirlo omite los IDs Alegra ya presentes sin sobrescribirlos.

Sin stock confirmado, se omite `stock` al crear: el esquema usa cero técnico, conserva `originalStock: null` e `inventoryVerified: false` en la referencia. Esto **no autoriza publicar ni vender**. Completar SKU, unidad, inventario real y condiciones bancarias antes de activar categorías/productos. Usar fotografías autorizadas o el placeholder neutral identificado. El importador deliberadamente no publica.

El editor exige confirmación explícita de existencias reales antes de permitir activar un producto importado; se valida también en el servidor. Esta restricción solo afecta productos con referencia de importación y no cambia el carrito ni checkout.

El propietario autorizó SKU automáticos: al crear manualmente un producto, dejar SKU vacío genera un identificador aleatorio `ACV-` con 16 caracteres hexadecimales. Los SKU escritos explícitamente se conservan y los productos existentes no se renumeran. Esto no ejecuta la importación pendiente.

## Validación local

```powershell
$env:DEMO_MODE='true'
$env:AUTH_SECRET='codex-demo-secret'
npx prisma generate
npx prisma validate
npm run lint
npx tsx --test scripts/catalog.test.ts
npm run build
```

Las pruebas usan datos demo y funciones puras; no escriben en producción. Los ejemplos de SKU usados dentro de los tests son exclusivos de pruebas y no se incorporan al manifiesto real. El diseño conserva logo/header/footer y usa las imágenes demo únicamente para la revisión local. Falta la captura Weston para comparar fidelidad visual; no se copiaron recursos de terceros.

El carrito actual permite pedidos sujetos a disponibilidad y no impone stock en el servidor. No se cambió esa lógica ni checkout. Por ello los borradores importados permanecen inactivos: no activar productos sin existencias confirmadas ni sin definir una política comercial de preventa. La validación PostgreSQL de extremo a extremo del importador permanece pendiente de una base de pruebas autorizada.
