# Orden personalizado de productos

## Uso

Administracion > Productos > **Ordenar productos** (`/admin/productos/ordenar`).
Solo ADMIN y SUPERADMIN pueden guardar. Selecciona categoria y subcategoria,
arrastra desde el control o utiliza Subir/Bajar. El control admite Alt +
flechas y Alt + Inicio/Fin. Guarda el nuevo orden o cancela para recuperar el
ultimo guardado. Se advierte al salir con cambios pendientes.

Cada tarjeta muestra miniatura, nombre, SKU y posicion global dentro del
ambito. El editor incluye busqueda y paginas de 12 productos; guardar siempre
envia la lista completa, no solamente la pagina visible. Limite de seguridad:
5000 productos por ambito. En movil los controles ocupan una segunda fila.

## Arquitectura y migracion propuesta

El modelo actual tiene Product.categoryId: cada producto pertenece a una
categoria, que puede tener padre e hijos. Una categoria principal del catalogo
incluye productos de sus descendientes.

Para evitar efectos entre listados se agregan dos tablas independientes:

- CatalogOrderScope: id `all` o `category:<id>`, categoryId opcional y version.
- CatalogProductOrder: scopeId, productId y position.

El catalogo completo, cada categoria y cada subcategoria conservan ordenes
separados. No hay herencia automatica del orden de una subcategoria hacia su
padre: el padre tiene su propia lista, incluidos sus descendientes.

Migracion propuesta: `prisma/migrations/20261121160000_catalog_product_order/migration.sql`.
Solamente crea las dos tablas, indices, claves foraneas y checks no negativos.
No altera columnas ni registros de Product o Category. Los productos mantienen
ID, SKU, imagenes, precio, stock, categoria y updatedAt. El esquema SQLite
equivalente se mantiene alineado para instalaciones locales.

El guardado usa una transaccion Serializable: valida pertenencia exacta,
avanza la version mediante comparacion atomica y reemplaza solo las posiciones
del ambito elegido. Si cambia la lista o la version, devuelve 409. Fallos de
insercion revierten tambien la version. Las claves compuestas impiden repetir
producto o posicion en un mismo ambito. Los indices se renumeran desde cero.

El endpoint POST `/api/admin/product-order` valida sesion y rol en el servidor,
origen, JSON, tamano, identificadores y duplicados. No acepta posiciones
arbitrarias, solo una lista completa de IDs. No modifica datos comerciales.

## Catalogo publico

Orden personalizado es el predeterminado. Se conservan nombre A-Z/Z-A, precio
ascendente/descendente, destacados y mas recientes. Se ordena el conjunto
filtrado completo antes de paginar (24 productos por pagina); los enlaces
conservan busqueda, precios y disponibilidad. Cambiar categoria o filtros
reinicia la pagina. Las tarjetas de producto no se modifican.

Productos sin posicion guardada quedan despues de los ordenados, por fecha de
creacion ascendente y luego ID. Las altas nuevas aparecen al final. Los
inactivos siguen visibles en el editor para conservar su posicion al activarse.
Sin la migracion, el publico usa ese orden estable de respaldo y el admin
deshabilita el guardado, sin romper la pagina.

En modo demo los movimientos y guardados se simulan solo en la pantalla;
recargar restaura demo-data. No se escriben cookies ni se cambia el catalogo
publico demo desde el editor.

## Validacion local

- `npm run lint` y `npx prisma generate`.
- `DEMO_MODE=true DATABASE_URL= AUTH_SECRET=codex-demo-secret npm run build`
  (establecer variables con la sintaxis correspondiente de PowerShell).
- `DEMO_MODE=true DATABASE_URL= npx tsx --test scripts/product-order.test.ts scripts/catalog.test.ts`:
  17 pruebas, 0 fallos.
- `node scripts/test-product-order-prisma.cjs`: repositorio Prisma real contra
  un SQLite temporal exclusivo en node_modules/.cache. Verifica guardado,
  recarga, aislamiento de ambitos, orden publico, filtros, paginacion, precio,
  nuevos al final, conflictos, rollback y campos comerciales intactos.
- La prueba anterior genera un cliente SQLite separado y crea su base local
  vacia; nunca regenera el cliente principal ni usa conexiones heredadas.
