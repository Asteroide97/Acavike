/* eslint-disable @typescript-eslint/no-require-imports -- Isolated local browser QA. */
require('tsx/cjs');
const { persistProductOrder, sortCustomProducts } = require('../lib/product-order.ts');
const { createProductOrderHandler } = require('../lib/product-order-handler.ts');
const { chromium } = require('C:/Users/joseh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const base='http://127.0.0.1:3014';
(async()=>{
  const preview=path.resolve('app/product-order-local-preview/page.tsx');
  const fixture=await fs.readFile('scripts/fixtures/product-order-preview.tsx','utf8');
  if(process.argv.includes('--prepare')||process.argv.includes('--cleanup')) {
    const previous=await fs.readFile(preview,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(previous!==null&&previous.replaceAll('\r\n','\n')!==fixture.replaceAll('\r\n','\n'))throw new Error('Vista auxiliar con cambios ajenos: no se modifica.');
    if(process.argv.includes('--prepare')){await fs.mkdir(path.dirname(preview),{recursive:true});await fs.writeFile(preview,fixture);}else if(previous!==null)await fs.unlink(preview);
    console.log('LOCAL_PREVIEW_READY_OR_REMOVED');return;
  }
  assert.equal((await(await fetch(base+'/api/health')).json()).mode,'demo');
  const anonymous=await fetch(base+'/api/admin/product-order',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(anonymous.status,401);
  const output=path.resolve('output/product-order');await fs.mkdir(output,{recursive:true});
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE Product(id TEXT PRIMARY KEY,categoryId TEXT,sku TEXT,price TEXT,stock INTEGER,imageUrl TEXT,name TEXT,createdAt TEXT);CREATE TABLE CatalogOrderScope(id TEXT PRIMARY KEY,categoryId TEXT UNIQUE,version INTEGER DEFAULT 0);CREATE TABLE CatalogProductOrder(scopeId TEXT,productId TEXT,position INTEGER,PRIMARY KEY(scopeId,productId),UNIQUE(scopeId,position));`);
  for(let i=1;i<=6;i++)db.prepare('INSERT INTO Product VALUES(?,?,?,?,?,?,?,?)').run(`p${i}`,i<=4?'c':'d',`EMP-00${i}`,'50.00',20,'/demo-products/product-box.svg',i<=4?`Cinta adhesiva ${i}`:`Caja industrial ${i}`,'2026-01-01');
  const commercial=()=>JSON.stringify(db.prepare('SELECT * FROM Product ORDER BY id').all());const initial=commercial();
  const entries=scope=>db.prepare('SELECT productId,position FROM CatalogProductOrder WHERE scopeId=? ORDER BY position').all(scope);
  const handler=createProductOrderHandler({getUser:async()=>({role:'ADMIN'}),revalidate:()=>{},save:async input=>{
    db.exec('BEGIN');try{const result=await persistProductOrder({
      getMemberIds:async category=>db.prepare('SELECT id FROM Product WHERE categoryId=?').all(category).map(product=>product.id),
      ensureScope:async(id,category)=>{db.prepare('INSERT INTO CatalogOrderScope(id,categoryId) VALUES(?,?) ON CONFLICT(id) DO NOTHING').run(id,category);},
      advanceVersion:async(id,version)=>db.prepare('UPDATE CatalogOrderScope SET version=version+1 WHERE id=? AND version=?').run(id,version).changes===1,
      replacePositions:async(scope,ids)=>{db.prepare('DELETE FROM CatalogProductOrder WHERE scopeId=?').run(scope);ids.forEach((id,i)=>db.prepare('INSERT INTO CatalogProductOrder VALUES(?,?,?)').run(scope,id,i));},
    },input);db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}
  }});
  const browser=await chromium.launch({headless:true,channel:'chrome'});const errors=[],checks=[];
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1050}});
    await context.route('**/api/product-order-fixture?**',async route=>{
      const categoryId=new URL(route.request().url()).searchParams.get('categoria');
      const products=db.prepare('SELECT * FROM Product WHERE categoryId=? ORDER BY id').all(categoryId).map(product=>({...product,isActive:true,createdAt:new Date(product.createdAt)}));
      const version=db.prepare('SELECT version FROM CatalogOrderScope WHERE id=?').get(`category:${categoryId}`)?.version||0;
      await route.fulfill({json:{categoryId,version,products:sortCustomProducts(products,entries(`category:${categoryId}`))}});
    });
    await context.route('**/api/admin/product-order',async route=>{
      const request=new Request(base+'/api/admin/product-order',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:route.request().postData()});
      const response=await handler(request);await route.fulfill({status:response.status,body:await response.text(),contentType:'application/json'});
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const rows=()=>page.locator('li[data-product-id]');const ids=()=>rows().evaluateAll(nodes=>nodes.map(node=>node.dataset.productId));
    const save=async()=>{await page.getByRole('button',{name:'Guardar orden',exact:true}).click();await page.getByRole('status').filter({hasText:'Orden guardado correctamente'}).waitFor();};
    await page.goto(base+'/product-order-local-preview',{waitUntil:'networkidle'});await rows().first().waitFor();
    await page.getByRole('button',{name:'Mover EMP-003',exact:true}).dragTo(rows().first());
    assert.deepEqual(await ids(),['p3','p1','p2','p4']);checks.push('Arrastrar tercero al primero: PASS');
    page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('link',{name:'Volver a productos',exact:true}).click();assert.ok(page.url().includes('product-order-local-preview'));checks.push('Advertencia al salir con cambios: PASS');
    await page.getByRole('button',{name:'Cancelar cambios',exact:true}).click();assert.deepEqual(await ids(),['p1','p2','p3','p4']);checks.push('Cancelar recupera orden anterior: PASS');
    await page.getByRole('button',{name:'Subir EMP-003',exact:true}).click();await page.getByRole('button',{name:'Subir EMP-003',exact:true}).click();await save();
    await page.reload({waitUntil:'networkidle'});await rows().first().waitFor();assert.deepEqual(await ids(),['p3','p1','p2','p4']);checks.push('Subir, guardar y recargar: PASS');
    await page.screenshot({path:path.join(output,'ordering-desktop.png'),fullPage:true});
    await page.getByRole('button',{name:'Mover EMP-003',exact:true}).press('Alt+End');assert.deepEqual(await ids(),['p1','p2','p4','p3']);await save();checks.push('Teclado: primero al último: PASS');
    await page.goto(base+'/product-order-local-preview?categoria=d',{waitUntil:'networkidle'});await rows().first().waitFor();await page.getByRole('button',{name:'Subir EMP-006',exact:true}).click();await save();
    assert.deepEqual(entries('category:c').map(row=>row.productId),['p1','p2','p4','p3']);checks.push('Subcategoría independiente: PASS');
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'ordering-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.goto(base+'/admin/productos',{waitUntil:'networkidle'});await page.getByRole('link',{name:'Ordenar productos',exact:true}).click();await page.waitForURL('**/admin/productos/ordenar');await rows().first().waitFor();
    await page.screenshot({path:path.join(output,'demo-admin-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1050});await page.goto(base+'/admin/productos/ordenar',{waitUntil:'networkidle'});await rows().first().waitFor();await page.screenshot({path:path.join(output,'demo-admin-desktop.png'),fullPage:true});
    assert.equal(await rows().count(),12);await page.getByRole('button',{name:'Siguiente',exact:true}).click();assert.equal(await rows().count(),12);await page.getByRole('textbox',{name:'Buscar nombre o SKU'}).fill('EMP-');assert.ok(await rows().count()>0);checks.push('Editor real demo: enlace, filtros y paginación: PASS');
    await page.goto(base+'/catalogo',{waitUntil:'networkidle'});assert.equal(await page.getByRole('combobox',{name:'Ordenar productos'}).inputValue(),'custom');await page.getByRole('link',{name:'Siguiente',exact:true}).click();await page.waitForURL('**/catalogo?pagina=2');
    await page.screenshot({path:path.join(output,'catalog-page-2.png')});checks.push('Catálogo público: personalizado por defecto y página 2: PASS');
    assert.equal(commercial(),initial);assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'checks.json'),JSON.stringify({checks,errors,anonymousStatus:anonymous.status,persistence:'ISOLATED_SQLITE_IN_MEMORY',api:'SHARED_HANDLER_WITH_LOCAL_DATABASE',commercialDataUnchanged:true,productionWrites:0},null,2));console.log(JSON.stringify({checks,result:'PASS'}));
  } finally {await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
