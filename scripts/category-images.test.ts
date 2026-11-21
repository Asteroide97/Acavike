import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import type { UserRole } from "@prisma/client";
import { createCategoryImageUploadHandler } from "../lib/category-image-upload";
import { categoryImageUrl, detectCategoryImageType, MAX_CATEGORY_IMAGE_BYTES, parseCategoryImageField, validateCategoryImageFile } from "../lib/category-images";

const webp = readFileSync("public/home/category-0.webp");
const png = readFileSync("public/brand/acavike-supplies-logo.png");
const storageUrl = "https://category-qa.public.blob.vercel-storage.com/category-images/photo.webp";
function request(file: File = new File([webp], "foto.webp", { type: "image/webp" }), categoryId = "root") {
  const form = new FormData(); form.set("file", file); form.set("categoryId", categoryId);
  return new Request("https://acavike.test/api/admin/category-images", { method: "POST", body: form, headers: { origin: "https://acavike.test" } });
}
function setup(role: UserRole | null = "ADMIN", overrides = {}) {
  const calls: string[] = [];
  const handler = createCategoryImageUploadHandler({
    getUser: async () => role ? { role } : null,
    enabled: () => true, configured: () => true,
    categoryExists: async () => true,
    putImage: async (pathname: string) => { calls.push(pathname); return { url: storageUrl, pathname }; },
    ...overrides,
  });
  return { handler, calls };
}

test("formatos: acepta JPG/PNG/WebP, rechaza SVG, MIME engañoso, vacíos y más de 4 MB", () => {
  for (const [name, type] of [["foto.JPG", "image/jpeg"], ["foto.jpeg", "image/jpeg"], ["foto.png", "image/png"], ["foto.webp", "image/webp"]]) assert.equal(validateCategoryImageFile({ name, type, size: 100 }), null);
  for (const file of [{ name: "x.svg", type: "image/svg+xml", size: 10 }, { name: "x.png", type: "image/jpeg", size: 10 }, { name: "x.png", type: "image/png", size: 0 }, { name: "x.png", type: "image/png", size: MAX_CATEGORY_IMAGE_BYTES + 1 }]) assert.ok(validateCategoryImageFile(file));
  assert.equal(detectCategoryImageType(webp), "image/webp"); assert.equal(detectCategoryImageType(png), "image/png");
  assert.equal(detectCategoryImageType(new TextEncoder().encode("<svg/>")), null);
});
test("URLs: solo rutas locales o Blob público HTTPS sin credenciales", () => {
  assert.equal(categoryImageUrl(storageUrl), storageUrl);
  assert.equal(categoryImageUrl("/placeholder-category.svg"), "/placeholder-category.svg");
  for (const url of ["javascript:alert(1)", "data:image/png;base64,abc", "//example.com/x", "https://example.com/x.png", "https://user:password@category-qa.public.blob.vercel-storage.com/x.png", "https://category-qa.public.blob.vercel-storage.com.evil.test/x", "/\\example.com/x"]) assert.equal(categoryImageUrl(url), null);
  assert.equal(parseCategoryImageField(""), null); assert.throws(() => parseCategoryImageField("https://example.com/x"));
});
for (const role of [null, "CUSTOMER", "WAREHOUSE", "SALES"] as const) {
  test(`permisos: ${role || "sin sesión"} no puede subir archivos`, async () => {
    const { handler, calls } = setup(role);
    assert.equal((await handler(request())).status, role ? 403 : 401); assert.equal(calls.length, 0);
  });
}
for (const role of ["ADMIN", "SUPERADMIN"] as const) {
  test(`carga autorizada ${role}: URL, ruta, tamaño y tipo correctos`, async () => {
    const { handler, calls } = setup(role);
    const response = await handler(request()); const data = await response.json();
    assert.equal(response.status, 200); assert.equal(data.url, storageUrl); assert.equal(data.size, webp.length); assert.equal(data.contentType, "image/webp");
    assert.match(calls[0], /^category-images\/root\/[a-f0-9-]+\.webp$/);
  });
}
test("categorías nuevas y subcategorías utilizan la misma carga", async () => {
  const { handler, calls } = setup();
  assert.equal((await handler(request(undefined, ""))).status, 200);
  assert.equal((await handler(request(undefined, "child"))).status, 200);
  assert.ok(calls[0].startsWith("category-images/temp/")); assert.ok(calls[1].startsWith("category-images/child/"));
});
test("API rechaza origen ajeno, categoría inexistente o identificador inseguro", async () => {
  const { handler, calls } = setup();
  const cross = request(); cross.headers.set("origin", "https://evil.test");
  assert.equal((await handler(cross)).status, 403);
  assert.equal((await handler(request(undefined, "../../evil"))).status, 400);
  assert.equal((await setup("ADMIN", { categoryExists: async () => false }).handler(request())).status, 404);
  assert.equal(calls.length, 0);
});
test("API rechaza archivos falsificados y peticiones demasiado grandes", async () => {
  const { handler, calls } = setup();
  assert.equal((await handler(request(new File(["<svg/>"], "falso.png", { type: "image/png" })))).status, 400);
  const huge = request(); huge.headers.set("content-length", String(MAX_CATEGORY_IMAGE_BYTES + 100000));
  assert.equal((await handler(huge)).status, 413); assert.equal(calls.length, 0);
  const malformed = new Request("https://acavike.test/api/admin/category-images", { method: "POST", body: "not multipart" });
  assert.equal((await handler(malformed)).status, 400);
});
test("demo y Blob sin configuración fallan controladamente sin subir archivos", async () => {
  assert.equal((await setup("ADMIN", { enabled: () => false }).handler(request())).status, 400);
  assert.equal((await setup("ADMIN", { configured: () => false }).handler(request())).status, 503);
});
test("errores del proveedor no revelan secretos ni detalles internos", async () => {
  const { handler } = setup("ADMIN", { putImage: async () => { throw new Error("TEST_SECRET_NOT_FOR_RESPONSE"); } });
  const response = await handler(request()); assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes("TEST_SECRET"));
});
test("persistencia local: URL del formulario, reemplazo, recarga y NULL al quitar; referencia compartida intacta", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE Category(id TEXT PRIMARY KEY, parentId TEXT, imageUrl TEXT); INSERT INTO Category VALUES ('root',NULL,NULL),('child','root',NULL)");
    function save(id: string, value: string) { const form = new FormData(); form.set("imageUrl", value); db.prepare("UPDATE Category SET imageUrl=? WHERE id=?").run(parseCategoryImageField(form.get("imageUrl")), id); }
    function saved(id: string) { return db.prepare("SELECT imageUrl FROM Category WHERE id=?").get(id)?.imageUrl; }
    const { handler } = setup(); const uploaded = await (await handler(request())).json();
    save("root", uploaded.url); assert.equal(saved("root"), storageUrl);
    save("child", uploaded.url); const replacement = storageUrl.replace("photo.webp", "replacement.webp");
    save("root", replacement); assert.equal(saved("root"), replacement); assert.equal(saved("child"), storageUrl);
    save("root", ""); assert.equal(saved("root"), null); assert.equal(saved("child"), storageUrl);
    assert.throws(() => save("child", "javascript:alert(1)")); assert.equal(saved("child"), storageUrl);
  } finally { db.close(); }
});
