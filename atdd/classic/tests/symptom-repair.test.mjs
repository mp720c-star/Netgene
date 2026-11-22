import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(classic, "data/symptom-repair.manifest.json"), "utf8"));
const sha = createHash("sha256").update(fs.readFileSync(path.join(classic, "data/symptom-repair-db.js"))).digest("hex");
assert.equal(sha, manifest.sha256);

const windowObj = {};
runInNewContext(fs.readFileSync(path.join(classic, "data/symptom-repair-db.js"), "utf8"), { window: windowObj, globalThis: windowObj });
runInNewContext(fs.readFileSync(path.join(classic, "symptomRepair.js"), "utf8"), { window: windowObj, globalThis: windowObj });

const S = windowObj.SymptomRepair;
const entries = S.allEntries();
assert.equal(entries.length, manifest.entry_count);
assert.ok(entries.length >= 200, "expected a substantial symptom database");

const allowedSpecsPrefix = [
  "per service manual",
  "2/32 inch",
  "NHTSA TireWise",
  "FTC Auto Repair Basics",
  "DOE-HDBK-1084-95"
];
const systems = new Set(Object.keys(S.SYSTEM_LABELS));
const seen = new Set();
const tiers = { cited: 0, "generated-general": 0 };
const missing = [];
for (const entry of entries) {
  if (seen.has(entry.id)) missing.push("dup " + entry.id);
  seen.add(entry.id);
  if (!systems.has(entry.system)) missing.push("system " + entry.id);
  if (!entry.title || !entry.symptom || !entry.means || !entry.tierLabel) missing.push("fields " + entry.id);
  if (!entry.sources || !entry.sources.length) missing.push("sources " + entry.id);
  if (!entry.causes || !entry.causes.length) missing.push("causes " + entry.id);
  if (entry.tier !== "cited" && entry.tier !== "generated-general") missing.push("tier " + entry.id);
  tiers[entry.tier] = (tiers[entry.tier] || 0) + 1;
  if (entry.tier === "cited" && !entry.sources.some((s) => s.id && s.id !== "this_app" && s.id !== "service_manual")) {
    missing.push("cited-without-source " + entry.id);
  }
  for (const cause of entry.causes) {
    if (!cause.title || !cause.tests || !cause.tests.length || !cause.fix || !cause.fix.length) missing.push("cause " + entry.id);
    for (const test of cause.tests) {
      if (!test.tool || !test.check || !test.good || !test.bad || !test.spec) missing.push("test " + entry.id);
      if (!allowedSpecsPrefix.some((p) => String(test.spec).startsWith(p) || String(test.spec).includes(p))) {
        missing.push("spec " + entry.id + " :: " + test.spec);
      }
    }
  }
}
assert.deepEqual(missing, []);
assert.equal(tiers.cited, manifest.by_tier.cited);
assert.equal(tiers["generated-general"], manifest.by_tier["generated-general"]);
for (const id of Object.keys(S.SYSTEM_LABELS)) {
  assert.ok((manifest.by_system[id] || 0) >= 1, "missing system " + id);
}

const crank = S.search("won't crank click");
assert.ok(crank.some((e) => e.id === "eng-no-crank-single-click"));
const mil = S.byId("exh-mil-steady");
assert.equal(mil.tier, "cited");
assert.ok(mil.sources.some((s) => /EPA/i.test(s.name)));
const blink = S.byDtc("P0300");
assert.ok(blink.some((e) => e.id === "mis-flashing-mil" || e.id === "mis-random"));
const cdi = S.search("no spark CDI", { audience: "powersports" });
assert.ok(cdi.some((e) => e.cdi_workflow));
const bounce = mil; // just to keep a handle
const shock = S.byId("sus-weak-shocks");
assert.ok(shock.causes.some((c) => c.tests.some((t) => /more than one rebound/i.test(t.spec) || /more than one rebound/i.test(t.check) || /more than one rebound/i.test(t.bad))));
const tread = S.byId("sus-uneven-tire-wear");
assert.ok(tread.causes.some((c) => c.tests.some((t) => t.spec.startsWith("2/32 inch"))));

console.log("symptom-repair tests passed", { total: entries.length, tiers, systems: Object.keys(manifest.by_system).length });
