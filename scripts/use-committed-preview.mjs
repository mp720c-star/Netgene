#!/usr/bin/env node
/**
 * Cloudflare builds should upload the committed home screen.
 * Rebuilding Next here is what made the branch preview fail closed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "site", "index.html");
const manifestPath = path.join(root, "site", "manifest.webmanifest");
if (!fs.existsSync(indexPath) || !fs.readFileSync(indexPath, "utf8").includes("AI Project Platform")) {
  console.error("use-committed-preview: site/index.html is not the AI Project Platform home screen");
  process.exit(1);
}
if (!fs.existsSync(manifestPath)) {
  console.error("use-committed-preview: site/manifest.webmanifest is missing");
  process.exit(1);
}
fs.mkdirSync(path.join(root, "site", "hub"), { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(root, "site", "hub", "index.html"));
console.log("use-committed-preview: ./site is the mike-ai home screen; hub is at /hub");
