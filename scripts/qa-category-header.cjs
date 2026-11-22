/* eslint-disable @typescript-eslint/no-require-imports -- Local-only visual QA. */
const { chromium } = require(process.env.ACAVIKE_QA_PLAYWRIGHT_PATH || 'C:/Users/joseh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');const path=require('node:path');const assert=require('node:assert/strict');
const base='http://127.0.0.1:3014';
(async()=>{
  const preview=path.resolve('app/category-header-local-preview/page.tsx');const fixture=await fs.readFile('scripts/fixtures/category-header-preview.tsx','utf8');
  if(process.argv.includes('--prepare')||process.argv.includes('--cleanup')){
    const previous=await fs.readFile(preview,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(previous!==null&&previous.replaceAll('\r\n','\n')!==fixture.replaceAll('\r\n','\n'))throw new Error('Vista auxiliar con cambios ajenos; no se modifica.');
    if(process.argv.includes('--prepare')){await fs.mkdir(path.dirname(preview),{recursive:true});await fs.writeFile(preview,fixture);}else if(previous!==null)await fs.unlink(preview);
    console.log('LOCAL_PREVIEW_PREPARED_OR_REMOVED');return;
  }
  const stage=process.argv[2];assert.ok(['before','after'].includes(stage));assert.equal((await(await fetch(base+'/api/health')).json()).mode,'demo');
  const dir=path.resolve('output/category-header',stage);await fs.mkdir(dir,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'chrome'});const errors=[],checks=[];
  try{
    const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
    for(const [device,width,height] of [['desktop',1440,1050],['tablet',820,1180],['mobile',390,844]]){
      await page.setViewportSize({width,height});
      for(const [name,route] of [['empaque','/catalogo/empaque'],['abrasivos','/catalogo/abrasivos'],['photo','/category-header-local-preview?mode=photo'],['none','/category-header-local-preview?mode=none'],['subcategory','/category-header-local-preview?mode=subcategory'],['long','/category-header-local-preview?mode=long']]){
        assert.equal((await page.goto(base+route,{waitUntil:'networkidle'})).status(),200);
        assert.doesNotMatch(await page.locator('body').innerText(),/Ocurrió un error inesperado|An error occurred in the Server Components render/);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        if(stage==='after'){
          const hero=page.locator('[data-category-hero]');assert.equal(await hero.count(),1);
          const image=hero.locator('img');const heading=hero.locator('h1');const cta=hero.getByRole('link',{name:'Cotización express',exact:true});
          const form=page.getByRole('textbox',{name:'Buscar productos',exact:true}).locator('xpath=ancestor::form');
          const box=await hero.boundingBox(), formBox=await form.boundingBox();assert.ok(formBox.y>=box.y+box.height-1);
          if(name==='none'){assert.equal(await image.count(),0);assert.equal(await hero.getAttribute('data-has-image'),'false');}
          else{
            await image.evaluate(async el=>{el.loading='eager';await el.decode();});
            const photo=await image.boundingBox(), title=await heading.boundingBox(), button=await cta.boundingBox();
            assert.equal(await image.evaluate(el=>getComputedStyle(el).objectFit),'contain');
            assert.ok(photo.height<=261);assert.ok(photo.width>200);
            const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
            assert.equal(overlaps(photo,title),false);assert.equal(overlaps(photo,button),false);
            if(device==='mobile')assert.ok(photo.y>=title.y+title.height);
            else assert.ok(photo.x>=title.x+title.width-1);
          }
          if(['photo','none','subcategory','long'].includes(name))assert.ok(await hero.locator('p').filter({hasText:'Suministros de empaque'}).count()>0);
          assert.equal(await cta.getAttribute('href'),'/cotizacion-rapida');
          assert.equal(await page.getByRole('combobox',{name:'Ordenar productos'}).inputValue(),'custom');
        }
        await page.screenshot({path:path.join(dir,`${name}-${device}.png`),fullPage:true});checks.push(`${name} ${device}: PASS`);
      }
    }
    if(stage==='after'){
      await page.goto(base+'/category-header-local-preview?mode=broken',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>document.querySelector('[data-category-hero]')?.getAttribute('data-has-image')==='false');checks.push('Imagen inaccesible: composición compacta sin hueco: PASS');
      await page.goto(base+'/catalogo/empaque?orden=price_asc&q=caja',{waitUntil:'networkidle'});
      assert.equal(await page.getByRole('textbox',{name:'Buscar productos',exact:true}).inputValue(),'caja');assert.equal(await page.getByRole('combobox',{name:'Ordenar productos'}).inputValue(),'price_asc');checks.push('Búsqueda y orden conservados: PASS');
    }
    assert.deepEqual(errors,[]);await fs.writeFile(path.join(dir,'checks.json'),JSON.stringify({stage,checks,errors,productionWrites:0},null,2));console.log(JSON.stringify({stage,checks:checks.length,result:'PASS'}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
