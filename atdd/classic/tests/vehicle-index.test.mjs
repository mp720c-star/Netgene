import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atdd = path.resolve(classic, "..");
const repoRoot = path.resolve(atdd, "..");

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function loadWindow(filePath) {
  const ctx = { window: {} };
  runInNewContext(fs.readFileSync(filePath, "utf8"), ctx);
  return ctx.window;
}

const EXPECTED_DTC = "ed75aeb0a429ae920969bf65d324b2b006a252a4c15da42a1f2c75778070a923";
const EXPECTED_JOBS = "24213f866429b4c2b0498a3e7bdeb20a623644b28a9ddb99b5348249d8cac03b";
const EXPECTED_SAMPLE = "7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee";
const EXPECTED_SOURCE = "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c";

assert.equal(sha256File(path.join(classic, "data/dtc-db.js")), EXPECTED_DTC);
assert.equal(sha256File(path.join(classic, "data/common-jobs.js")), EXPECTED_JOBS);
assert.equal(sha256File(path.join(repoRoot, "cdi-genius/src/data/sample-models.json")), EXPECTED_SAMPLE);
assert.equal(sha256File(path.join(atdd, "source-import/cdi-genius/src/data/sample-models.json")), EXPECTED_SAMPLE);

const pinoutWin = loadWindow(path.join(classic, "data/cdi-pinout-db.js"));
const pinout = pinoutWin.CDI_PINOUT_DB;
assert.equal(pinout.source_app_js_sha256, EXPECTED_SOURCE);
assert.equal(pinout.profile_count, 69);
assert.equal(Object.keys(pinout.profiles).length, 69);
assert.equal(pinout.slot_count, 436);
assert.equal(JSON.stringify(pinout.provenance_counts), JSON.stringify({ reference: 2, unverified: 9, verified: 58 }));
assert.equal(pinout.profiles.SKI_DOO_REV_DC.provenance, "unverified");
assert.equal(pinout.profiles.SKI_DOO_REV_DC.category, "Snowmobiles / Sleds");
assert.equal(pinout.profiles.HONDA_XR650L_DC.provenance, "verified");
assert.equal(pinout.profiles.CHINESE_GY6_DC.provenance, "unverified");
assert.equal(pinout.profiles.SIM_DC_01, undefined);
assert.equal(pinout.profiles.SIM_AC_01, undefined);
assert.equal(pinout.profiles.GENERIC_DC.provenance, "reference");
assert.ok(pinout.profiles.HONDA_XR650L_DC.source_key === "HONDA_XR650L_DC");

const manifest = JSON.parse(fs.readFileSync(path.join(classic, "data/cdi-pinout-db.manifest.json"), "utf8"));
assert.equal(manifest.source_app_js_sha256, EXPECTED_SOURCE);
assert.equal(manifest.profile_count, 69);
assert.equal(manifest.files["cdi-pinout-db.json"], sha256File(path.join(classic, "data/cdi-pinout-db.json")));
assert.equal(manifest.files["cdi-pinout-db.js"], sha256File(path.join(classic, "data/cdi-pinout-db.js")));

const indexWin = loadWindow(path.join(classic, "data/vehicle-index.js"));
const catalogWin = { window: { VEHICLE_INDEX_DATA: indexWin.VEHICLE_INDEX_DATA, CDI_PINOUT_DB: pinout } };
runInNewContext(fs.readFileSync(path.join(classic, "vehicleCatalog.js"), "utf8"), catalogWin);
const Catalog = catalogWin.window.VehicleCatalog;
const counts = Catalog.data().counts;

assert.equal(counts.source_rows, 12600);
assert.equal(counts.entries, 12432);
assert.equal(counts.exact_merges, 168);
assert.equal(counts.near_match_pairs, 3578);
assert.equal(counts.cdi_profiles_represented, 69);
assert.equal(counts.catalog_sources, 361);
const sourceKinds = new Set();
for (const entry of Catalog.data().entries) {
  for (const s of entry.sources || []) sourceKinds.add(s.kind);
}
assert.deepEqual([...sourceKinds].sort(), ["catalog", "cdi", "vehicle_genius"]);
assert.equal(counts.vehicle_genius_sources, 12170);
assert.equal(counts.by_type.car_truck, 12097);
assert.equal(counts.by_type.dirt_bike, 168);
assert.equal(counts.by_type.atv, 150);
assert.equal(counts.by_type.atc, 9);
assert.equal(counts.by_type.snowmobile, 4);
assert.equal(counts.by_type.motorcycle, 2);
assert.equal(counts.by_type.generic_reference, 2);
assert.equal(counts.by_type.simulated, undefined);
assert.equal(counts.by_workflow.generic_automotive, 12097);
assert.equal(counts.by_workflow.cdi_pinout, 69);
assert.equal(counts.by_workflow.index_only, 266);

const trucks = Catalog.search({ type: "car_truck", make: "Ford", query: "F-150" });
assert.ok(trucks.length > 0);
assert.ok(trucks.every((e) => e.workflow === "generic_automotive" && !e.has_cdi_pinout));
assert.equal(Catalog.pinoutsFor(trucks[0]).length, 0);

const modernMakes = ["Acura", "Genesis", "Infiniti", "Volvo", "Porsche", "Mitsubishi", "MINI", "Rivian"];
for (const make of modernMakes) {
  const hits = Catalog.search({ type: "car_truck", make });
  assert.ok(hits.length > 0, "expected car/truck rows for " + make);
  assert.ok(hits.some((e) => e.year_start >= 2012), make + " should include last-15-year coverage");
}

const sleds = Catalog.search({ type: "snowmobile", query: "Ski-Doo" });
assert.equal(sleds.length, 1);
assert.equal(sleds[0].has_cdi_pinout, true);
const ski = Catalog.pinoutsFor(sleds[0]);
assert.equal(ski.length, 1);
assert.equal(ski[0].provenance, "unverified");
assert.equal(Catalog.badge(ski[0]).label, "UNVERIFIED");
assert.equal(Catalog.obdCodesForPinout(ski[0]).length, 0);
assert.equal(Catalog.pinoutsForObdCode("P0300").length, 0);

const xr = Catalog.search({ query: "XR650L" });
const cdiXr = xr.filter((e) => e.has_cdi_pinout);
const ymmXr = xr.filter((e) => !e.has_cdi_pinout);
assert.ok(cdiXr.length === 1);
assert.ok(ymmXr.length >= 1);
assert.ok(cdiXr[0].near_matches.some((n) => /not merged with year-specific catalog rows/i.test(n.reason)));

const klr = Catalog.search({ query: "KLR650" }).filter((e) => e.has_cdi_pinout);
assert.equal(klr.length, 2);
assert.ok(klr.some((e) => e.cdi_system === "AC" && e.provenance === "unverified"));
assert.ok(klr.some((e) => e.cdi_system === "DC" && e.provenance === "verified"));
assert.ok(klr[0].near_matches.some((n) => /more than one CDI profile/i.test(n.reason)));

const bmwNear = Catalog.data().near_matches.filter((p) => /3 Series/i.test(p.a_label + p.b_label) && /5 Series/i.test(p.a_label + p.b_label));
assert.equal(bmwNear.length, 0);

// A DTC code string must not appear as a vehicle or pinout identifier.
assert.equal(Catalog.search({ query: "P0300" }).length, 0);
assert.doesNotMatch(JSON.stringify(Catalog.pinoutsFor(cdiXr[0])), /"P[0-9]{4}"/);

console.log("vehicle-index tests passed", counts);
