#!/usr/bin/env node
/**
 * Extract pinoutDB verbatim from CDI Genius runtime web/app.js.
 * Does not invent pin colors, ohms, years, or labels.
 *
 * Usage:
 *   node atdd/scripts/extract-cdi-pinout-db.mjs --source /path/to/web/app.js
 *
 * Expected source SHA-256:
 *   b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const EXPECTED_SOURCE_SHA256 =
  "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c";
const EXPECTED_PROFILE_COUNT = 71;
const EXPECTED_SLOT_COUNT = 448;
const EXPECTED_PROVENANCE = { verified: 58, unverified: 9, reference: 4 };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "classic/data");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : "";
}

function sha256Bytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function sha256Text(text) {
  return sha256Bytes(Buffer.from(text, "utf8"));
}

function defaultSourceCandidates() {
  return [
    argValue("--source"),
    process.env.CDI_RUNTIME_APP_JS,
    "/workspace/atdd_cdi/extracted/cdi_runtime/web/app.js",
  ].filter(Boolean);
}

function extractPinoutObject(sourceText) {
  const start = sourceText.indexOf("let pinoutDB = {");
  if (start < 0) throw new Error("pinoutDB assignment not found");
  const brace = sourceText.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = brace; i < sourceText.length; i++) {
    const ch = sourceText[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("pinoutDB object was not closed");
  const ctx = {};
  vm.runInNewContext("pinoutDB = " + sourceText.slice(brace, end + 1), ctx);
  return ctx.pinoutDB;
}

function slotCount(profiles) {
  let n = 0;
  for (const profile of Object.values(profiles)) {
    n += Array.isArray(profile.slots) ? profile.slots.length : 0;
  }
  return n;
}

function provenanceCounts(profiles) {
  const counts = {};
  for (const profile of Object.values(profiles)) {
    const key = profile.provenance;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function canonicalJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function wrapJs(globalName, value, header) {
  const json = JSON.stringify(value, null, 2);
  return (
    "/* " +
    header +
    " */\n(function (root) {\n  root." +
    globalName +
    " = " +
    json +
    ";\n})(typeof window !== \"undefined\" ? window : globalThis);\n"
  );
}

const sourcePath = defaultSourceCandidates().find((p) => fs.existsSync(p));
if (!sourcePath) {
  throw new Error("Runtime app.js not found. Pass --source /path/to/web/app.js");
}

const sourceBuf = fs.readFileSync(sourcePath);
const sourceSha = sha256Bytes(sourceBuf);
if (sourceSha !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    "Refusing to extract: source SHA-256 is " +
      sourceSha +
      ", expected " +
      EXPECTED_SOURCE_SHA256
  );
}

const raw = extractPinoutObject(sourceBuf.toString("utf8"));
const keys = Object.keys(raw);
if (keys.length !== EXPECTED_PROFILE_COUNT) {
  throw new Error("Expected " + EXPECTED_PROFILE_COUNT + " profiles, found " + keys.length);
}

const profiles = {};
for (const key of keys) {
  const profile = raw[key];
  if (!profile || typeof profile !== "object") throw new Error("Bad profile " + key);
  // Copy original fields only, then add source_key (the original pinoutDB key).
  profiles[key] = { source_key: key, ...profile };
}

const slots = slotCount(profiles);
if (slots !== EXPECTED_SLOT_COUNT) {
  throw new Error("Expected " + EXPECTED_SLOT_COUNT + " slots, found " + slots);
}
const provenance = provenanceCounts(profiles);
for (const label of Object.keys(EXPECTED_PROVENANCE)) {
  if (provenance[label] !== EXPECTED_PROVENANCE[label]) {
    throw new Error(
      "Provenance " + label + " count " + provenance[label] + " != " + EXPECTED_PROVENANCE[label]
    );
  }
}

const payload = {
  source: "CDI_Genius_Runtime_Source.zip:web/app.js",
  source_app_js_sha256: sourceSha,
  profile_count: keys.length,
  slot_count: slots,
  provenance_counts: provenance,
  profiles,
};

const jsonText = canonicalJson(payload);
const jsText = wrapJs(
  "CDI_PINOUT_DB",
  payload,
  "CDI Genius pinoutDB extracted verbatim from runtime web/app.js. Labels preserved. No values invented."
);

fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, "cdi-pinout-db.json");
const jsPath = path.join(outDir, "cdi-pinout-db.js");
fs.writeFileSync(jsonPath, jsonText);
fs.writeFileSync(jsPath, jsText);

const manifest = {
  source: payload.source,
  source_app_js_sha256: sourceSha,
  expected_source_app_js_sha256: EXPECTED_SOURCE_SHA256,
  profile_count: keys.length,
  slot_count: slots,
  provenance_counts: provenance,
  profile_keys: keys,
  content_sha256: sha256Text(jsonText),
  files: {
    "cdi-pinout-db.json": sha256Bytes(fs.readFileSync(jsonPath)),
    "cdi-pinout-db.js": sha256Bytes(fs.readFileSync(jsPath)),
  },
  note:
    "Extracted verbatim from pinoutDB in the hashed runtime app.js. provenance and category labels are unchanged. source_key is the original pinoutDB key. No pin colors, voltages, or ohm values were invented.",
};
const manifestPath = path.join(outDir, "cdi-pinout-db.manifest.json");
fs.writeFileSync(manifestPath, canonicalJson(manifest));
manifest.files["cdi-pinout-db.manifest.json"] = sha256Bytes(fs.readFileSync(manifestPath));
// The manifest file hash cannot include itself in a stable way if we rewrite it.
// Keep file hashes for the two data files only (already written). Document the manifest separately.

console.log(
  JSON.stringify(
    {
      ok: true,
      sourcePath,
      source_app_js_sha256: sourceSha,
      profile_count: keys.length,
      slot_count: slots,
      provenance_counts: provenance,
      content_sha256: manifest.content_sha256,
      files: {
        "cdi-pinout-db.json": manifest.files["cdi-pinout-db.json"],
        "cdi-pinout-db.js": manifest.files["cdi-pinout-db.js"],
        "cdi-pinout-db.manifest.json": sha256Bytes(fs.readFileSync(manifestPath)),
      },
    },
    null,
    2
  )
);
