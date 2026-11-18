#!/usr/bin/env node
/**
 * Import ATDD native iPhone candidate package (append-only).
 * Looks in mike-ai/recovery/private/inbox/ for zip/tar archives or an extracted folder
 * containing CURSOR_HANDOFF.txt, then copies ios/ into atdd/ios/ without deleting backups.
 *
 * Never prints or commits signing secrets / certificates.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inbox = path.join(root, "mike-ai/recovery/private/inbox");
const destIos = path.join(root, "atdd/ios");
const stamp = new Date().toISOString().replace(/[:.]/g, "").replace("T", "T").slice(0, 16) + "Z";
const work = path.join(inbox, `_extract_${stamp}`);

function sha256File(p) {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function findHandoff(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of fs.readdirSync(cur)) {
      const full = path.join(cur, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (name === "CURSOR_HANDOFF.txt") return full;
    }
  }
  return null;
}

function findIosTree(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const names = fs.readdirSync(cur);
    if (
      names.includes("App") ||
      names.some((n) => n.endsWith(".xcodeproj") || n.endsWith(".xcworkspace")) ||
      names.includes("capacitor.config.json") ||
      names.includes("capacitor.config.ts")
    ) {
      return cur;
    }
    for (const name of names) {
      const full = path.join(cur, name);
      if (fs.statSync(full).isDirectory() && !name.startsWith("_extract_")) stack.push(full);
    }
  }
  return null;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(inbox)) {
  console.error(`BLOCKED: inbox missing at ${inbox}`);
  process.exit(2);
}

const archives = fs
  .readdirSync(inbox)
  .filter((n) => /\.(zip|tgz|tar\.gz)$/i.test(n))
  .map((n) => path.join(inbox, n));

const looseHandoff = findHandoff(inbox);
if (archives.length === 0 && !looseHandoff) {
  console.error(
    "BLOCKED: No candidate package in mike-ai/recovery/private/inbox/.\n" +
      "Expected a .zip/.tgz containing CURSOR_HANDOFF.txt (and ios/).\n" +
      "Re-attach the complete candidate package to chat or copy it into the inbox.",
  );
  process.exit(2);
}

fs.mkdirSync(work, { recursive: true });
const report = {
  ok: false,
  stamp,
  archives: [],
  handoffPath: null,
  iosSource: null,
  notes: [],
};

for (const arch of archives) {
  const digest = sha256File(arch);
  report.archives.push({ name: path.basename(arch), sha256: digest, bytes: fs.statSync(arch).size });
  const extractTo = path.join(work, path.basename(arch).replace(/\.(zip|tgz|tar\.gz)$/i, ""));
  fs.mkdirSync(extractTo, { recursive: true });
  try {
    if (/\.zip$/i.test(arch)) execFileSync("unzip", ["-q", arch, "-d", extractTo], { stdio: "inherit" });
    else execFileSync("tar", ["-xzf", arch, "-C", extractTo], { stdio: "inherit" });
  } catch (err) {
    report.notes.push(`Failed to extract ${path.basename(arch)}: ${err.message}`);
  }
}

const searchRoots = [work, inbox];
let handoff = null;
for (const r of searchRoots) {
  handoff = findHandoff(r);
  if (handoff) break;
}
if (!handoff) {
  console.error("BLOCKED: CURSOR_HANDOFF.txt not found after extract.");
  process.exit(3);
}
report.handoffPath = path.relative(root, handoff);
const handoffText = fs.readFileSync(handoff, "utf8");
fs.writeFileSync(path.join(root, "docs/status-board/CURSOR_HANDOFF_IMPORTED.txt"), handoffText);
report.notes.push("Copied CURSOR_HANDOFF.txt to docs/status-board/CURSOR_HANDOFF_IMPORTED.txt");

const iosSrc = findIosTree(path.dirname(handoff)) || findIosTree(work);
if (!iosSrc) {
  console.error("BLOCKED: Could not locate ios / Xcode / Capacitor project in package.");
  process.exit(4);
}
report.iosSource = path.relative(root, iosSrc);

const backup = path.join(root, `atdd/backups/ios-before-import-${stamp}`);
if (fs.existsSync(path.join(destIos, "App")) || fs.existsSync(path.join(destIos, "App.xcodeproj"))) {
  copyDir(destIos, backup);
  report.notes.push(`Backed up existing atdd/ios → ${path.relative(root, backup)}`);
}

// Preserve README, replace project contents
const readme = path.join(destIos, "README.md");
const readmeText = fs.existsSync(readme) ? fs.readFileSync(readme, "utf8") : "";
for (const name of fs.readdirSync(destIos)) {
  if (name === "README.md") continue;
  fs.rmSync(path.join(destIos, name), { recursive: true, force: true });
}
copyDir(iosSrc, destIos);
if (readmeText) fs.writeFileSync(readme, readmeText);

report.ok = true;
const out = path.join(root, "docs/status-board/ATDD-IOS-IMPORT-REPORT.json");
fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${path.relative(root, out)}`);
