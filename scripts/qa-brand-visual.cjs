/* eslint-disable @typescript-eslint/no-require-imports -- Local-only browser evidence. */
const { chromium } = require(process.env.ACAVIKE_QA_PLAYWRIGHT_PATH || 'C:/Users/joseh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:3014';
const stage = process.argv[2];
if (!['before', 'after'].includes(stage)) throw new Error('Selecciona before o after');
const routes = [ ['home', '/'], ['catalog', '/catalogo'], ['category', '/catalogo/empaque'], ['product', '/producto/caja-corrugada-doble-pared-60-x-40'], ['cart', '/carrito'], ['account', '/mi-cuenta'], ['admin', '/admin'], ['admin-categories', '/admin/categorias'] ];
function contrast(a,b) {
  const luminance = hex => { const rgb = hex.match(/[a-f\d]{2}/gi).map(n => parseInt(n,16)/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4); return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
  const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
(async () => {
  assert.equal((await (await fetch(base + '/api/health')).json()).mode, 'demo');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const dir = path.resolve('output/brand-polish', stage); await fs.mkdir(dir, { recursive: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
    for (const [device, width, height] of [['desktop', 1440, 1050], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      for (const [name, route] of routes) {
        const response = await page.goto(base + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        assert.doesNotMatch(await page.locator('body').innerText(), /Ocurrió un error inesperado|An error occurred in the Server Components render/);
        await page.screenshot({ path: path.join(dir, `${name}-${device}.png`), fullPage: true });
        const audit = await page.evaluate(() => {
          const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const navy = [...document.querySelectorAll('body *')].filter(visible).filter(el => {
            const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
            return c && (c[3] ?? 1) > .8 && c[2] > c[0] * 1.4 && c[0] < 35 && c[1] < 65 && c[2] < 150;
          }).map(el => `${el.tagName}.${String(el.className).slice(0,100)}`);
          return { overflow: document.documentElement.scrollWidth > innerWidth, navy, footer: document.querySelector('footer') && getComputedStyle(document.querySelector('footer')).backgroundColor, aside: document.querySelector('.admin-app aside') && getComputedStyle(document.querySelector('.admin-app aside')).backgroundColor };
        });
        if (stage === 'after') { assert.equal(audit.overflow, false, `${route} ${device} overflow`); assert.deepEqual(audit.navy, [], `${route} navy surfaces`); }
        results.push({ route, device, ...audit });
        if (name === 'home') {
          const links = page.getByRole('region', { name: 'Categorías de suministros' }).locator('a').filter({ has: page.locator('img') });
          assert.equal(await links.count(), 5);
          const hrefs = await links.evaluateAll(nodes => nodes.map(el => el.getAttribute('href')));
          if (stage === 'after') {
            for (let i = 0; i < 5; i++) {
              const card = links.nth(i); await card.scrollIntoViewIfNeeded();
              assert.ok(await card.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+10)); }));
              assert.equal(await card.locator('img').evaluate(el => getComputedStyle(el).objectFit), 'contain');
            }
            await links.first().focus(); assert.ok(await links.first().evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
            for (const href of hrefs) { const r = await page.request.get(base + href); assert.equal(r.status(), 200); }
          }
          if (stage === 'after') {
            const before = JSON.parse(await fs.readFile(path.join(dir, '../before/checks.json'), 'utf8'));
            assert.deepEqual(hrefs, before.results.find(r => r.device === device && r.categoryLinks).categoryLinks);
            const band = page.locator('.category-tile-label').first();
            assert.equal(await band.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(7, 85, 200)');
            await links.first().hover(); assert.equal(await band.evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
          }
          results.push({ device, categoryLinks: hrefs });
        }
      }
    }
    assert.deepEqual(errors, []);
    const contrasts = { whiteOnBlue: contrast('ffffff','0755c8'), whiteOnHover: contrast('ffffff','0646a6'), blueOnSoft: contrast('0755c8','eaf2ff'), textOnWhite: contrast('111827','ffffff') };
    Object.values(contrasts).forEach(value => assert.ok(value >= 4.5));
    await fs.writeFile(path.join(dir, 'checks.json'), JSON.stringify({ stage, results, errors, contrasts, productionWrites: 0 }, null, 2));
    console.log(JSON.stringify({ stage, pages: routes.length * 2, errors, result: 'PASS' }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
