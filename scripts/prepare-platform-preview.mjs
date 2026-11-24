#!/usr/bin/env node
/**
 * Build the existing mike-ai home screen into ./site for the branch preview.
 * The repo-root hub stays in the repository and is copied under /hub, not served at /.
 * API routes are stashed only for this static export, then restored.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mike = path.join(root, "mike-ai");
const site = path.join(root, "site");
const apiDir = path.join(mike, "src", "app", "api");
const stash = path.join(os.tmpdir(), `mike-ai-api-stash-preview-${process.pid}-${Date.now()}`);

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", cwd: root, env });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(path.join(mike, "node_modules", "next"))) {
  run("npm", ["ci", "--prefix", "mike-ai"]);
}

fs.rmSync(path.join(mike, ".next", "lock"), { force: true });
const stashed = fs.existsSync(apiDir);
if (stashed) fs.renameSync(apiDir, stash);

let buildStatus = 0;
try {
  const result = spawnSync("npm", ["--prefix", "mike-ai", "run", "build"], {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, PLATFORM_EXPORT: "1" },
  });
  buildStatus = result.status ?? 1;
} finally {
  if (stashed) {
    if (fs.existsSync(apiDir)) fs.rmSync(apiDir, { recursive: true, force: true });
    if (!fs.existsSync(stash)) {
      console.error("prepare-platform-preview: API stash missing; routes were not restored");
      buildStatus = 1;
    } else {
      fs.renameSync(stash, apiDir);
    }
  }
}
if (buildStatus !== 0) process.exit(buildStatus);

const outDir = path.join(mike, "out");
if (!fs.existsSync(path.join(outDir, "index.html"))) {
  console.error("prepare-platform-preview: mike-ai/out/index.html is missing");
  process.exit(1);
}
const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
if (!html.includes("AI Project Platform")) {
  console.error("prepare-platform-preview: export is not the AI Project Platform home screen");
  process.exit(1);
}

fs.rmSync(site, { recursive: true, force: true });
copyDir(outDir, site);
fs.mkdirSync(path.join(site, "hub"), { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(site, "hub", "index.html"));
console.log("prepare-platform-preview: ./site is the mike-ai home screen; hub is at /hub");
run("node", ["./scripts/ensure-preview-d1.mjs"]);
