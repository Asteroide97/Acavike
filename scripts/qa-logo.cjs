/* eslint-disable @typescript-eslint/no-require-imports -- Isolated local browser QA. */
const { chromium } = require('C:/Users/joseh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:3014';
const stage = process.argv[2];
assert.ok(['before', 'after'].includes(stage));
const routes = [['home','/'],['catalog','/catalogo'],['category','/catalogo/empaque'],['product','/producto/caja-corrugada-doble-pared-60-x-40'],['cart','/carrito'],['checkout','/checkout'],['account','/mi-cuenta'],['quote','/cotizacion-rapida'],['contact','/contacto'],['admin','/admin']];
(async () => {
  assert.equal((await (await fetch(base + '/api/health')).json()).mode, 'demo');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const dir = path.resolve('output/brand-logo', stage); await fs.mkdir(dir, { recursive: true });
  const errors = [], checks = [];
  try {
    const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
    for (const [device,width,height] of [['desktop',1440,1050],['mobile',390,844]]) {
      await page.setViewportSize({width,height});
      for (const [name,route] of routes) {
        const response = await page.goto(base+route,{waitUntil:'networkidle'}); assert.equal(response.status(),200);
        assert.doesNotMatch(await page.locator('body').innerText(),/Ocurrió un error inesperado|An error occurred in the Server Components render/);
        await page.locator('img[alt^="Acavike"],img[alt^="ACAVIKE"]').evaluateAll(async images => {
          await Promise.all(images.map(image => { image.loading='eager'; return image.decode(); }));
        });
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          logos: [...document.querySelectorAll('[data-brand-logo],img[alt^="Acavike"],img[alt^="ACAVIKE"]')].map(el=>{
            const mask=el.querySelector('span');
            return {src:mask?getComputedStyle(mask).maskImage:el.currentSrc,loaded:mask?CSS.supports('mask-mode','luminance'):el.complete&&el.naturalWidth>0,fit:mask?getComputedStyle(mask).maskSize:getComputedStyle(el).objectFit,naturalRatio:mask?1612/297:el.naturalWidth/el.naturalHeight,ratio:el.getBoundingClientRect().width/el.getBoundingClientRect().height,tone:el.dataset.brandLogo,color:mask?getComputedStyle(mask).backgroundColor:null,background:getComputedStyle(el).backgroundColor};
          }),
          background: document.querySelector('footer,.admin-app aside') && getComputedStyle(document.querySelector('footer,.admin-app aside')).backgroundColor,
        }));
        assert.ok(result.logos.length>0); assert.equal(result.overflow,false);
        assert.ok(result.logos.every(logo=>logo.loaded));
        if(stage==='after') {
          assert.ok(result.logos.every(logo=>logo.src.includes('acavike-registered-logo.webp')&&logo.fit==='contain'&&Math.abs(logo.ratio-logo.naturalRatio)<.03));
          result.logos.forEach(logo=>{ assert.equal(logo.color,logo.tone==='white'?'rgb(255, 255, 255)':'rgb(7, 85, 200)'); assert.equal(logo.background,'rgba(0, 0, 0, 0)'); });
          assert.equal((await page.request.get(base+'/brand/acavike-registered-logo.webp')).status(),200);
          assert.equal(result.background,'rgb(7, 85, 200)');
          assert.equal(await page.locator('img[src*="supplies-logo"],img[srcset*="supplies-logo"]').count(),0);
          if(name!=='admin') assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://acavike.com/brand/acavike-registered-logo.webp');
        }
        await page.screenshot({path:path.join(dir,`${name}-${device}.png`),fullPage:true});
        checks.push({route,device,...result});
      }
    }
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(dir,'checks.json'),JSON.stringify({stage,checks,errors,productionWrites:0},null,2));
    console.log(JSON.stringify({stage,pages:checks.length,result:'PASS'}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
