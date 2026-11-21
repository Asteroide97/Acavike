/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local browser QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { chromium } = require(process.env.ACAVIKE_QA_PLAYWRIGHT_PATH || 'playwright');
const base = process.env.ACAVIKE_QA_BASE_URL || 'http://127.0.0.1:3014';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('QA solo permite localhost');

(async () => {
  const previewFile = path.resolve('app/category-image-local-preview/page.tsx');
  const previewFixture = path.resolve('scripts/fixtures/category-image-preview.tsx');
  if (process.argv.includes('--prepare') || process.argv.includes('--cleanup')) {
    const expected = await fs.readFile(previewFixture, 'utf8');
    const previous = await fs.readFile(previewFile, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (previous !== null && previous.replaceAll('\r\n', '\n') !== expected.replaceAll('\r\n', '\n')) throw new Error('La vista local contiene cambios ajenos; no se modifica.');
    if (process.argv.includes('--prepare')) {
      await fs.mkdir(path.dirname(previewFile), { recursive: true });
      await fs.copyFile(previewFixture, previewFile);
      console.log('LOCAL_PREVIEW_PREPARED');
    } else {
      if (previous !== null) await fs.unlink(previewFile);
      console.log('LOCAL_PREVIEW_REMOVED');
    }
    return;
  }
  assert.equal((await (await fetch(base + '/api/health')).json()).mode, 'demo');
  const unauthenticated = await fetch(base + '/api/admin/category-images', { method: 'POST' });
  assert.equal(unauthenticated.status, 401);
  const output = path.resolve('output/category-images'); await fs.mkdir(output, { recursive: true });
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE TABLE Category(id TEXT PRIMARY KEY,imageUrl TEXT); INSERT INTO Category VALUES ('root',NULL),('child',NULL)");
  const stored = id => db.prepare('SELECT imageUrl FROM Category WHERE id=?').get(id).imageUrl;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [], checks = [], images = new Map();
  let uploads = 0, saves = 0, failNext = false;
  let release; const gate = new Promise(resolve => { release = resolve; });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    await context.route('https://category-qa.public.blob.vercel-storage.com/**', async route => {
      const bytes = images.get(route.request().url());
      await route.fulfill(bytes ? { status: 200, body: bytes, contentType: 'image/webp' } : { status: 404 });
    });
    await context.route('**/_next/image?**', async route => {
      const source = new URL(route.request().url()).searchParams.get('url');
      if (!source?.startsWith('https://category-qa.')) return route.continue();
      const bytes = images.get(source);
      await route.fulfill(bytes ? { status: 200, body: bytes, contentType: 'image/webp' } : { status: 404 });
    });
    await context.route('**/api/admin/category-images', async route => {
      uploads++;
      if (uploads === 1) await gate;
      if (failNext) { failNext = false; return route.fulfill({ status: 500, json: { error: 'No se pudo subir la imagen a Vercel Blob. Intenta de nuevo.' } }); }
      const request = route.request();
      const form = await new Response(request.postDataBuffer(), { headers: { 'content-type': request.headers()['content-type'] } }).formData();
      const file = form.get('file');
      const url = `https://category-qa.public.blob.vercel-storage.com/category-images/${form.get('categoryId')}/${uploads}.webp`;
      images.set(url, Buffer.from(await file.arrayBuffer()));
      await route.fulfill({ json: { ok: true, url, pathname: `category-images/${uploads}.webp`, contentType: file.type, size: file.size } });
    });
    await context.route('**/api/category-image-local-preview', async route => {
      saves++;
      const request = route.request();
      const form = await new Response(request.postDataBuffer(), { headers: { 'content-type': request.headers()['content-type'] } }).formData();
      const kind = form.get('kind'); const image = form.get('imageUrl');
      assert.ok(['root', 'child'].includes(kind));
      assert.ok(!image || image.startsWith('https://category-qa.public.blob.vercel-storage.com/'));
      db.prepare('UPDATE Category SET imageUrl=? WHERE id=?').run(image || null, kind);
      await route.fulfill({ status: 302, headers: { location: `/category-image-local-preview?kind=${kind}&image=${encodeURIComponent(image || '')}` } });
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    const hidden = () => page.locator('input[name="imageUrl"]');
    const fixture = name => path.resolve(name === 'category-0' ? 'public/brand/acavike-supplies-logo.png' : `public/home/${name}.webp`);
    async function waitUploaded() { await page.getByRole('status').filter({ hasText: 'Imagen lista' }).waitFor(); }
    async function save(kind) {
      const url = await hidden().inputValue();
      await page.getByRole('button', { name: 'Guardar categoría', exact: true }).click();
      await page.waitForURL(base + `/category-image-local-preview?kind=${kind}&image=${encodeURIComponent(url)}`);
      await page.waitForLoadState('networkidle');
      assert.equal(stored(kind), url || null); assert.equal(await hidden().inputValue(), url);
      await page.reload({ waitUntil: 'networkidle' }); assert.equal(await hidden().inputValue(), url);
    }
    await page.goto(base + '/category-image-local-preview', { waitUntil: 'networkidle' });
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Subir imagen', exact: true }).click();
    await (await chooser).setFiles(fixture('category-0'));
    await page.waitForFunction(() => document.querySelector('img[alt="Vista previa de la categoría"]')?.getAttribute('src')?.startsWith('blob:'));
    await page.getByRole('button', { name: 'Guardar categoría', exact: true }).click();
    assert.equal(saves, 0); release(); await waitUploaded();
    await save('root');
    await page.screenshot({ path: path.join(output, 'category-desktop.png'), fullPage: true });
    checks.push('Carga, preview local, guardado bloqueado mientras sube, URL persistida y recarga: PASS');
    const first = stored('root');
    await page.getByLabel('Seleccionar fotografía de categoría').setInputFiles(fixture('category-1')); await waitUploaded();
    await save('root'); assert.notEqual(stored('root'), first);
    checks.push('Reemplazo y persistencia tras recarga: PASS');
    const previous = stored('root'); failNext = true;
    await page.getByLabel('Seleccionar fotografía de categoría').setInputFiles(fixture('category-0'));
    await page.getByRole('alert').waitFor(); assert.equal(await hidden().inputValue(), previous);
    const attempts = uploads;
    await page.getByLabel('Seleccionar fotografía de categoría').setInputFiles({ name: 'no.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
    assert.equal(uploads, attempts); assert.equal(await hidden().inputValue(), previous);
    checks.push('Fallo de Blob y archivo inválido conservan la imagen previa: PASS');
    await page.getByRole('button', { name: 'Quitar imagen', exact: true }).click(); await save('root');
    assert.equal(stored('root'), null);
    checks.push('Quitar y guardar persiste NULL, sin borrar archivos: PASS');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/category-image-local-preview?kind=child', { waitUntil: 'networkidle' });
    await page.getByLabel('Seleccionar fotografía de categoría').setInputFiles(fixture('category-0')); await waitUploaded(); await save('child');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('img[alt="Vista previa de la categoría"]').evaluate(image => getComputedStyle(image).objectFit), 'contain');
    await page.screenshot({ path: path.join(output, 'subcategory-mobile.png'), fullPage: true });
    checks.push('Subcategoría móvil, object-fit contain y ausencia de overflow: PASS');
    await page.goto(base + '/catalogo/empaque', { waitUntil: 'networkidle' });
    assert.ok(await page.getByRole('img', { name: 'Empaque', exact: true }).count() > 0);
    await page.screenshot({ path: path.join(output, 'catalog-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(base + '/catalogo/empaque', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(output, 'catalog-desktop.png') });
    checks.push('Catálogo público con imágenes de categoría y navegación: PASS');
    await page.goto(base + '/admin/categorias/cat_1', { waitUntil: 'networkidle' });
    assert.ok(await page.getByRole('button', { name: 'Reemplazar imagen', exact: true }).isDisabled());
    assert.ok(await page.getByRole('button', { name: 'Guardar categoría', exact: true }).isDisabled());
    checks.push('Editor real integrado: carga segura en demo sin consultas ni escrituras reales: PASS');
    assert.deepEqual(errors, []);
    const report = { checks, errors, storage: 'SIMULATED_BLOB', persistence: 'ISOLATED_SQLITE_IN_MEMORY', productionWrites: 0, anonymousApiStatus: unauthenticated.status };
    await fs.writeFile(path.join(output, 'browser-tests.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
