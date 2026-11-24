#!/usr/bin/env node
/**
 * Point wrangler.toml at the shared branch-preview D1 database.
 * No token means local wrangler dev, which keeps the placeholder id.
 * This does not run `wrangler deploy` and does not touch Supabase.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tomlPath = path.join(root, "wrangler.toml");
const placeholder = "00000000-0000-0000-0000-000000000000";
const databaseName = "platform-preview-shared";
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;

function useMemoryStore(reason) {
  let toml = fs.readFileSync(tomlPath, "utf8");
  toml = toml.replace(/\[\[d1_databases\]\][\s\S]*?database_id = "[^"]+"\n/g, "");
  toml = toml.replace(/\[\[previews\.d1_databases\]\][\s\S]*?database_id = "[^"]+"\n/g, "");
  if (!toml.includes("PREVIEW_STORE")) {
    toml += '\n[vars]\nPREVIEW_STORE = "memory"\n';
  }
  fs.writeFileSync(tomlPath, toml);
  console.log(`ensure-preview-d1: using the preview memory store (${reason})`);
}

if (!token) {
  useMemoryStore("no Cloudflare token");
  process.exit(0);
}

const wranglerCli = path.join(root, "node_modules/wrangler-sdk/bin/wrangler.js");

function wrangler(args) {
  const result = spawnSync(process.execPath, [wranglerCli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return { status: result.status ?? 1, output };
}

function readDatabases(output) {
  const start = output.indexOf("[");
  const end = output.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(output.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function databaseId(row) {
  return row.uuid || row.database_id || row.id || "";
}

let listed = wrangler(["d1", "list", "--json"]);
let rows = readDatabases(listed.output);
let match = rows.find((row) => row.name === databaseName);
if (!match) {
  const created = wrangler(["d1", "create", databaseName]);
  if (created.status !== 0 && !/already exists/i.test(created.output)) {
    console.error(created.output);
    useMemoryStore("preview database was not created");
    process.exit(0);
  }
  listed = wrangler(["d1", "list", "--json"]);
  rows = readDatabases(listed.output);
  match = rows.find((row) => row.name === databaseName);
}
const id = match ? databaseId(match) : "";
if (!/^[0-9a-f-]{36}$/i.test(id) || id === placeholder) {
  useMemoryStore("preview database id was not available");
  process.exit(0);
}
const toml = fs.readFileSync(tomlPath, "utf8").split(placeholder).join(id);
fs.writeFileSync(tomlPath, toml);
console.log(`ensure-preview-d1: bound ${databaseName} (${id})`);
