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
assert.ok(entry.includes('src="./scanner/iphone-scanner.mjs"'));
for (const file of ["app.js", "icon.png", "styles.css", "diagnosticsEngine.js", "data/dtc-db.js", "data/common-jobs.js"]) {
  const packed = fs.readFileSync(path.join(root, file));
  assert.ok(packed.equals(fs.readFileSync(path.join(classic, file))), "Changed original " + file);
}
const scanner = fs.readFileSync(path.join(root, "scanner/iphone-scanner.mjs"));
assert.ok(scanner.equals(fs.readFileSync(path.join(ios, "scanner/iphone-scanner.mjs"))));
for (const file of ["capacitor-ble-transport.js", "fixd-protocol-probe.js", "obd-protocol-v3-frame-aware.js", "web-bluetooth-transport.js"]) {
  assert.ok(fs.readFileSync(path.join(root, "tools/js", file)).equals(fs.readFileSync(path.join(ios, "../web/js", file))), file);
}
const data = fs.readFileSync(path.join(root, "data/dtc-db.js"));
const context = { window: {} };
runInNewContext(data.toString("utf8"), context);
assert.equal(context.window.DTC_DB_DATA.length, 4783);
assert.match(context.window.DTC_DB_DATA.find((row) => row.code === "P0300").description, /misfire/i);
console.log("Original ATDD launch page, 4783 offline entries, repair jobs, diagnostic engine and native scanner verified.");
console.log("Packaged DTC database SHA-256 " + createHash("sha256").update(data).digest("hex"));
