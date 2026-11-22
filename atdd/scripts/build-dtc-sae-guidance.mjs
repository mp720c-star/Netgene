#!/usr/bin/env node
/**
 * Build additive SAE J2012 / ISO 15031-6 generic DTC rows and a compact
 * cited-guidance overlay from obdex (CC0-1.0). Does not modify dtc-db.js.
 *
 *   node atdd/scripts/build-dtc-sae-guidance.mjs --source /path/to/generic.min.json
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const EXPECTED_BASELINE_SHA = "ed75aeb0a429ae920969bf65d324b2b006a252a4c15da42a1f2c75778070a923";
const EXPECTED_BASELINE_COUNT = 4783;
const OBDEX_CREDIT = {
  name: "obdex",
  url: "https://github.com/foerbsnavi/obdex",
  pages: "https://foerbsnavi.github.io/OBDex/generic.min.json",
  license: "CC0-1.0",
  license_url: "https://github.com/foerbsnavi/obdex/blob/main/LICENSE-DATA",
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const classicData = path.join(root, "classic/data");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : "";
}

function sha256Bytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function loadBaseline() {
  const file = path.join(classicData, "dtc-db.js");
  const buf = fs.readFileSync(file);
  const sha = sha256Bytes(buf);
  if (sha !== EXPECTED_BASELINE_SHA) {
    throw new Error("Refusing to build: dtc-db.js hash is " + sha + ", expected " + EXPECTED_BASELINE_SHA);
  }
  const ctx = { window: {} };
  vm.runInNewContext(buf.toString("utf8"), ctx);
  const rows = ctx.window.DTC_DB_DATA;
  if (!rows || rows.length !== EXPECTED_BASELINE_COUNT) {
    throw new Error("Unexpected baseline count " + (rows && rows.length));
  }
  return { sha, rows };
}

function titleOf(entry) {
  const t = entry.title;
  if (t && typeof t === "object") return String(t.en || t.de || "").trim();
  return String(t || "").trim();
}

function familyOf(code) {
  return { P: "Powertrain", B: "Body", C: "Chassis", U: "Network" }[code[0]] || "Powertrain";
}

function subsystemOf(code, title, category) {
  const t = (title + " " + (category || "") + " " + code).toLowerCase();
  if (/airbag|srs|squib|restraint|pretensioner|occupan|seat belt|ignition key warning/.test(t)) return "airbag_safety";
  if (/abs|wheel speed|ebcm|stability|traction control|brake pressure|brake fluid/.test(t) && code[0] === "C") return "abs_brakes";
  if (code[0] === "U" || /communication|can bus|network|module communication/.test(t)) return "network";
  if (/catalyst|evap|purge|vapor|egr|oxygen|o2 |nex|nox|aftertreatment|dpf|scr/.test(t)) return "emissions_evap";
  if (/misfire|ignition coil|spark|knock sensor|camshaft position|crankshaft position/.test(t)) return "ignition_misfire";
  if (/fuel|injector|maf|map|throttle|air flow|lambda|fuel trim|turbo|boost/.test(t)) return "air_fuel";
  if (/coolant|thermostat|fan |radiator|ect /.test(t)) return "cooling";
  if (/oil pressure|camshaft timing|vvt|phaser|timing /.test(t)) return "timing_oiling";
  if (/transmission|shift solenoid|tcc|turbine|gear ratio|prndl|range sensor/.test(t)) return "transmission";
  if (/battery|alternator|charging|generator|system voltage/.test(t)) return "charging_voltage";
  if (/axle|wheel bearing|steering|suspension|tire/.test(t)) return "driveline_chassis";
  if (code[0] === "B") return "body_electrical";
  if (code[0] === "C") return "driveline_chassis";
  return "powertrain_general";
}

function wrapJs(globalName, value, header) {
  return (
    "/* " +
    header +
    " */\n(function (root) {\n  root." +
    globalName +
    " = " +
    JSON.stringify(value) +
    ";\n})(typeof window !== \"undefined\" ? window : globalThis);\n"
  );
}

const sourcePath = argValue("--source") || process.env.OBDEX_GENERIC_JSON || "/tmp/obdex/generic.min.json";
if (!fs.existsSync(sourcePath)) {
  throw new Error("obdex generic.min.json not found. Pass --source");
}
const sourceBuf = fs.readFileSync(sourcePath);
const sourceSha = sha256Bytes(sourceBuf);
const obdex = JSON.parse(sourceBuf.toString("utf8"));
if (!Array.isArray(obdex) || obdex.length < 9000) {
  throw new Error("Unexpected obdex payload");
}

const baseline = loadBaseline();
const have = new Set(baseline.rows.map((r) => r.code));
const additions = [];
const addByPref = {};
for (const entry of obdex) {
  const code = entry.code;
  if (!code || have.has(code)) continue;
  const description = titleOf(entry);
  if (!description) throw new Error("Missing title for " + code);
  const row = {
    code,
    description,
    family: familyOf(code),
    subsystem: subsystemOf(code, description, entry.category),
    source: "obdex-cc0-1.0",
  };
  additions.push(row);
  const p = code.slice(0, 2);
  addByPref[p] = (addByPref[p] || 0) + 1;
}
additions.sort((a, b) => a.code.localeCompare(b.code));

