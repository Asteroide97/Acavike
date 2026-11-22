/* eslint-disable @typescript-eslint/no-require-imports -- Local isolated Prisma integration. */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
(async()=>{
  const root=path.resolve('node_modules/.cache/acavike-order-integration',randomUUID());
  await fs.mkdir(root,{recursive:true});
  const schema=(await fs.readFile('prisma/schema.sqlite.prisma','utf8')).replace('provider = "prisma-client-js"','provider = "prisma-client-js"\n  output = "./client"');
  const schemaPath=path.join(root,'schema.prisma');await fs.writeFile(schemaPath,schema);
  // Always override any inherited connection before loading application modules.
  process.env.DATABASE_URL='file:./isolated.db';
  process.env.DEMO_MODE='false'; process.env.FORCE_REAL_MODE='true';
  const {DatabaseSync}=require('node:sqlite');
  const empty=new DatabaseSync(path.join(root,'isolated.db'));empty.exec('PRAGMA user_version=0');empty.close();
  const cli=path.resolve('node_modules/prisma/build/index.js');
  for(const command of [['generate','--schema',schemaPath],['db','push','--schema',schemaPath,'--skip-generate']])execFileSync(process.execPath,[cli,...command],{env:process.env,stdio:'pipe'});
  const {PrismaClient}=require(path.join(root,'client'));const db=new PrismaClient();global.prismaGlobal=db;
  require('tsx/cjs');
  const {saveProductOrderRepository,getProductOrderingRepository}=require('../lib/repositories/product-order.ts');
  const {getCatalogPageDataRepository}=require('../lib/repositories/catalog.ts');
  const {catalogPage}=require('../lib/catalog-filters.ts');
  const ids=products=>products.map(product=>product.id);
  const filters={query:'',categorySlug:'cintas',sort:'custom'};
  try{
    const database=await db.$queryRawUnsafe('PRAGMA database_list');
    assert.equal(path.normalize(database.find(row=>row.name==='main').file),path.normalize(path.join(root,'isolated.db')));
    for(const data of [{id:'r',name:'Empaque',slug:'empaque'},{id:'c',name:'Cintas',slug:'cintas',parentId:'r'},{id:'d',name:'Cajas',slug:'cajas',parentId:'r'}])await db.category.create({data});
    for(let i=1;i<=6;i++)await db.product.create({data:{id:`p${i}`,name:`Producto ${i}`,slug:`producto-${i}`,sku:`TEST-${i}`,categoryId:i<=4?'c':'d',price:50+i,unit:'pieza',stock:i*2,createdAt:new Date(2026,0,i),images:{create:{url:`/test-${i}.png`,alt:`Test ${i}`}}}});
    const snapshot=async()=>JSON.stringify(await db.product.findMany({orderBy:{id:'asc'},include:{images:{orderBy:{id:'asc'}},priceTiers:true}}));
    const before=await snapshot();
    await saveProductOrderRepository({categoryId:'r',version:0,productIds:['p6','p5','p4','p3','p2','p1']});
    await saveProductOrderRepository({categoryId:'c',version:0,productIds:['p3','p1','p2','p4']});
    assert.deepEqual(ids((await getProductOrderingRepository('c')).products),['p3','p1','p2','p4']);
    assert.deepEqual(ids((await getProductOrderingRepository('r')).products),['p6','p5','p4','p3','p2','p1']);
    const catalog=await getCatalogPageDataRepository(filters);assert.deepEqual(ids(catalog.products),['p3','p1','p2','p4']);
    assert.deepEqual(ids(catalogPage(catalog.products,2,2).products),['p2','p4']);
    assert.deepEqual(ids((await getCatalogPageDataRepository({...filters,minPrice:52,inStock:true})).products),['p3','p2','p4']);
    assert.deepEqual(ids((await getCatalogPageDataRepository({...filters,sort:'price_asc'})).products),['p1','p2','p3','p4']);
    assert.equal(await snapshot(),before);
    await assert.rejects(saveProductOrderRepository({categoryId:'c',version:0,productIds:['p1','p2','p3','p4']}));
    await assert.rejects(saveProductOrderRepository({categoryId:'c',version:1,productIds:['p1','p2','p3','p6']}));
    await db.product.create({data:{id:'new',name:'Nuevo',slug:'nuevo',sku:'TEST-NEW',categoryId:'c',price:10,unit:'pieza',stock:1}});
    assert.deepEqual(ids((await getCatalogPageDataRepository(filters)).products),['p3','p1','p2','p4','new']);
    const snapshotWithNew=await snapshot();const scopeBefore=JSON.stringify(await db.catalogOrderScope.findMany());
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_test_position BEFORE INSERT ON CatalogProductOrder WHEN NEW.productId='p2' BEGIN SELECT RAISE(ABORT,'LOCAL_TEST_FAILURE'); END;`);
    await assert.rejects(saveProductOrderRepository({categoryId:'c',version:1,productIds:['new','p2','p1','p3','p4']}));
    assert.deepEqual(ids((await getProductOrderingRepository('c')).products),['p3','p1','p2','p4','new']);
    assert.equal(JSON.stringify(await db.catalogOrderScope.findMany()),scopeBefore);assert.equal(await snapshot(),snapshotWithNew);
    console.log(JSON.stringify({engine:'ISOLATED_SQLITE_PRISMA',realRepository:true,saveReload:'PASS',scopeIsolation:'PASS',publicCustomSort:'PASS',filtersPagination:'PASS',priceSort:'PASS',newProductAtEnd:'PASS',conflicts:'PASS',transactionRollback:'PASS',commercialDataUnchanged:true,productionWrites:0}));
  }finally{await db.$disconnect();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