- Comparacion Prisma entre esquema anterior y nuevo: solo las dos tablas
  nuevas y sus relaciones. Validacion de schema.sqlite.prisma: PASS.
- Navegador: arrastre 3 -> 1, cancelar, botones, guardar/recargar, teclado
  primero -> ultimo, subcategoria independiente, aviso al salir, filtros y
  paginas, sin errores JavaScript ni overflow movil.
- API local sin sesion: 401. Roles CUSTOMER, SALES y WAREHOUSE: 403 en las
  pruebas del manejador. ADMIN y SUPERADMIN: autorizados.

Las pruebas Prisma locales son SQLite. Tras autorizacion del propietario, la
migracion fue aplicada en PostgreSQL v2 el 21 de noviembre de 2026: estado de
migraciones PASS, cinco indices validos, tres claves foraneas y datos originales
sin cambios. Las dos tablas nuevas permanecen vacias; solo se concedio CRUD a
acavike_app sobre ellas. No se ha probado concurrencia
real entre dos conexiones PostgreSQL; si hay conflicto Serializable, la API
responde 409 y solicita recargar.

## Capturas y repeticion

Evidencias en `output/product-order/`: ordering-desktop.png, ordering-mobile.png,
demo-admin-desktop.png, demo-admin-mobile.png, catalog-page-2.png y checks.json.
Las primeras dos usan el componente real con datos sinteticos y el manejador
compartido conectado a SQLite aislado; las otras muestran las rutas demo reales.

Para repetir el navegador: `node scripts/qa-product-order.cjs --prepare`,
iniciar Next local en demo en 127.0.0.1:3014, ejecutar
`node scripts/qa-product-order.cjs` y terminar con
`node scripts/qa-product-order.cjs --cleanup`. La ruta auxiliar nunca debe
incluirse en el build o despliegue.

## Antes de publicar

No ejecutar seeds ni alterar registros comerciales al verificar un despliegue.
Una migracion futura requiere autorizacion separada y debe revisarse primero en una
copia PostgreSQL de pruebas. Respaldar y verificar identidad/estado de
migraciones antes de aplicarla. Si acavike_app solo tiene permisos explicitos
sobre tablas anteriores, el DBA debera autorizar SELECT/INSERT/UPDATE/DELETE
sobre las dos tablas nuevas; no necesita secuencias ni permisos DDL.
No cambiar credenciales ni ampliar permisos automaticamente.

## Archivos modificados y nuevos

- app/admin/productos/page.tsx: acceso a Ordenar productos.
- app/admin/productos/ordenar/page.tsx: pagina protegida de ordenacion.
- components/admin/product-order-editor.tsx: editor responsive y accesible.
- app/api/admin/product-order/route.ts: endpoint protegido.
- lib/product-order-handler.ts: validacion de la solicitud y permisos.
- lib/product-order.ts: reglas de orden, pertenencia y persistencia atomica.
- lib/repositories/product-order.ts: lectura y transaccion Prisma.
- lib/repositories/catalog.ts: orden personalizado publico.
- lib/catalog-filters.ts: orden predeterminado y paginacion.
- components/public/catalog-view.tsx: selector y enlaces de paginas.
- prisma/schema.prisma y prisma/schema.sqlite.prisma: modelos nuevos.
- prisma/migrations/20261121160000_catalog_product_order/migration.sql:
  migracion aditiva aplicada con autorizacion explicita el 21 de noviembre de 2026.
- scripts/product-order.test.ts y scripts/catalog.test.ts: 17 pruebas PASS.
- scripts/test-product-order-prisma.cjs: integracion Prisma local PASS.
- scripts/qa-product-order.cjs y scripts/fixtures/product-order-preview.tsx:
  navegador y datos de prueba aislados.
- README_PRODUCT_ORDER.md: arquitectura, limitaciones y procedimiento.

Validacion final: lint, Prisma generate y build PASS; sin ruta auxiliar en el
build. Advertencias no bloqueantes: node:sqlite experimental en pruebas y
package.json#prisma deprecado (existente). Ninguna requiere cambiar versiones
para usar esta implementacion.
