import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const ios = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(process.argv[2] || path.join(ios, "www"));
const classic = path.resolve(ios, "../classic");
const entry = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(entry, /<title>Auto\/Truck Diagnostics for Dummies<\/title>/);
for (const label of ["Diagnose", "Listen", "Look", "Code"]) assert.ok(entry.includes(">" + label + "</button>"), label);
assert.ok(entry.includes('id="btnBluetoothTop"'));
assert.ok(entry.includes('src="./scanner/iphone-scanner.js"'));
for (const file of ["app.js", "icon.png", "styles.css", "diagnosticsEngine.js", "scanReadout.js", "vehicleCatalog.js", "sessionReset.js", "dtcGuidance.js", "symptomRepair.js", "data/dtc-db.js", "data/common-jobs.js", "data/howto-hub.js", "data/cdi-pinout-db.js", "data/cdi-pinout-db.json", "data/cdi-pinout-db.manifest.json", "data/vehicle-index.js", "data/vehicle-index.json", "data/dtc-sae-generic-additions.js", "data/dtc-guidance-overlay.js", "data/dtc-guidance.manifest.json", "data/symptom-repair-db.js", "data/symptom-repair.manifest.json"]) {
  const packed = fs.readFileSync(path.join(root, file));
  assert.ok(packed.equals(fs.readFileSync(path.join(classic, file))), "Changed original " + file);
}
assert.match(entry, /id="vehicleSearchCard"/);
assert.match(entry, /src="\.\/data\/cdi-pinout-db\.js"/);
assert.match(entry, /src="\.\/data\/vehicle-index\.js"/);
assert.match(entry, /src="\.\/vehicleCatalog\.js"/);
assert.match(entry, /src="\.\/sessionReset\.js"/);
assert.match(entry, /id="btnNewScanTop"/);
assert.match(entry, /class="tabbar"/);
assert.match(entry, /data-tab="scan"/);
assert.match(fs.readFileSync(path.join(root, "styles.css"), "utf8"), /-apple-system, system-ui/);
assert.match(entry, /id="newScanDialog"/);
assert.match(entry, /New scan \/ New vehicle/);
assert.match(entry, /src="\.\/data\/dtc-sae-generic-additions\.js"/);
assert.match(entry, /src="\.\/data\/dtc-guidance-overlay\.js"/);
assert.match(entry, /src="\.\/dtcGuidance\.js"/);
assert.match(entry, /src="\.\/data\/symptom-repair-db\.js"/);
assert.match(entry, /src="\.\/symptomRepair\.js"/);
assert.match(entry, /src="\.\/data\/howto-hub\.js"/);
assert.match(entry, /id="symptomRepairCard"/);
assert.match(entry, /id="howtoHubCard"/);
assert.match(entry, /id="btnGuidesTop"/);
assert.match(entry, /class="hub-topic-grid"/);
assert.match(entry, /id="codeStep"/);
const scanner = fs.readFileSync(path.join(root, "scanner/iphone-scanner.js"));
assert.ok(scanner.equals(fs.readFileSync(path.join(ios, "scanner/iphone-scanner.js"))));
const scannerText = scanner.toString("utf8");
for (const allowed of ["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"]) {
  assert.match(scannerText, new RegExp("\\b" + allowed + "\\b"), allowed);
}
assert.doesNotMatch(scannerText, /\bATMA\b|\bATPP\b|\bATS1\b|send\(["']04["']\)/);
assert.match(scannerText, /FIXD_COMPATIBILITY/);
assert.match(scannerText, /scanner\.send\("03"/);
assert.match(entry, /id="scanReadoutCard"/);
assert.match(entry, /id="scanReadout"/);

for (const file of ["capacitor-ble-transport.js", "fixd-protocol-probe.js", "obd-command-guard.js", "obd-protocol-v3-frame-aware.js", "web-bluetooth-transport.js"]) {
  assert.ok(fs.readFileSync(path.join(root, "tools/js", file)).equals(fs.readFileSync(path.join(ios, "../web/js", file))), file);
}
const data = fs.readFileSync(path.join(root, "data/dtc-db.js"));
const context = { window: {} };
runInNewContext(data.toString("utf8"), context);
assert.equal(context.window.DTC_DB_DATA.length, 4783);
assert.match(context.window.DTC_DB_DATA.find((row) => row.code === "P0300").description, /misfire/i);
assert.equal(createHash("sha256").update(data).digest("hex"), "ed75aeb0a429ae920969bf65d324b2b006a252a4c15da42a1f2c75778070a923");

const addCtx = { window: {} };
runInNewContext(fs.readFileSync(path.join(root, "data/dtc-sae-generic-additions.js"), "utf8"), addCtx);
const additions = addCtx.window.DTC_SAE_GENERIC_ADDITIONS;
assert.equal(additions.length, 7395);
const baselineCodes = new Set(context.window.DTC_DB_DATA.map((row) => row.code));
assert.ok(additions.every((row) => !baselineCodes.has(row.code)), "additions must not overwrite baseline codes");

const guideCtx = { window: { DTC_DB_DATA: context.window.DTC_DB_DATA, DTC_SAE_GENERIC_ADDITIONS: additions } };
runInNewContext(fs.readFileSync(path.join(root, "data/dtc-guidance-overlay.js"), "utf8"), guideCtx);
runInNewContext(fs.readFileSync(path.join(root, "dtcGuidance.js"), "utf8"), guideCtx);
const G = guideCtx.window.DtcGuidance;
assert.equal(G.allCodes().length, 4783 + 7395);
const sample = G.guidanceFor("P0420", context.window.DTC_DB_DATA.find((r) => r.code === "P0420"));
assert.equal(sample.tier, "detailed-existing");
assert.ok(sample.causes.length >= 1 && sample.causes.every((c) => c.tests.length && c.tests[0].spec === "per service manual"));

const symptomCtx = { window: {} };
runInNewContext(fs.readFileSync(path.join(root, "data/symptom-repair-db.js"), "utf8"), symptomCtx);
runInNewContext(fs.readFileSync(path.join(root, "symptomRepair.js"), "utf8"), { window: symptomCtx.window, globalThis: symptomCtx.window });
const SR = symptomCtx.window.SymptomRepair;
const symptomManifest = JSON.parse(fs.readFileSync(path.join(root, "data/symptom-repair.manifest.json"), "utf8"));
assert.equal(SR.allEntries().length, symptomManifest.entry_count);
assert.ok(SR.allEntries().length >= 200);
assert.ok(SR.allEntries().every((e) => e.causes.length && e.causes.every((c) => c.tests.length && c.tests[0].spec)));
assert.match(fs.readFileSync(path.join(root, "index.html"), "utf8"), /id="symptomRepairCard"/);

// The previous 3-model check required tools/data/cdi-models.json (SHA-256
// 7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee) to be
// packaged. Those three sample/demo CDI models are no longer shipped or shown
// in ATDD. The original files remain in cdi-genius/ and atdd/source-import/.
assert.equal(fs.existsSync(path.join(root, "tools/data/cdi-models.json")), false);
assert.doesNotMatch(entry, /id="btnBtDemo"/);
assert.doesNotMatch(entry, /Demo only/);

const pinoutCtx = { window: {} };
runInNewContext(fs.readFileSync(path.join(root, "data/cdi-pinout-db.js"), "utf8"), pinoutCtx);
const pinout = pinoutCtx.window.CDI_PINOUT_DB;
assert.equal(pinout.profile_count, 69);
assert.equal(Object.keys(pinout.profiles).length, 69);
assert.equal(pinout.slot_count, 436);
assert.equal(pinout.source_app_js_sha256, "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c");
assert.equal(JSON.stringify(pinout.provenance_counts), JSON.stringify({ reference: 2, unverified: 9, verified: 58 }));
assert.equal(pinout.profiles.SIM_DC_01, undefined);
assert.equal(pinout.profiles.GENERIC_DC.provenance, "reference");
assert.equal(pinout.profiles.SKI_DOO_REV_DC.provenance, "unverified");
assert.equal(pinout.profiles.HONDA_XR650L_DC.provenance, "verified");

const indexCtx = { window: {} };
runInNewContext(fs.readFileSync(path.join(root, "data/vehicle-index.js"), "utf8"), indexCtx);
const index = indexCtx.window.VEHICLE_INDEX_DATA;
assert.equal(index.counts.entries, 12432);
assert.equal(index.counts.cdi_profiles_represented, 69);
assert.equal(index.counts.by_type.simulated, undefined);
assert.equal(index.counts.near_match_pairs, 3578);
assert.equal(index.counts.by_type.car_truck, 12097);
assert.equal(index.counts.by_type.snowmobile, 4);
assert.doesNotMatch(JSON.stringify(index), /P0300/);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/cdi-pinout-db.manifest.json"), "utf8"));
assert.equal(manifest.source_app_js_sha256, "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c");
assert.equal(manifest.profile_count, 69);
assert.ok(Array.isArray(manifest.excluded_from_ship));

console.log("Original ATDD launch page, 4783 baseline DTCs plus 7395 SAE generic additions, symptom repair database, repair jobs, diagnostic engine and native scanner verified.");
console.log("Packaged DTC database SHA-256 " + createHash("sha256").update(data).digest("hex"));
console.log("Packaged CDI pinoutDB " + pinout.profile_count + " profiles, vehicle index " + index.counts.entries + " entries.");
