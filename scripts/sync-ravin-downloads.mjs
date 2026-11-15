#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "ravin-lookup", "dist");
// Canonical location committed to git (GitHub hosts the .exe for other PCs).
const target = path.join(root, "downloads");

const files = [
  ["Ravin Lookup Car Truck-1.0.0-win-x64.exe", "Ravin-Lookup-Car-Truck-1.0.0-win-x64.exe"],
  ["Ravin Lookup Dirt Bike-1.0.0-win-x64.exe", "Ravin-Lookup-Dirt-Bike-1.0.0-win-x64.exe"],
  ["Ravin Lookup ATV-1.0.0-win-x64.exe", "Ravin-Lookup-ATV-1.0.0-win-x64.exe"],
];

fs.mkdirSync(target, { recursive: true });

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
  fs.writeFileSync(path.join(target, toName), buf);
  console.log(`synced ${toName} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

fs.writeFileSync(path.join(target, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);
// Keep checksums in mike-ai public for the Next test surface.
const mikeSums = path.join(root, "mike-ai", "public", "downloads");
fs.mkdirSync(mikeSums, { recursive: true });
fs.writeFileSync(path.join(mikeSums, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);
console.log("wrote SHA256SUMS.txt");
