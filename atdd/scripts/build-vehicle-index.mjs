#!/usr/bin/env node
/**
 * Build a shared vehicle index from:
 *   - extracted CDI pinoutDB profiles
 *   - vehicle catalog YMM strings (from the repo's lookup data folder)
 *   - Vehicle Genius YMM strings
 *
 * Exact type+make+model+year matches share one row with sources[].
 * Near-matches are flagged and never silently merged.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..");
const outDir = path.join(root, "classic/data");

const CATEGORY_TO_TYPE = {
  "Dirt Bikes / Dual-Sport": "dirt_bike",
  "ATVs / 4-Wheelers": "atv",
  "3-Wheelers / ATCs": "atc",
  "Snowmobiles / Sleds": "snowmobile",
  "Motorcycles / Bikes": "motorcycle",
  "Core / Generic Reference": "generic_reference",
  "Simulated Generic Profiles": "simulated",
  "Car/Truck": "car_truck",
  "Dirt Bike/Moto": "dirt_bike",
  "ATV/4-Wheeler": "atv",
};

const MAKES = [
  "Mercedes-Benz",
  "Harley-Davidson",
  "Ski-Doo",
  "Can-Am",
  "Gas Gas",
  "Arctic Cat",
  "Volkswagen",
  "Chevrolet",
  "Husqvarna",
  "Husaberg",
  "Kawasaki",
  "Polaris",
  "Yamaha",
  "Suzuki",
  "Honda",
  "Nissan",
  "Toyota",
  "Subaru",
  "Hyundai",
  "Mazda",
  "Dodge",
  "Jeep",
  "Audi",
  "BMW",
  "GMC",
  "Kia",
  "Ford",
  "KTM",
  "TM",
  "Loncin",
  "Chinese",
];

const NAME_PREFIX = /^(BIKE|ATV|SLED|3-WHEELER|CORE|SIMULATED):\s*/i;

function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadWindowScript(filePath, key) {
  const ctx = { window: {}, globalThis: {} };
  ctx.globalThis = ctx.window;
  vm.runInNewContext(fs.readFileSync(filePath, "utf8"), ctx);
  return ctx.window[key] || ctx[key];
}

function canonicalType(raw) {
  if (CATEGORY_TO_TYPE[raw]) return CATEGORY_TO_TYPE[raw];
  return raw;
}

function workflowFor(type, hasCdi) {
  if (hasCdi) return "cdi_pinout";
  if (type === "car_truck") return "generic_automotive";
  return "index_only";
}

function normalizeMake(make) {
  return String(make || "")
    .trim()
    .toLowerCase()
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ");
}

const GENERIC_MODEL_WORDS = new Set([
  "series", "class", "bike", "atv", "sled", "standard", "sport", "touring",
  "sealed", "engine", "starter", "limited", "fourtrax", "trax", "the", "and",
  "with", "from",
]);

