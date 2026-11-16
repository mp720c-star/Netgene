import { timingSafeEqual } from "node:crypto";

/** Bearer token for ChatGPT/coordinator registry import. Never log the value. */
export function registryImportConfigured(): boolean {
  const t = process.env.REGISTRY_IMPORT_TOKEN?.trim();
  return Boolean(t && t.length >= 24);
}

export function checkRegistryImportBearer(req: Request): boolean {
  const expected = process.env.REGISTRY_IMPORT_TOKEN?.trim();
  if (!expected || expected.length < 24) return false;
  const header = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return false;
  const got = m[1].trim();
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
