#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "ravin-lookup", "dist");
const targets = [
  path.join(root, "mike-ai", "public", "downloads"),
  path.join(root, "downloads"),
];

const files = [
  ["Ravin Lookup Car Truck-1.0.0-win-x64.exe", "Ravin-Lookup-Car-Truck-1.0.0-win-x64.exe"],
  ["Ravin Lookup Dirt Bike-1.0.0-win-x64.exe", "Ravin-Lookup-Dirt-Bike-1.0.0-win-x64.exe"],
  ["Ravin Lookup ATV-1.0.0-win-x64.exe", "Ravin-Lookup-ATV-1.0.0-win-x64.exe"],
];

for (const dir of targets) fs.mkdirSync(dir, { recursive: true });

const sums = [];
for (const [fromName, toName] of files) {
  const from = path.join(dist, fromName);
  if (!fs.existsSync(from)) {
    console.error(`missing ${from} — run: npm run pack:ravin:win`);
    process.exit(1);
  }
  const buf = fs.readFileSync(from);
  const hash = createHash("sha256").update(buf).digest("hex");
  sums.push(`${hash}  ${toName}`);
  for (const dir of targets) {
    fs.writeFileSync(path.join(dir, toName), buf);
  }
  console.log(`synced ${toName} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

const sumsText = `${sums.join("\n")}\n`;
for (const dir of targets) {
  fs.writeFileSync(path.join(dir, "SHA256SUMS.txt"), sumsText);
}
console.log("wrote SHA256SUMS.txt");
