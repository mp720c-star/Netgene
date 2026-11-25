import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { assertAllowedObdCommand } from "../../web/js/obd-command-guard.js";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function load(file) {
  const ctx = { window: {}, console };
  ctx.globalThis = ctx.window;
  runInNewContext(fs.readFileSync(path.join(classic, file), "utf8"), ctx);
  return ctx.window;
}

const win = load("gmBrakeDiagnostics.js");
const gm = win.ATDDGmBrake;
assert.ok(gm);
assert.equal(gm.PRIMARY_VEHICLE.year, 2008);
assert.equal(gm.PRIMARY_VEHICLE.make, "GMC");
assert.ok(gm.PRIORITY_ABS_CODES.C0035);
assert.ok(gm.PRIORITY_ABS_CODES.C0040);
assert.ok(gm.PRIORITY_ABS_CODES.C0045);
assert.ok(gm.PRIORITY_ABS_CODES.C0050);
assert.ok(gm.PRIORITY_ABS_CODES.C0245);
assert.ok(gm.PRIORITY_ABS_CODES.C0561);
assert.match(gm.PRIORITY_ABS_CODES.C0035.title, /left front/i);
assert.match(gm.PRIORITY_ABS_CODES.C0040.title, /right front/i);
assert.match(gm.PRIORITY_ABS_CODES.C0045.title, /left rear/i);
assert.match(gm.PRIORITY_ABS_CODES.C0050.title, /right rear/i);
assert.equal(gm.HARDWARE_LIMITS.fixdClaim, "PARTIAL");
assert.equal(gm.SIERRA_EVIDENCE.lastBuildReachedTruck, true);
assert.ok(gm.SIERRA_EVIDENCE.fixdAppPdfCodes.includes("C0035"));
assert.ok(gm.SIERRA_EVIDENCE.powertrainMode03Codes.includes("P0016"));

const before = ["P0300", "C0035", "C0045"];
const after = ["C0035", "C0050"];
const diff = gm.compareCodeSets(before, after);
assert.equal(diff.cleared.join(","), "C0045,P0300");
assert.equal(diff.remained.join(","), "C0035");
assert.equal(diff.appeared.join(","), "C0050");
assert.equal(diff.couldNotClear.join(","), "C0035");

assert.equal(gm.isPositiveDidReply("62 0B 01 00 64"), true);
assert.equal(gm.isPositiveDidReply("NO DATA"), false);
assert.equal(gm.isPositiveDidReply("?"), false);

const live = gm.buildLiveSnapshot({
  wheel_speed_lf: {
    attempts: [{ moduleId: "641", did: "220B01", raw: "62 0B 01 00 64", positive: true }],
  },
});
const lf = live.find((row) => row.id === "wheel_speed_lf");
assert.equal(lf.status, "raw_unverified");
assert.equal(lf.value, null);
assert.match(lf.note, /not verified/i);

const empty = gm.parameterStatus(gm.LIVE_PARAMETERS[0], { attempts: [] });
assert.equal(empty.status, "unavailable");
assert.equal(empty.value, null);

const report = {
  uniqueCodes: ["C0035", "P0300"],
  chassisCodes: ["C0035"],
  modules: [{ stored: ["P0300"], pending: [], permanent: [], moduleCodes: [] }],
};
const sections = gm.sectionizeReport(report, live);
assert.ok(sections.sections.engine.includes("P0300"));
assert.ok(sections.sections.abs.includes("C0035"));
assert.equal(sections.priorityAbs.length, 1);
assert.equal(sections.priorityAbs[0].code, "C0035");
assert.ok(sections.hardware.summary.length > 0);

assert.equal(assertAllowedObdCommand("220B01"), "220B01");
assert.equal(assertAllowedObdCommand("ATI"), "ATI");
assert.equal(assertAllowedObdCommand("ATDP"), "ATDP");
assert.throws(() => assertAllowedObdCommand("1002"), /Blocked/);
assert.throws(() => assertAllowedObdCommand("ATMA"), /Blocked/);

const scanWin = load("obdVehicleScan.js");
const nodes = scanWin.ATDDVehicleScan.allProbeNodes();
assert.ok(nodes.some((n) => n.request === "241"));
assert.ok(nodes.some((n) => n.request === "7E0"));
assert.ok(nodes.some((n) => n.request === "244"));

console.log("gm-brake-diagnostics: priority ABS codes, clear diff, fail-closed live data, Mode 22 allowlist covered");
