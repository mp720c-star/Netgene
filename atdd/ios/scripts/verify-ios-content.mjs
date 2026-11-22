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
for (const file of ["app.js", "icon.png", "styles.css", "diagnosticsEngine.js", "vehicleCatalog.js", "data/dtc-db.js", "data/common-jobs.js", "data/cdi-pinout-db.js", "data/cdi-pinout-db.json", "data/cdi-pinout-db.manifest.json", "data/vehicle-index.js", "data/vehicle-index.json"]) {
  const packed = fs.readFileSync(path.join(root, file));
  assert.ok(packed.equals(fs.readFileSync(path.join(classic, file))), "Changed original " + file);
}
assert.match(entry, /id="vehicleSearchCard"/);
assert.match(entry, /src="\.\/data\/cdi-pinout-db\.js"/);
assert.match(entry, /src="\.\/data\/vehicle-index\.js"/);
assert.match(entry, /src="\.\/vehicleCatalog\.js"/);
const scanner = fs.readFileSync(path.join(root, "scanner/iphone-scanner.js"));
assert.ok(scanner.equals(fs.readFileSync(path.join(ios, "scanner/iphone-scanner.js"))));
assert.doesNotMatch(scanner.toString("utf8"), /\bAT(?:Z|E0|L0|S1|H0|SP0)\b/);
assert.match(scanner.toString("utf8"), /FIXD_COMPATIBILITY/);
assert.match(scanner.toString("utf8"), /scanner\.send\("03"\)/);

for (const file of ["capacitor-ble-transport.js", "fixd-protocol-probe.js", "obd-command-guard.js", "obd-protocol-v3-frame-aware.js", "web-bluetooth-transport.js"]) {
  assert.ok(fs.readFileSync(path.join(root, "tools/js", file)).equals(fs.readFileSync(path.join(ios, "../web/js", file))), file);
}
const data = fs.readFileSync(path.join(root, "data/dtc-db.js"));
const context = { window: {} };
runInNewContext(data.toString("utf8"), context);
assert.equal(context.window.DTC_DB_DATA.length, 4783);
assert.match(context.window.DTC_DB_DATA.find((row) => row.code === "P0300").description, /misfire/i);

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
assert.equal(index.counts.entries, 438);
assert.equal(index.counts.cdi_profiles_represented, 69);
assert.equal(index.counts.by_type.simulated, undefined);
assert.equal(index.counts.near_match_pairs, 22);
assert.equal(index.counts.by_type.car_truck, 237);
assert.equal(index.counts.by_type.snowmobile, 4);
assert.doesNotMatch(JSON.stringify(index), /P0300/);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/cdi-pinout-db.manifest.json"), "utf8"));
assert.equal(manifest.source_app_js_sha256, "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c");
assert.equal(manifest.profile_count, 69);
assert.ok(Array.isArray(manifest.excluded_from_ship));

console.log("Original ATDD launch page, 4783 offline entries, repair jobs, diagnostic engine and native scanner verified.");
console.log("Packaged DTC database SHA-256 " + createHash("sha256").update(data).digest("hex"));
console.log("Packaged CDI pinoutDB " + pinout.profile_count + " profiles, vehicle index " + index.counts.entries + " entries.");
