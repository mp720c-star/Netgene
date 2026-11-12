#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(root, "node_modules", ".bin");
const target = path.join(binDir, "wrangler");
const proxy = path.join(root, "scripts", "wrangler-proxy.mjs");

fs.mkdirSync(binDir, { recursive: true });
try {
  fs.unlinkSync(target);
} catch {
  /* missing is fine */
}
fs.symlinkSync(path.relative(binDir, proxy), target);
console.log("link-wrangler-proxy: node_modules/.bin/wrangler -> scripts/wrangler-proxy.mjs");
