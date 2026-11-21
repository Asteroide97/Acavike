import { randomUUID } from "node:crypto";

export function createCatalogSku() {
  return `ACV-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}