function stripYearTokens(text) {
  return String(text || "")
    .replace(/\bfrom\s+((?:19|20)\d{2})\b/ig, " ")
    .replace(/\b((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2}|\d{2})\b/g, " ")
    .replace(/\b((?:19|20)\d{2})\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeModel(model) {
  return stripYearTokens(String(model || ""))
    .trim()
    .toLowerCase()
    .replace(/[/_]/g, " ")
    .replace(/[^a-z0-9+\s-]/g, " ")
    .replace(/-+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseYearSuffix(label) {
  const m = String(label).trim().match(/^(.*)\s+((?:19|20)\d{2})$/);
  if (!m) return { model: String(label).trim(), year: null, year_start: null, year_end: null, year_text: "" };
  const year = Number(m[2]);
  return { model: m[1].trim(), year, year_start: year, year_end: year, year_text: String(year) };
}

function expandYearToken(startText, endText) {
  const start = Number(startText);
  let end = Number(endText);
  if (endText.length === 2) {
    const century = Math.floor(start / 100) * 100;
    end = century + Number(endText);
    if (end < start) end += 100;
  }
  return { start, end };
}

function extractYears(text) {
  const ranges = [];
  const seen = new Set();
  const add = (start, end, raw) => {
    const key = start + "-" + end + ":" + raw;
    if (seen.has(key)) return;
    seen.add(key);
    ranges.push({ start, end, text: raw });
  };
  const src = String(text || "");
  const from = src.match(/\bfrom\s+((?:19|20)\d{2})\b/i);
  if (from) add(Number(from[1]), null, from[0]);
  const reFull = /((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2}|\d{2})\b/g;
  let m;
  while ((m = reFull.exec(src))) {
    const { start, end } = expandYearToken(m[1], m[2]);
    add(start, end, m[0]);
  }
  const reSingle = /\b((?:19|20)\d{2})\b/g;
  while ((m = reSingle.exec(src))) {
    const prefix = src.slice(Math.max(0, m.index - 5), m.index).toLowerCase();
    if (/pre[-\s]*$/.test(prefix)) continue; // "Pre-2008" is not the year 2008
    const year = Number(m[1]);
    const already = ranges.some((r) => year >= r.start && (r.end == null || year <= r.end) && r.text.includes(m[1]));
    if (!already) add(year, year, m[1]);
  }
  return ranges;
}

function yearBounds(ranges) {
  if (!ranges.length) return { year: null, year_start: null, year_end: null, year_text: "" };
  const starts = ranges.map((r) => r.start);
  const ends = ranges.map((r) => (r.end == null ? r.start : r.end));
  const open = ranges.some((r) => r.end == null && r.text.toLowerCase().includes("from"));
  return {
    year: starts.length === 1 && ranges[0].start === ranges[0].end ? ranges[0].start : null,
    year_start: Math.min(...starts),
    year_end: open ? null : Math.max(...ends),
    year_text: ranges.map((r) => r.text).join(" / "),
  };
}

function detectMake(text) {
  const src = String(text || "");
  for (const make of MAKES) {
    const re = new RegExp("(?:^|\\b)" + make.replace(/[-/]/g, "[-\\/]?") + "\\b", "i");
    if (re.test(src)) return make;
  }
  return "";
}

function parseCdiName(profile) {
  const rawName = String(profile.name || "");
  const withoutPrefix = rawName.replace(NAME_PREFIX, "").trim();
  const make = detectMake(withoutPrefix) || detectMake(profile.source_key) || "";
  let rest = withoutPrefix;
  if (make) {
    const re = new RegExp("^" + make.replace(/[-/]/g, "[-\\/]?") + "\\s+", "i");
    rest = rest.replace(re, "");
  }
  // Drop trailing system notes in parentheses for the model display, but keep original name.
  let model = rest
    .replace(/\s*\((?:DC|AC|AC-CDI|DC-CDI)[^)]*\)\s*$/i, "")
    .replace(/\s*,\s*(?:DC|AC)\s*$/i, "")
    .trim();
  const years = extractYears(rawName + " " + (profile.source_key || ""));
  const bounds = yearBounds(years);
  const stripped = stripYearTokens(model);
  if (stripped) model = stripped;
  return { make, model: model || withoutPrefix || profile.source_key, ...bounds, display_name: rawName };
}

function entryId(type, make, model, year, year_text) {
  const key = [type, normalizeMake(make), normalizeModel(model), year ?? year_text ?? "none"].join("|");
  return "veh:" + sha256Text(key).slice(0, 16);
}

function sourceRecord(kind, id, label) {
  return { kind, id, label };
}

function modelCores(model) {
  const norm = normalizeModel(model);
  const tokens = norm.split(" ").filter(Boolean);
  const cores = new Set();
  if (norm) cores.add(norm);
  for (const tok of tokens) {
    if (GENERIC_MODEL_WORDS.has(tok)) continue;
    if (/^(?:19|20)\d{2}$/.test(tok)) continue;
    if (tok.length >= 3) cores.add(tok);
    const compact = tok.replace(/-/g, "");
    const code = compact.match(/[a-z]{2,}\d{2,}[a-z]*|\d{2,}[a-z]{2,}/i);
    if (code) cores.add(code[0]);
  }
  return [...cores];
}

function compatibleTypes(a, b) {
  if (a === b) return true;
  const powersports = new Set(["dirt_bike", "motorcycle", "atv", "atc", "snowmobile"]);
  if (powersports.has(a) && powersports.has(b)) {
    // Only treat dirt_bike <-> motorcycle as compatible (the vehicle catalog lumps them).
    return (a === "dirt_bike" && b === "motorcycle") || (a === "motorcycle" && b === "dirt_bike");
  }
  return false;
}

function similarModels(a, b) {
  const na = normalizeModel(a);
  const nb = normalizeModel(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const aTokens = na.split(" ").filter((t) => t && !GENERIC_MODEL_WORDS.has(t));
  const bTokens = nb.split(" ").filter((t) => t && !GENERIC_MODEL_WORDS.has(t));
  const aJoin = aTokens.join(" ");
  const bJoin = bTokens.join(" ");
  if (aJoin.length >= 4 && bJoin.length >= 4 && (aJoin.includes(bJoin) || bJoin.includes(aJoin))) return true;
  const distinctive = (x) => /[a-z].*\d|\d.*[a-z]/.test(x) || (x.length >= 5 && !GENERIC_MODEL_WORDS.has(x));
  const aCores = modelCores(a).filter(distinctive);
  const bCores = new Set(modelCores(b).filter(distinctive));
  // A shared family name plus a different displacement number is a near-match.
  const aNames = aTokens.filter((t) => /^[a-z]{4,}$/.test(t) && !GENERIC_MODEL_WORDS.has(t));
  const bNames = new Set(bTokens.filter((t) => /^[a-z]{4,}$/.test(t) && !GENERIC_MODEL_WORDS.has(t)));
  const sharedName = aNames.some((t) => bNames.has(t));
  const aCode = aTokens.find((t) => /[a-z].*\d|\d/.test(t));
  const bCode = bTokens.find((t) => /[a-z].*\d|\d/.test(t));
  if (sharedName && aCode && bCode && aCode !== bCode) return true;
  for (const core of aCores) {
    if (bCores.has(core)) return true;
  }
  return false;
}

const pinout = loadJson(path.join(outDir, "cdi-pinout-db.json"));
function findCatalogVehiclesModule() {
  const matches = fs.readdirSync(repoRoot).filter((name) => {
    return fs.existsSync(path.join(repoRoot, name, "vehicles-data.js"));
  });
  if (matches.length !== 1) {
    throw new Error("Expected exactly one repo-root folder containing vehicles-data.js, found: " + matches.join(", "));
  }
  return path.join(repoRoot, matches[0], "vehicles-data.js");
}
const catalogVehicles = (await import(findCatalogVehiclesModule())).vehicles;
const vgVehicles = loadWindowScript(path.join(repoRoot, "vehicle-genius/vehicles.js"), "VG_VEHICLES");

const rows = [];

for (const [key, profile] of Object.entries(pinout.profiles)) {
  const type = canonicalType(profile.category);
  const parsed = parseCdiName(profile);
  rows.push({
    type,
    make: parsed.make,
    model: parsed.model,
    year: parsed.year,
    year_start: parsed.year_start,
    year_end: parsed.year_end,
    year_text: parsed.year_text,
    display_name: parsed.display_name,
    cdi_system: profile.system || "",
    provenance: profile.provenance,
    category: profile.category,
    source: sourceRecord("cdi", "cdi:profile:" + key, parsed.display_name),
  });
}

function addYmm(db, kind) {
  for (const rawType of Object.keys(db)) {
    const type = canonicalType(rawType);
    for (const make of Object.keys(db[rawType])) {
      for (const label of db[rawType][make]) {
        const parsed = parseYearSuffix(label);
        rows.push({
          type,
          make,
          model: parsed.model,
          year: parsed.year,
          year_start: parsed.year_start,
          year_end: parsed.year_end,
          year_text: parsed.year_text,
          display_name: [make, label].join(" "),
          cdi_system: "",
          provenance: "",
          category: rawType,
          source: sourceRecord(kind, kind + ":" + rawType + "|" + make + "|" + label, make + " " + label),
        });
      }
    }
  }
}

addYmm(catalogVehicles, "catalog");
addYmm(vgVehicles, "vehicle_genius");

const groups = new Map();
for (const row of rows) {
  let key;
  if (row.source.kind === "cdi") {
    // Each CDI profile stays its own row; never merge two pinout profiles.
    key = "cdi:" + row.source.id;
  } else {
    key = ["ymm", row.type, normalizeMake(row.make), normalizeModel(row.model), row.year ?? "none"].join("|");
  }
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

// Attach a CDI profile onto an exact YMM row only when type, make, model, and year all match.
const ymmKeys = [...groups.keys()].filter((k) => k.startsWith("ymm|"));
for (const key of [...groups.keys()].filter((k) => k.startsWith("cdi:"))) {
  const group = groups.get(key);
  const row = group[0];
  if (row.year == null) continue;
  const ymmKey = ["ymm", row.type, normalizeMake(row.make), normalizeModel(row.model), row.year].join("|");
  if (groups.has(ymmKey)) {
    groups.get(ymmKey).push(...group);
    groups.delete(key);
  }
}

const entries = [];
for (const [key, group] of groups) {
  const first = group[0];
  const sources = [];
  const seen = new Set();
  for (const row of group) {
    if (seen.has(row.source.id)) continue;
    seen.add(row.source.id);
    sources.push(row.source);
  }
  const hasCdi = sources.some((s) => s.kind === "cdi");
  const provenance = group.find((r) => r.provenance)?.provenance || "";
  const year_start = group.reduce((min, r) => {
    if (r.year_start == null) return min;
    return min == null ? r.year_start : Math.min(min, r.year_start);
  }, null);
  const year_end = group.reduce((max, r) => {
    if (r.year_end == null && r.year_start == null) return max;
    if (r.year_end == null) return max;
    return max == null ? r.year_end : Math.max(max, r.year_end);
  }, null);
  const year_text = [...new Set(group.map((r) => r.year_text).filter(Boolean))].join(" / ");
  const entry = {
    id: entryId(first.type, first.make, first.model, first.year, year_text),
    type: first.type,
    make: first.make,
    model: first.model,
    year: first.year,
    year_start,
    year_end,
    year_text,
    display_name: first.display_name,
    cdi_system: group.find((r) => r.cdi_system)?.cdi_system || "",
    provenance,
    category: first.category,
    workflow: workflowFor(first.type, hasCdi),
    has_cdi_pinout: hasCdi,
    sources,
    near_matches: [],
  };
  entries.push(entry);
}

entries.sort((a, b) => {
  return (
    a.type.localeCompare(b.type) ||
    a.make.localeCompare(b.make) ||
    a.model.localeCompare(b.model) ||
    String(a.year_start || "").localeCompare(String(b.year_start || "")) ||
    a.id.localeCompare(b.id)
  );
});

function familyKey(entry) {
  return [entry.type, normalizeMake(entry.make), normalizeModel(entry.model)].join("|");
}

function yearRangesOverlap(a, b) {
  if (a.year_start == null && a.year_end == null && !a.year_text) return true;
  if (b.year_start == null && b.year_end == null && !b.year_text) return true;
  const a0 = a.year_start ?? a.year;
  const b0 = b.year_start ?? b.year;
  const a1 = a.year_end ?? a.year_start ?? a.year;
  const b1 = b.year_end ?? b.year_start ?? b.year;
  if (a0 == null || b0 == null) return true;
  const aHi = a1 == null ? Infinity : a1;
  const bHi = b1 == null ? Infinity : b1;
  return a0 <= bHi && b0 <= aHi;
}

const families = new Map();
for (const entry of entries) {
  const key = familyKey(entry);
  if (!families.has(key)) families.set(key, []);
  families.get(key).push(entry);
}

const familyList = [...families.entries()].map(([key, members]) => {
  const first = members[0];
  const years = members.map((m) => m.year_text || m.year || "").filter(Boolean);
  return {
    key,
    type: first.type,
    make: first.make,
    model: first.model,
    members,
    representative: members[0],
    label: [first.make, first.model, years.length ? years[0] + (years.length > 1 ? " (+" + (years.length - 1) + " more)" : "") : ""].filter(Boolean).join(" "),
  };
});

const nearMatches = [];

for (const family of familyList) {
  if (family.members.length < 2) continue;
  const cdiMembers = family.members.filter((m) => m.has_cdi_pinout);
  // Multiple CDI profiles that normalized to the same make/model (e.g. KLR650 AC vs DC).
  if (cdiMembers.length >= 2) {
    for (let i = 0; i < cdiMembers.length; i++) {
      for (let j = i + 1; j < cdiMembers.length; j++) {
        const a = cdiMembers[i];
        const b = cdiMembers[j];
        const reason = "same make/model has more than one CDI profile or year range";
        const pair = {
          a_id: a.id,
          b_id: b.id,
          a_label: [a.make, a.model, a.year_text || a.year || a.cdi_system, a.display_name].filter(Boolean).slice(0, 3).join(" "),
          b_label: [b.make, b.model, b.year_text || b.year || b.cdi_system, b.display_name].filter(Boolean).slice(0, 3).join(" "),
          a_model: a.model,
          b_model: b.model,
          reason,
        };
        nearMatches.push(pair);
        a.near_matches.push({ id: b.id, label: pair.b_label, reason });
        b.near_matches.push({ id: a.id, label: pair.a_label, reason });
      }
    }
  }
  // Yearless CDI profile not merged with year-specific catalog rows of the same model.
  const ymmMembers = family.members.filter((m) => !m.has_cdi_pinout);
  for (const cdi of cdiMembers) {
    if (ymmMembers.length && (cdi.year == null && !cdi.year_text)) {
      const reason = "CDI profile has no year in the source, so it was not merged with year-specific catalog rows";
      const rep = ymmMembers[0];
      const pair = {
        a_id: cdi.id,
        b_id: rep.id,
        a_label: cdi.display_name,
        b_label: [rep.make, rep.model, ymmMembers.length + " catalog year rows"].join(" "),
        a_model: cdi.model,
        b_model: rep.model,
        reason,
      };
      if (!nearMatches.some((p) => (p.a_id === pair.a_id && p.b_id === pair.b_id) || (p.a_id === pair.b_id && p.b_id === pair.a_id))) {
        nearMatches.push(pair);
        cdi.near_matches.push({ id: rep.id, label: pair.b_label, reason });
        for (const ymm of ymmMembers) ymm.near_matches.push({ id: cdi.id, label: pair.a_label, reason });
      }
    }
  }
}

for (let i = 0; i < familyList.length; i++) {
  for (let j = i + 1; j < familyList.length; j++) {
    const a = familyList[i];
    const b = familyList[j];
    if (normalizeMake(a.make) !== normalizeMake(b.make) || !a.make) continue;
    if (!compatibleTypes(a.type, b.type) && a.type !== b.type) continue;
    if (!similarModels(a.model, b.model)) continue;
    const sameModel = normalizeModel(a.model) === normalizeModel(b.model);
    if (sameModel && a.type === b.type) {
      // Same family, different year rows live in one familyKey already. If they
      // are split (e.g. two CDI profiles with different year_text or system), flag.
    }
    const overlap = a.members.some((am) => b.members.some((bm) => yearRangesOverlap(am, bm)));
    let reason;
    if (sameModel && a.members.some((m) => m.has_cdi_pinout) && b.members.some((m) => m.has_cdi_pinout)) {
      reason = "same make/model has more than one CDI profile or year range";
    } else if (sameModel && a.type !== b.type) {
      reason = "same make/model filed under different types";
    } else if (sameModel) {
      reason = "same make/model listed with different source coverage";
    } else {
      reason = "similar make/model names were not exact matches";
    }
    if (!sameModel && !overlap && a.members.every((m) => m.year != null) && b.members.every((m) => m.year != null)) {
      // Still flag as a model-family near-match, once, without requiring year overlap.
      reason = "similar make/model names were not exact matches";
    }
    const pair = {
      a_id: a.representative.id,
      b_id: b.representative.id,
      a_label: a.label,
      b_label: b.label,
      a_model: a.model,
      b_model: b.model,
      reason,
    };
    nearMatches.push(pair);
    for (const member of a.members) {
      member.near_matches.push({ id: b.representative.id, label: b.label, reason });
    }
    for (const member of b.members) {
      member.near_matches.push({ id: a.representative.id, label: a.label, reason });
    }
  }
}

function countBy(list, key) {
  const out = {};
  for (const item of list) {
    const value = item[key] || "unknown";
    out[value] = (out[value] || 0) + 1;
  }
  return out;
}

const counts = {
  source_rows: rows.length,
  entries: entries.length,
  exact_merges: rows.length - entries.length,
  near_match_pairs: nearMatches.length,
  entries_with_near_matches: entries.filter((e) => e.near_matches.length).length,
  by_type: countBy(entries, "type"),
  by_workflow: countBy(entries, "workflow"),
  cdi_profiles_represented: entries.filter((e) => e.has_cdi_pinout).length,
  catalog_sources: rows.filter((r) => r.source.kind === "catalog").length,
  vehicle_genius_sources: rows.filter((r) => r.source.kind === "vehicle_genius").length,
  cdi_sources: rows.filter((r) => r.source.kind === "cdi").length,
};

const payload = {
  source_pinout_sha256: pinout.source_app_js_sha256,
  counts,
  entries,
  near_matches: nearMatches,
};

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

const jsonText = JSON.stringify(payload, null, 2) + "\n";
fs.writeFileSync(path.join(outDir, "vehicle-index.json"), jsonText);
fs.writeFileSync(
  path.join(outDir, "vehicle-index.js"),
  wrapJs("VEHICLE_INDEX_DATA", payload, "Shared ATDD + CDI + vehicle catalog + Vehicle Genius vehicle index. Exact matches share sources[]. Near-matches are flagged, not merged.")
);

console.log(JSON.stringify({ ok: true, counts, files: {
  "vehicle-index.json": sha256Text(jsonText),
  "vehicle-index.js": sha256Text(fs.readFileSync(path.join(outDir, "vehicle-index.js"), "utf8")),
}}, null, 2));
