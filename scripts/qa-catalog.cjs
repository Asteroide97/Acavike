/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node QA runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.ACAVIKE_QA_PLAYWRIGHT_PATH || 'playwright');
const base = process.env.ACAVIKE_QA_BASE_URL || 'http://127.0.0.1:3012';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('QA restringido a localhost');

(async () => {
  const health = await (await fetch(base + '/api/health')).json();
  assert.equal(health.mode, 'demo', 'Las pruebas de carrito solo se permiten en demo local');
  const output = path.resolve('output/catalog-review');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  const results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1050 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    async function visit(route) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      assert.equal(await page.getByText('Ocurrió un error inesperado.', { exact: false }).count(), 0);
    }
    async function noOverflow() {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Sin overflow horizontal');
    }
    await visit('/catalogo');
    assert.equal(await page.locator('article').count(), 44);
    await noOverflow();
    await page.screenshot({ path: path.join(output, 'catalog-desktop.png') });
    results.push('Desktop: 44 productos, filtros y ausencia de overflow PASS');
    await visit('/catalogo/empaque?orden=price_asc');
    assert.equal(await page.locator('article').count(), 4);
    const prices = await page.locator('article').evaluateAll(articles => articles.map(article => Number(article.textContent.match(/\$([\d,]+\.\d{2})/)[1].replaceAll(',', ''))));
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    const q = page.getByPlaceholder('Nombre, descripción, código o SKU');
    await q.fill('caja');
    await q.press('Enter');
    await page.waitForLoadState('networkidle');
    assert.ok(await page.locator('article').count() > 0);
    results.push('Categoría Empaque, orden de precios y búsqueda de formulario PASS');
    await visit('/catalogo?disponibilidad=disponible&min=100&max=400&orden=name_asc');
    assert.ok(await page.locator('article').count() > 0);
    await visit('/catalogo?q=NO_EXISTE_PRODUCTO_927');
    assert.equal(await page.locator('article').count(), 0);
    assert.equal(await page.getByRole('heading', { name: 'No hay productos para esta selección' }).count(), 1);
    results.push('Filtros combinados y estado vacío PASS');

    await page.setViewportSize({ width: 390, height: 844 });
    await visit('/catalogo/empaque');
    assert.equal(await page.locator('#catalog-filters').isVisible(), false);
    await page.getByRole('button', { name: 'Categorías y filtros' }).click();
    assert.equal(await page.locator('#catalog-filters').isVisible(), true);
    await page.getByRole('button', { name: 'Categorías y filtros' }).click();
    const boxes = await page.locator('article').evaluateAll(items => items.slice(0, 2).map(item => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })));
    assert.equal(Math.round(boxes[0].y), Math.round(boxes[1].y));
    await noOverflow();
    await page.screenshot({ path: path.join(output, 'catalog-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    await visit('/catalogo/empaque');
    const narrow = await page.locator('article').evaluateAll(items => items.slice(0, 2).map(item => item.getBoundingClientRect().y));
    assert.ok(narrow[1] > narrow[0]);
    await noOverflow();
    results.push('Mobile 390px: dos columnas y filtros desplegables; 360px: una columna, sin overflow PASS');

    await visit('/producto/caja-corrugada-doble-pared-60-x-40');
    await page.getByRole('link', { name: 'Solicitar cotización', exact: true }).first().click();
    await page.waitForURL('**/cotizacion-rapida?**');
    assert.ok((await page.locator('textarea').first().inputValue()).trim().length > 0);
    results.push('Ficha y enlace de cotización con requerimientos precargados PASS (sin envío)');
    await visit('/catalogo/empaque');
    const cartProduct = page.locator('article').filter({ has: page.getByRole('button', { name: 'Agregar', exact: true }) }).first();
    const cartName = await cartProduct.locator('a').nth(1).innerText();
    await cartProduct.getByRole('button', { name: 'Agregar', exact: true }).click();
    await page.waitForURL('**/carrito?**');
    await page.waitForLoadState('networkidle');
    assert.equal(new URL(page.url()).pathname, '/carrito');
    assert.ok((await page.locator('body').innerText()).includes(cartName));
    results.push('Agregar al carrito demo local PASS (sin checkout)');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'browser-tests.json'), JSON.stringify({ results, errors, mode: 'LOCAL_DEMO_ONLY' }, null, 2));
    console.log(JSON.stringify({ results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
