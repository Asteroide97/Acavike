# Fotografias de categorias y subcategorias

## Uso

En el editor de una categoria, selecciona **Subir imagen**. Se aceptan JPG,
PNG y WebP de hasta 4 MiB. La vista previa conserva las proporciones, sin
recortes. Al terminar la carga, guarda la categoria para persistir la URL.
El mismo editor permite reemplazarla o quitarla; tambien funciona en
subcategorias. No se requieren cambios de esquema ni migraciones.

Solo ADMIN y SUPERADMIN pueden cargar o guardar imagenes. La API comprueba
sesion, rol, origen, tamano, extension y firma del archivo. Reutiliza Vercel
Blob y su autenticacion por entorno/OIDC; no envia credenciales al navegador.
En demo la carga y el guardado estan deshabilitados.

El catalogo, su navegacion de categorias y las tarjetas de portada usan
`Category.imageUrl`, con `object-fit: contain` y un placeholder neutral.
Las URLs antiguas no compatibles se conservan al guardar sin cambios, pero
se representan con placeholder. Las nuevas URLs deben proceder de Blob.

## Retencion segura

Quitar o reemplazar elimina solamente la referencia de la categoria al
guardar. No se borra fisicamente ningun blob, para evitar eliminar archivos
compartidos. Las cargas abandonadas tambien se conservan. Una limpieza futura
debera comprobar todas las referencias antes de borrar archivos.

## Validacion local

- `npm run lint`: PASS.
- `npx tsx --test scripts/category-images.test.ts`: 14 pruebas aprobadas.
- `npm run build` con DEMO_MODE=true y DATABASE_URL vacia: PASS; incluye
  generacion de Prisma Client. No ejecuta migraciones ni seeds.
- Navegador: carga, preview, bloqueo de guardado durante upload, reemplazo,
  errores, eliminacion, recarga, subcategoria movil y catalogo: PASS.
- API real local sin sesion: HTTP 401. Roles no autorizados: HTTP 403 en
  pruebas del manejador de la API.

Las pruebas usan Blob simulado y SQLite aislado en memoria. No certifican una
carga al servicio Blob real ni persistencia en Azure mediante Prisma. Esas
comprobaciones quedan pendientes en un entorno autorizado, sin usar datos
comerciales. No hubo escrituras en produccion, push ni despliegue.

Evidencias: `output/category-images/browser-tests.json`,
`category-desktop.png`, `subcategory-mobile.png`, `catalog-desktop.png` y
`catalog-mobile.png`. Las imagenes del editor son archivos de prueba del
repositorio, no fotografias cargadas en produccion.

Para repetir la revision visual, instala Playwright o indica su ruta mediante
ACAVIKE_QA_PLAYWRIGHT_PATH. Ejecuta `node scripts/qa-category-images.cjs --prepare`,
inicia Next en demo en 127.0.0.1:3014, ejecuta
`node scripts/qa-category-images.cjs` y finalmente
`node scripts/qa-category-images.cjs --cleanup`. La pantalla auxiliar no forma
parte del build entregado.

## Archivos

- `app/admin/categorias/[id]/page.tsx`: integracion del editor.
- `app/api/admin/category-images/route.ts`: conexion con Blob.
- `components/admin/category-image-upload.tsx`: carga y preview.
- `components/public/category-image.tsx`: imagen publica y fallback.
- `components/public/catalog-view.tsx`: catalogo y navegacion.
- `app/(public)/page.tsx`: imagenes de categorias en portada.
- `lib/actions/admin.ts`: validacion y persistencia de imageUrl.
- `lib/category-images.ts`: reglas compartidas.
- `lib/category-image-upload.ts`: manejador seguro de carga.
- `scripts/category-images.test.ts`: pruebas automatizadas.
- `scripts/qa-category-images.cjs`: revision de navegador local.
- `scripts/fixtures/category-image-preview.tsx`: pantalla auxiliar de prueba.
- `README_CATEGORY_IMAGES.md`: uso, limites y evidencias.
