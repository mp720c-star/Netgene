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
const SOURCE_PROFILE_COUNT = 71;
const SOURCE_SLOT_COUNT = 448;
const SOURCE_PROVENANCE = { verified: 58, unverified: 9, reference: 4 };

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

function isSimulatedProfile(key, profile) {
  const category = (profile && profile.category) || "";
  const name = (profile && profile.name) || "";
  return (
    key === "SIM_DC_01" ||
    key === "SIM_AC_01" ||
    category === "Simulated Generic Profiles" ||
    /^SIMULATED:/i.test(name) ||
    /^SIM_/.test(key)
  );
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
if (keys.length !== SOURCE_PROFILE_COUNT) {
  throw new Error("Expected " + SOURCE_PROFILE_COUNT + " source profiles, found " + keys.length);
}

const profiles = {};
for (const key of keys) {
  const profile = raw[key];
  if (!profile || typeof profile !== "object") throw new Error("Bad profile " + key);
  // Copy original fields only, then add source_key (the original pinoutDB key).
  profiles[key] = { source_key: key, ...profile };
}

const slots = slotCount(profiles);
if (slots !== SOURCE_SLOT_COUNT) {
  throw new Error("Expected " + SOURCE_SLOT_COUNT + " source slots, found " + slots);
}
const provenance = provenanceCounts(profiles);
for (const label of Object.keys(SOURCE_PROVENANCE)) {
  if (provenance[label] !== SOURCE_PROVENANCE[label]) {
    throw new Error(
      "Source provenance " + label + " count " + provenance[label] + " != " + SOURCE_PROVENANCE[label]
    );
  }
}

const excluded = [];
for (const key of Object.keys(profiles)) {
  if (isSimulatedProfile(key, profiles[key])) {
    excluded.push({ key, name: profiles[key].name, category: profiles[key].category, source: profiles[key].source || "" });
    delete profiles[key];
  }
}
const shippedKeys = Object.keys(profiles);
const shippedSlots = slotCount(profiles);
const shippedProvenance = provenanceCounts(profiles);

const payload = {
  source: "CDI_Genius_Runtime_Source.zip:web/app.js",
  source_app_js_sha256: sourceSha,
  profile_count: shippedKeys.length,
  slot_count: shippedSlots,
  provenance_counts: shippedProvenance,
  profiles,
};

const jsonText = canonicalJson(payload);
const jsText = wrapJs(
  "CDI_PINOUT_DB",
  payload,
  "CDI Genius pinoutDB extracted from runtime web/app.js. Simulated generic profiles are not shipped. Labels preserved. No values invented."
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
  source_profile_count: keys.length,
  source_slot_count: slots,
  source_provenance_counts: provenance,
  profile_count: shippedKeys.length,
  slot_count: shippedSlots,
  provenance_counts: shippedProvenance,
  profile_keys: shippedKeys,
  excluded_from_ship: excluded,
  content_sha256: sha256Text(jsonText),
  files: {
    "cdi-pinout-db.json": sha256Bytes(fs.readFileSync(jsonPath)),
    "cdi-pinout-db.js": sha256Bytes(fs.readFileSync(jsPath)),
  },
  note:
    "Extracted from pinoutDB in the hashed runtime app.js. Simulated generic profiles (SIM_DC_01, SIM_AC_01) are present in the source extract but are not shipped in ATDD. GENERIC_DC and GENERIC_AC remain as labeled reference core profiles. Unverified and reference citations stay labeled. provenance and category labels are otherwise unchanged. source_key is the original pinoutDB key. No pin colors, voltages, or ohm values were invented. The three sample CDI demo models in cdi-genius are not packaged or shown in ATDD.",
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
      profile_count: shippedKeys.length,
      slot_count: shippedSlots,
      provenance_counts: shippedProvenance,
      excluded_from_ship: excluded.map((row) => row.key),
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
