import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { assertOrderMembership, moveOrderedItem, orderScopeId, parseOrderInput, persistProductOrder, sortCustomProducts, type OrderInput, type OrderTransaction } from "../lib/product-order";
import { createProductOrderHandler } from "../lib/product-order-handler";
import { catalogHref, catalogPage, parseCatalogFilters } from "../lib/catalog-filters";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE Product(id TEXT PRIMARY KEY,categoryId TEXT,sku TEXT,price TEXT,stock INTEGER,image TEXT,createdAt TEXT,updatedAt TEXT);
    CREATE TABLE CatalogOrderScope(id TEXT PRIMARY KEY,categoryId TEXT UNIQUE,version INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE CatalogProductOrder(scopeId TEXT REFERENCES CatalogOrderScope(id), productId TEXT REFERENCES Product(id),position INTEGER NOT NULL CHECK(position>=0),PRIMARY KEY(scopeId,productId),UNIQUE(scopeId,position));`);
  for (let i = 1; i <= 6; i++) db.prepare("INSERT INTO Product VALUES(?,?,?,?,?,?,?,?)").run(`p${i}`, i <= 4 ? "c" : i === 5 ? "d" : "other", `SKU-${i}`, "99.50", i * 10, `/image-${i}.png`, `2026-01-0${i}`, "unchanged");
  const snapshot = () => JSON.stringify(db.prepare("SELECT * FROM Product ORDER BY id").all());
  const initial = snapshot();
  const read = (scope = "category:c") => db.prepare("SELECT productId,position FROM CatalogProductOrder WHERE scopeId=? ORDER BY position").all(scope) as { productId: string; position: number }[];
  async function run(input: OrderInput, fail = false) {
    const tx: OrderTransaction = {
      getMemberIds: async category => (db.prepare(category === null ? "SELECT id FROM Product" : "SELECT id FROM Product WHERE categoryId IN (?,?)").all(...(category === null ? [] : category === "r" ? ["c", "d"] : [category, category])) as { id: string }[]).map(p => p.id),
      ensureScope: async (id, category) => { db.prepare("INSERT INTO CatalogOrderScope(id,categoryId) VALUES(?,?) ON CONFLICT(id) DO NOTHING").run(id, category); },
      advanceVersion: async (id, version) => Number(db.prepare("UPDATE CatalogOrderScope SET version=version+1 WHERE id=? AND version=?").run(id, version).changes) === 1,
      replacePositions: async (scope, ids) => {
        db.prepare("DELETE FROM CatalogProductOrder WHERE scopeId=?").run(scope);
        ids.forEach((id, position) => { db.prepare("INSERT INTO CatalogProductOrder VALUES(?,?,?)").run(scope, id, position); if (fail && position === 1) throw new Error("SIMULATED_FAILURE"); });
      },
    };
    db.exec("BEGIN IMMEDIATE");
    try { const result = await persistProductOrder(tx, parseOrderInput(input)); db.exec("COMMIT"); return result; }
    catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  return { db, run, read, snapshot, initial };
}

test("mover tercero al primero y primero al último; cancelar conserva el original", () => {
  const base = ["p1", "p2", "p3", "p4"];
  assert.deepEqual(moveOrderedItem(base, 2, 0), ["p3", "p1", "p2", "p4"]);
  assert.deepEqual(moveOrderedItem(base, 0, 3), ["p2", "p3", "p4", "p1"]);
  assert.deepEqual(base, ["p1", "p2", "p3", "p4"]);
  assert.deepEqual(moveOrderedItem(base, -1, 10), base);
});

test("validación: duplicados, tipos, versiones y pertenencia exacta", () => {
  for (const input of [null, {}, {categoryId:null,version:-1,productIds:[]}, {categoryId:null,version:0,productIds:["p1","p1"]}, {categoryId:1,version:0,productIds:[]}, {categoryId:null,version:0,productIds:["../bad"]}]) assert.throws(() => parseOrderInput(input));
  assert.throws(() => assertOrderMembership(["p1","p2"],["p1","foreign"]));
  assert.throws(() => assertOrderMembership(["p1","p2"],["p1"]));
});

test("guardar y recargar mantiene 3,1,2,4 sin cambiar campos comerciales", async () => {
  const f = fixture();
  try {
    assert.deepEqual(await f.run({categoryId:"c",version:0,productIds:["p3","p1","p2","p4"]}),{version:1});
    assert.deepEqual(f.read().map(p => p.productId),["p3","p1","p2","p4"]);
    assert.equal(f.snapshot(),f.initial);
    assert.throws(() => f.db.prepare("INSERT INTO CatalogProductOrder VALUES('category:c','p5',0)").run());
  } finally { f.db.close(); }
});

test("categoría, subcategoría y catálogo completo conservan órdenes independientes", async () => {
  const f=fixture();
  try {
    await f.run({categoryId:"r",version:0,productIds:["p5","p1","p2","p3","p4"]});
    await f.run({categoryId:null,version:0,productIds:["p6","p5","p4","p3","p2","p1"]});
    await f.run({categoryId:"c",version:0,productIds:["p3","p1","p2","p4"]});
    assert.deepEqual(f.read("category:r").map(p=>p.productId),["p5","p1","p2","p3","p4"]);
    assert.deepEqual(f.read("all").map(p=>p.productId),["p6","p5","p4","p3","p2","p1"]);
    assert.equal(f.snapshot(),f.initial);
  } finally {f.db.close();}
});

test("rollback: fallo intermedio, versión obsoleta y producto ajeno no dejan cambios", async () => {
  const f=fixture();
  try {
    await f.run({categoryId:"c",version:0,productIds:["p1","p2","p3","p4"]});
    const before=JSON.stringify(f.read());
    await assert.rejects(f.run({categoryId:"c",version:1,productIds:["p3","p1","p2","p4"]},true));
    assert.equal(JSON.stringify(f.read()),before);
    await assert.rejects(f.run({categoryId:"c",version:0,productIds:["p3","p1","p2","p4"]}));
    await assert.rejects(f.run({categoryId:"c",version:1,productIds:["p1","p2","p3","p6"]}));
    assert.equal(JSON.stringify(f.read()),before);
    assert.equal(f.snapshot(),f.initial);
  } finally {f.db.close();}
});

test("nuevos al final; filtros y paginación mantienen el orden completo antes de cortar", () => {
  const products=Array.from({length:31},(_,i)=>({id:`p${i+1}`,createdAt:new Date(2026,0,i+1),stock:i%2?0:5}));
  const sorted=sortCustomProducts(products,[{productId:"p3",position:0},{productId:"p1",position:1},{productId:"p2",position:2}]);
  assert.deepEqual(sorted.slice(0,4).map(p=>p.id),["p3","p1","p2","p4"]);
  const first=catalogPage(sorted,1,12), second=catalogPage(sorted,2,12);
  assert.equal(new Set([...first.products,...second.products].map(p=>p.id)).size,24);
  assert.deepEqual(catalogPage(sorted.filter(p=>p.stock>0),1,2).products.map(p=>p.id),["p3","p1"]);
  const filters=parseCatalogFilters({q:"cinta",min:"0",disponibilidad:"disponible",pagina:"2"});
  assert.equal(filters.sort,"custom");
  const href=new URL(catalogHref(filters,"cintas",2),"http://localhost");
  assert.equal(href.searchParams.get("pagina"),"2"); assert.equal(href.searchParams.get("q"),"cinta"); assert.equal(href.searchParams.get("disponibilidad"),"disponible");
  assert.equal(new URL(catalogHref(filters,"otro"),"http://localhost").searchParams.has("pagina"),false);
  assert.equal(orderScopeId("c"),"category:c");
});

test("API: 401/403, origen ajeno y errores seguros; ADMIN y SUPERADMIN autorizados", async () => {
  let writes=0;
  function handler(role: string|null) {return createProductOrderHandler({ getUser:async()=>role?{role}:null,save:async()=>{writes++;return{version:1};},revalidate:()=>{} });}
  const req=()=>new Request("https://acavike.test/api/admin/product-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categoryId:null,version:0,productIds:[]})});
  assert.equal((await handler(null)(req())).status,401);
  for(const role of ["CUSTOMER","SALES","WAREHOUSE"]) assert.equal((await handler(role)(req())).status,403);
  assert.equal(writes,0);
  const other=req(); other.headers.set("Origin","https://other.test"); assert.equal((await handler("ADMIN")(other)).status,403);
  for(const role of ["ADMIN","SUPERADMIN"]) assert.equal((await handler(role)(req())).status,200);
  const fail=createProductOrderHandler({getUser:async()=>({role:"ADMIN"}),save:async()=>{throw new Error("PRIVATE_SECRET");},revalidate:()=>{}});
  assert.doesNotMatch(await (await fail(req())).text(),/PRIVATE_SECRET/);
});

test("migración aditiva: solamente crea tablas de orden y relaciones a las existentes", () => {
  const sql=readFileSync("prisma/migrations/20261121160000_catalog_product_order/migration.sql","utf8");
  assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE|UPDATE|INSERT)\s+(TABLE|FROM|INTO|"Product")/i);
  assert.equal((sql.match(/CREATE TABLE/g)||[]).length,2);
  assert.doesNotMatch(sql,/ALTER TABLE "(?:Product|Category)"/);
  assert.match(sql,/UNIQUE INDEX "CatalogProductOrder_scopeId_position_key"/);
});