const urls = [];
const urlIndex = new Map();
function internUrl(url) {
  if (!url) return null;
  if (urlIndex.has(url)) return urlIndex.get(url);
  const i = urls.length;
  urls.push(url);
  urlIndex.set(url, i);
  return i;
}
const components = [];
const compIndex = new Map();
function internComp(name) {
  if (!name) return null;
  if (compIndex.has(name)) return compIndex.get(name);
  const i = components.length;
  components.push(name);
  compIndex.set(name, i);
  return i;
}

const likelihoodMap = { high: "h", medium: "m", low: "l" };
const codes = {};
let citedCauseCount = 0;
for (const entry of obdex) {
  const causeList = [];
  for (const cause of entry.common_causes || []) {
    const id = String(cause.id || "cause");
    const li = likelihoodMap[String(cause.likelihood || "").toLowerCase()] || "";
    const label = (cause.label && (cause.label.en || cause.label.de)) || id.replace(/_/g, " ");
    causeList.push([id, li, label]);
    citedCauseCount++;
  }
  const u = [];
  for (const url of entry.sources || []) {
    const i = internUrl(url);
    if (i != null) u.push(i);
    if (u.length >= 2) break;
  }
  const p = [];
  for (const name of entry.affected_components || []) {
    const i = internComp(name);
    if (i != null) p.push(i);
    if (p.length >= 4) break;
  }
  codes[entry.code] = { c: causeList, u, p };
}

const overlay = {
  source: {
    ...OBDEX_CREDIT,
    file_sha256: sourceSha,
    retrieved: "2026-11-22",
    record_count: obdex.length,
  },
  urls,
  components,
  codes,
};

fs.mkdirSync(classicData, { recursive: true });
const additionsPath = path.join(classicData, "dtc-sae-generic-additions.js");
const overlayPath = path.join(classicData, "dtc-guidance-overlay.js");
const additionsJs = wrapJs(
  "DTC_SAE_GENERIC_ADDITIONS",
  additions,
  "Additive SAE J2012 / ISO 15031-6 generic DTCs not present in the 4,783-row dtc-db.js baseline. Titles from obdex (CC0-1.0). Existing baseline rows were not edited."
);
const overlayJs = wrapJs(
  "DTC_GUIDANCE_OVERLAY",
  overlay,
  "Compact cited cause lists and source URLs from obdex (CC0-1.0) for generic codes. Test procedures live in dtcGuidance.js and do not invent numeric specs."
);
fs.writeFileSync(additionsPath, additionsJs);
fs.writeFileSync(overlayPath, overlayJs);

const manifest = {
  baseline: {
    file: "dtc-db.js",
    sha256: baseline.sha,
    count: baseline.rows.length,
    note: "Unchanged. Do not edit or replace this file for this change.",
  },
  additions: {
    file: "dtc-sae-generic-additions.js",
    sha256: sha256Bytes(Buffer.from(additionsJs, "utf8")),
    count: additions.length,
    by_prefix: addByPref,
    source: OBDEX_CREDIT,
    source_file_sha256: sourceSha,
  },
  overlay: {
    file: "dtc-guidance-overlay.js",
    sha256: sha256Bytes(Buffer.from(overlayJs, "utf8")),
    codes_with_cited_causes: Object.keys(codes).length,
    cited_cause_rows: citedCauseCount,
    interned_urls: urls.length,
    interned_components: components.length,
  },
  union_count: baseline.rows.length + additions.length,
  licenses: [
    "obdex data: CC0-1.0 public domain dedication (https://github.com/foerbsnavi/obdex/blob/main/LICENSE-DATA).",
    "SAE J2012 / ISO 15031-6 text is copyrighted and is not reproduced here. This app uses publicly known code identifiers and independently written or CC0 titles and cause labels.",
    "Per-cause test procedures in dtcGuidance.js were written for this app. Numeric test limits come only from the vehicle service manual, stated as 'per service manual', not invented.",
    "Documents linked in the overlay are cited as found by obdex; this app does not copy those documents.",
  ],
  note: "Manufacturer-specific baseline codes (P1, B1, C1, U1, and others not in the generic set) keep their original descriptions and receive generated-general guidance, not invented OEM procedures.",
};
const manifestPath = path.join(classicData, "dtc-guidance.manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      baseline: baseline.rows.length,
      added: additions.length,
      by_prefix: addByPref,
      union: baseline.rows.length + additions.length,
      overlay_codes: Object.keys(codes).length,
      cited_cause_rows: citedCauseCount,
      bytes: {
        additions: additionsJs.length,
        overlay: overlayJs.length,
        manifest: fs.statSync(manifestPath).size,
      },
      source_sha256: sourceSha,
    },
    null,
    2
  )
);
