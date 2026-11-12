#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".expo" || entry.name === ".git") {
      continue;
    }
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

rmrf(site);
fs.mkdirSync(site, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(site, "index.html"));
copyDir(path.join(root, "forma"), path.join(site, "forma"));
copyDir(path.join(root, "vehicle-genius"), path.join(site, "vehicle-genius"));
fs.mkdirSync(path.join(site, "cdi-genius"), { recursive: true });
fs.copyFileSync(path.join(root, "cdi-genius", "index.html"), path.join(site, "cdi-genius", "index.html"));
fs.copyFileSync(path.join(root, "cdi-genius", "README.md"), path.join(site, "cdi-genius", "README.md"));

console.log("prepare-site: wrote static site to ./site");
