import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, globalThis: {} };
context.globalThis = context.window;
runInNewContext(fs.readFileSync(path.join(classic, "scanReadout.js"), "utf8"), context);
const api = context.window.ATDDScanReadout;
assert.ok(api, "ATDDScanReadout should attach to window");

const lookup = (code) => {
  if (code === "P0300") return { code, description: "Random/Multiple Cylinder Misfire Detected", inDatabase: true };
  if (code === "P0420") return { code, description: "Catalyst System Efficiency Below Threshold (Bank 1)", inDatabase: true };
  return { code, description: api.UNKNOWN_CODE, inDatabase: false };
};

const withCodes = api.buildScanReadout({ ok: true, codes: ["P0300", "P0420"], reply: "43 02 03 00 04 20\r>" }, lookup);
assert.equal(withCodes.status, "ok");
assert.equal(withCodes.items.length, 2);
assert.equal(withCodes.items[0].code, "P0300");
assert.match(withCodes.items[0].description, /Misfire/i);
assert.equal(withCodes.items[0].inDatabase, true);
assert.equal(withCodes.items[1].code, "P0420");
assert.equal(withCodes.items[1].inDatabase, true);

const unknown = api.buildScanReadout({ ok: true, codes: ["Z9999"], reply: "43 01 FF FF\r>" }, lookup);
assert.equal(unknown.status, "ok");
assert.equal(unknown.items[0].code, "Z9999");
assert.equal(unknown.items[0].description, "Unknown code – not in database");
assert.equal(unknown.items[0].inDatabase, false);

const empty = api.buildScanReadout({ ok: true, codes: [], reply: "43 00\r>" }, lookup);
assert.equal(empty.status, "empty");
assert.equal(empty.title, "No stored codes");
assert.equal(empty.message, "No stored codes");
assert.equal(empty.items.length, 0);

const failed = api.buildScanReadout({ ok: false, reply: "UNABLE TO CONNECT\r>", error: "incomplete" }, lookup);
assert.equal(failed.status, "parse-error");
assert.equal(failed.message, "could not parse");
assert.equal(failed.raw, "UNABLE TO CONNECT\r>");
assert.equal(failed.items.length, 0);

// Never invent a code that was not in the parser result.
const invented = api.buildScanReadout({ ok: true, codes: [], reply: "43 01 03 00\r>" }, lookup);
assert.equal(invented.items.length, 0);
assert.ok(!invented.items.some((item) => item.code === "P0300"));

const html = fs.readFileSync(path.join(classic, "index.html"), "utf8");
assert.match(html, /id="scanReadoutCard"/);
assert.match(html, /id="scanReadout"/);
assert.match(html, /src="\.\/scanReadout\.js"/);
const bluetooth = html.indexOf('id="bluetoothCard"');
const readout = html.indexOf('id="scanReadoutCard"');
assert.ok(bluetooth >= 0 && readout > bluetooth, "scan readout must sit below the Connect OBD-II Scanner card");

console.log("scan-readout: database meanings, unknown label, no stored codes, and could-not-parse raw reply covered");
