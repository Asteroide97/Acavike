/* eslint-disable @typescript-eslint/no-require-imports -- Deterministic asset conversion. */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');
(async () => {
  const source = process.argv[2];
  if (!source) throw new Error('Indica el PNG original autorizado.');
  const original = path.resolve('public/brand/acavike-registered-original.png');
  const target = path.resolve('public/brand/acavike-registered-logo.webp');
  await fs.copyFile(source, original, require('node:fs').constants.COPYFILE_EXCL);
  // Remove only the empty black canvas; never redraw, resize or recolor the mark.
  const region = { left: 240, top: 616, width: 1612, height: 297 };
  const metadata = await sharp(original).metadata();
  assert.equal(metadata.width, 2048); assert.equal(metadata.height, 1536);
  await sharp(original).extract(region).webp({ lossless: true, effort: 6 }).toFile(target);
  const expected = await sharp(original).extract(region).ensureAlpha().raw().toBuffer();
  const actual = await sharp(target).ensureAlpha().raw().toBuffer();
  assert.ok(expected.equals(actual), 'La conversion debe preservar cada pixel del recorte.');
  const result = { source: 'acavike-registered-original.png', target: 'acavike-registered-logo.webp', ...region, losslessPixels: true, originalBytes: (await fs.stat(original)).size, webpBytes: (await fs.stat(target)).size };
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
