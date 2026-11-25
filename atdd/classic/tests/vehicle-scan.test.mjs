import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, globalThis: {} };
context.globalThis = context.window;
runInNewContext(fs.readFileSync(path.join(classic, "obdVehicleScan.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "scanReadout.js"), "utf8"), context);
const scan = context.window.ATDDVehicleScan;
const readout = context.window.ATDDScanReadout;

function list(value) {
  return JSON.parse(JSON.stringify(value));
}

const sierra = scan.buildReport([{ raw: "0\r4300\r430200160325\r>" }]);
assert.deepEqual(list(sierra.uniqueCodes), ["P0016", "P0325"]);
assert.deepEqual(list(sierra.chassisCodes), []);
assert.equal(sierra.answered, true);
assert.equal(sierra.modules.length, 1);
assert.deepEqual(list(sierra.modules[0].stored), ["P0016", "P0325"]);
assert.deepEqual(list(sierra.modules[0].pending), []);
assert.deepEqual(list(sierra.modules[0].moduleCodes), []);

const split = scan.buildReport([{
  raw: "7E8 43 02 00 16 03 25\r7EA 43 00\r7E8 47 03 00 16 03 25 01 57\r>"
}]);
assert.deepEqual(list(split.modules.find((item) => item.id === "7E8").stored), ["P0016", "P0325"]);
assert.deepEqual(list(split.modules.find((item) => item.id === "7E8").pending), ["P0016", "P0325", "P0157"]);
assert.deepEqual(list(split.modules.find((item) => item.id === "7EA").stored), []);
assert.equal(split.modules.find((item) => item.id === "7EA").sawStored, true);

const vin = "2GTEK133081152274";
const vinBytes = Array.from(vin, (char) => char.charCodeAt(0).toString(16).toUpperCase()).join(" ");
const status = scan.buildReport([{
  raw: [
    "7E8 41 01 82 00 00 00",
    "7EA 41 01 00 00 00 00",
    "7E8 41 03 02 00",
    "7E8 41 30 02",
    "7E8 41 31 00 0C",
    "7EA 41 31 00 08",
    "7E8 41 21 00 06",
    "7EA 49 02 01 " + vinBytes,
    "7EC 59 02 FF 40 35 00 08 40 45 00 08",
    ">"
  ].join("\r")
}]);
const engine = status.modules.find((item) => item.id === "7E8");
const other = status.modules.find((item) => item.id === "7EA");
const chassis = status.modules.find((item) => item.id === "7EC");
assert.equal(engine.mil, true);
assert.equal(engine.dtcCount, 2);
assert.deepEqual(list(engine.loop), ["Closed loop"]);
assert.equal(engine.warmups, 2);
assert.equal(engine.distanceClearKm, 12);
assert.equal(scan.formatDistance(12), "12 km (7.5 mi)");
assert.equal(scan.formatDistance(8), "8 km (5.0 mi)");
assert.equal(other.mil, false);
assert.equal(other.dtcCount, 0);
assert.equal(other.distanceClearKm, 8);
assert.equal(other.vin, vin);
assert.equal(engine.distanceMilKm, 6);
assert.deepEqual(list(chassis.moduleCodes.map((row) => row.code)), ["C0035", "C0045"]);
assert.equal(chassis.moduleCodes[0].label, "confirmed");
assert.deepEqual(list(status.chassisCodes), ["C0035", "C0045"]);
assert.ok(!status.uniqueCodes.includes("P0300"));
assert.ok(!status.uniqueCodes.includes("P0573"));

const silent = scan.buildReport([{ raw: "NO DATA\r>" }, { raw: "CAN ERROR\r>" }]);
assert.equal(silent.answered, false);
assert.deepEqual(list(silent.uniqueCodes), []);
assert.deepEqual(list(silent.chassisCodes), []);
const rejected = scan.buildReport([{ raw: "7F 03 11\r>" }]);
assert.equal(rejected.answered, true);
assert.deepEqual(list(rejected.uniqueCodes), []);
assert.equal(scan.replyHasVehicleData("NO DATA\r>"), false);
assert.equal(scan.replyHasVehicleData("7EC 59 02 FF 40 35 00 08\r>"), true);
assert.equal(scan.needsExtendedSession("7F 19 7E\r>"), true);
assert.deepEqual(list(scan.adapterHeader({ request: "7E4", response: "7EC" }).slice(0, 2)), ["ATSH7E4", "ATCRA7EC"]);

const lookup = (code) => {
  if (code === "P0016") return { code, description: "Crankshaft Position-Camshaft Position Correlation", inDatabase: true };
  if (code === "C0035") return { code, description: "Right Front Wheel Speed Sensor", inDatabase: true };
  return { code, description: readout.UNKNOWN_CODE, inDatabase: false };
};
const view = readout.buildScanReadout({ ok: true, reply: "vehicle", report: status }, lookup);
assert.equal(view.status, "report");
assert.ok(view.items.some((item) => item.code === "C0035" && item.inDatabase));
assert.ok(!view.items.some((item) => item.code === "P0300"));
const missed = readout.buildScanReadout({ ok: true, reply: "NO DATA\r>", report: silent }, lookup);
assert.equal(missed.status, "no-reply");
assert.equal(missed.items.length, 0);

const html = fs.readFileSync(path.join(classic, "index.html"), "utf8");
assert.match(html, /id="btnBtClearVehicle"/);
assert.match(html, /id="clearCodesDialog"/);
assert.match(html, /src="\.\/obdVehicleScan\.js"/);
assert.match(html, /id="btnClearCodes"/);

console.log("vehicle-scan: live Mode 03 capture, per-module status, chassis codes, and empty replies covered");
