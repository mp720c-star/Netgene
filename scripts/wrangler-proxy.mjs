#!/usr/bin/env node
/**
 * Proxy for Cloudflare Workers Builds when two Workers share one repo.
 * Default deploy command is `npx wrangler deploy` — this local bin intercepts
 * it, then retries deploy with each known Worker name until one succeeds
 * (token is typically scoped to the Worker that started the build).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const WORKERS = ["proud-bread-5014", "rough-breeze-46d1"];

const require = createRequire(path.join(root, "package.json"));

function resolveWranglerCli() {
  const candidates = [
    path.join(root, "node_modules/wrangler-sdk/bin/wrangler.js"),
    path.join(root, "node_modules/wrangler/bin/wrangler.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  try {
    return require.resolve("wrangler-sdk/bin/wrangler.js");
  } catch {
    try {
      return require.resolve("wrangler/bin/wrangler.js");
    } catch {
      console.error("wrangler-proxy: could not resolve wrangler CLI package");
      process.exit(1);
    }
  }
}

function setTomlName(name) {
  const tomlPath = path.join(root, "wrangler.toml");
  if (!fs.existsSync(tomlPath)) return;
  let toml = fs.readFileSync(tomlPath, "utf8");
  if (/^name\s*=/m.test(toml)) {
    toml = toml.replace(/^name\s*=\s*".*"/m, `name = "${name}"`);
  } else {
    toml = `name = "${name}"\n` + toml;
  }
  fs.writeFileSync(tomlPath, toml);
}

function stripNameArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name") {
      i += 1;
      continue;
    }
    if (args[i].startsWith("--name=")) continue;
    out.push(args[i]);
  }
  return out;
}

function detectPreferredName() {
  const explicit =
    process.env.CF_WORKER_NAME ||
    process.env.WORKER_NAME ||
    process.env.CLOUDFLARE_WORKER_NAME;
  if (explicit && WORKERS.includes(explicit)) return explicit;

  const blob = Object.entries(process.env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  return WORKERS.find((w) => blob.includes(w)) || null;
}

const args = process.argv.slice(2);
const wranglerCli = resolveWranglerCli();

if (args[0] !== "deploy") {
  const result = spawnSync(process.execPath, [wranglerCli, ...args], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

function branchName() {
  const fromEnv =
    process.env.WORKERS_CI_BRANCH ||
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    "";
  if (fromEnv && fromEnv !== "HEAD") return fromEnv;
  const shown = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  return (shown.stdout || "").trim();
}

function previewAliasFor(name) {
  return name
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const branch = branchName();
const productionBranch = process.env.WORKERS_CI_PRODUCTION_BRANCH || "main";
const productionAllowed =
  process.env.ALLOW_PRODUCTION_DEPLOY === "1" ||
  (branch.length > 0 && branch === productionBranch);

const clean = stripNameArgs(args.slice(1));
const preferred = detectPreferredName();
const order = preferred
  ? [preferred, ...WORKERS.filter((w) => w !== preferred)]
  : WORKERS;

if (!productionAllowed) {
  const alias = previewAliasFor(branch);
  if (!alias) {
    console.error("wrangler-proxy: refusing deploy. No branch name for a preview alias. Production was not published.");
    process.exit(1);
  }
  const home = path.join(root, "site", "index.html");
  const homeHtml = fs.existsSync(home) ? fs.readFileSync(home, "utf8") : "";
  if (!homeHtml.includes("AI Project Platform")) {
    console.error("wrangler-proxy: site/index.html is not the AI Project Platform home screen. Production was not published.");
    process.exit(1);
  }
  const ensured = spawnSync(process.execPath, [path.join(root, "scripts", "ensure-preview-d1.mjs")], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  if ((ensured.status ?? 1) !== 0) process.exit(ensured.status ?? 1);
  let lastStatus = 1;
  for (const name of order) {
    console.log(`wrangler-proxy: uploading preview version as "${name}" alias "${alias}"`);
    setTomlName(name);
    const result = spawnSync(
      process.execPath,
      [wranglerCli, "versions", "upload", "--name", name, "--preview-alias", alias, ...clean],
      { stdio: "inherit", cwd: root, env: process.env },
    );
    lastStatus = result.status ?? 1;
    if (lastStatus === 0) {
      console.log(`wrangler-proxy: preview version uploaded as "${name}". Production was not published.`);
      process.exit(0);
    }
  }
  process.exit(lastStatus);
}

let lastStatus = 1;
for (const name of order) {
  console.log(`wrangler-proxy: trying deploy as "${name}"`);
  setTomlName(name);
  const result = spawnSync(
    process.execPath,
    [wranglerCli, "deploy", "--name", name, ...clean],
    {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    }
  );
  lastStatus = result.status ?? 1;
  if (lastStatus === 0) {
    console.log(`wrangler-proxy: deploy succeeded as "${name}"`);
    process.exit(0);
  }
}

process.exit(lastStatus);
