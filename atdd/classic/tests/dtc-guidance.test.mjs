import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function loadWindow(filePath, window) {
  runInNewContext(fs.readFileSync(filePath, "utf8"), { window, globalThis: window });
  return window;
}

const EXPECTED_DTC = "ed75aeb0a429ae920969bf65d324b2b006a252a4c15da42a1f2c75778070a923";
assert.equal(sha256File(path.join(classic, "data/dtc-db.js")), EXPECTED_DTC);

const windowObj = {};
loadWindow(path.join(classic, "data/dtc-db.js"), windowObj);
loadWindow(path.join(classic, "data/dtc-sae-generic-additions.js"), windowObj);
loadWindow(path.join(classic, "data/dtc-guidance-overlay.js"), windowObj);
loadWindow(path.join(classic, "dtcGuidance.js"), windowObj);

const baseline = windowObj.DTC_DB_DATA;
const additions = windowObj.DTC_SAE_GENERIC_ADDITIONS;
const G = windowObj.DtcGuidance;

assert.equal(baseline.length, 4783);
assert.equal(additions.length, 7395);
const baselineCodes = new Set(baseline.map((r) => r.code));
assert.ok(additions.every((row) => !baselineCodes.has(row.code)));
assert.ok(additions.every((row) => row.description && row.family && row.subsystem && row.source === "obdex-cc0-1.0"));

const byPref = {};
for (const row of additions) {
  const p = row.code.slice(0, 2);
  byPref[p] = (byPref[p] || 0) + 1;
}
assert.deepEqual(byPref, { B0: 323, C0: 624, P0: 2267, P2: 2900, P3: 56, U0: 1051, U3: 174 });

const all = G.allCodes();
assert.equal(all.length, 4783 + 7395);

const tiers = { "detailed-existing": 0, "detailed-cited": 0, "generated-general": 0 };
let missing = 0;
let missingTests = 0;
let badSpec = 0;
for (const rec of all) {
  const g = G.guidanceFor(rec.code, rec);
  if (!g.tier || !g.tierLabel || !Array.isArray(g.sources) || !g.sources.length || !g.causes.length) missing++;
  tiers[g.tier] = (tiers[g.tier] || 0) + 1;
  for (const cause of g.causes) {
    if (!cause.title || !cause.tests || !cause.tests.length) missingTests++;
    for (const test of cause.tests) {
      if (!test.tool || !test.check || !test.good || !test.bad || !test.spec) missingTests++;
      if (test.spec !== "per service manual") badSpec++;
    }
  }
}
assert.equal(missing, 0);
assert.equal(missingTests, 0);
assert.equal(badSpec, 0);
assert.equal(tiers["detailed-existing"], 147);
assert.equal(tiers["detailed-cited"], 9385);
assert.equal(tiers["generated-general"], 2646); // 2645 manufacturer-specific baseline + P0FFF undocumented generic

const p0420 = G.guidanceFor("P0420", baseline.find((r) => r.code === "P0420"));
assert.equal(p0420.tier, "detailed-existing");
assert.match(p0420.tierLabel, /Detailed guide/);
assert.ok(p0420.causes.length >= 1);

const b0001 = G.guidanceFor("B0001", additions.find((r) => r.code === "B0001"));
assert.equal(b0001.tier, "detailed-cited");
assert.match(b0001.tierLabel, /obdex/);
assert.ok(b0001.safety.some((s) => /airbag|SRS/i.test(s)));
assert.ok(b0001.sources.some((s) => s.license === "CC0-1.0"));

const b1200 = G.guidanceFor("B1200", baseline.find((r) => r.code === "B1200"));
assert.equal(b1200.tier, "generated-general");
assert.equal(b1200.tierLabel, G.GENERAL_LABEL);

const manifest = JSON.parse(fs.readFileSync(path.join(classic, "data/dtc-guidance.manifest.json"), "utf8"));
assert.equal(manifest.baseline.sha256, EXPECTED_DTC);
assert.equal(manifest.additions.count, 7395);
assert.equal(manifest.additions.source.license, "CC0-1.0");

const unknown = G.guidanceFor("Z9999");
assert.equal(unknown.unknown, true);
assert.equal(unknown.tier, "unknown");
assert.equal(unknown.description, "Unknown code – not in database");
assert.equal(unknown.causes.length, 0);
assert.equal((unknown.sources || []).length, 0);

console.log("dtc-guidance tests passed", { union: all.length, tiers, added: additions.length });
