import assert from "node:assert/strict";
import { liveCommands, readingFromReply, supportBitmap, BLUETOOTH_SUPPORT } from "../scanner/live-readings.js";

// Formula check on a cited SAE J1979 layout. Not a recording from a vehicle.
const support = supportBitmap("41 00 BE 1F A8 13\r>", "00");
assert.ok(support.includes("04") && support.includes("05") && support.includes("0C"));
assert.ok(support.includes("0D") && support.includes("0F") && support.includes("11"));
assert.equal(support.includes("42"), false);
assert.ok(support.includes("20"));
assert.deepEqual(liveCommands(support), ["0104", "0105", "010C", "010D", "010F", "0111"]);

const voltageMap = supportBitmap("41 40 40 00 00 00\r>", "40");
assert.deepEqual(voltageMap, ["42"]);
assert.deepEqual(liveCommands(voltageMap), ["0142"]);

const rpm = readingFromReply("0C", "41 0C 1A F8\r>");
assert.equal(rpm.value, 1726);
assert.equal(rpm.display, "1726 rpm");

const coolant = readingFromReply("05", "7E8 03 41 05 5A\r>");
assert.equal(coolant.value, 50);
assert.equal(coolant.display, "50 °C");

const load = readingFromReply("04", "0104\r41 04 80\r>");
assert.equal(load.display, "50.2 %");

const volts = readingFromReply("42", "41 42 36 B0\r>");
assert.equal(volts.value, 14);
assert.equal(volts.display, "14.00 V");

const missing = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("expected a throw");
};
assert.equal(missing(() => readingFromReply("0C", "41 0C 1A\r>")).message, "No live reading from the scanner.");
assert.equal(missing(() => readingFromReply("0C", "NO DATA\r>")).message, "No live reading from the scanner.");
assert.match(missing(() => readingFromReply("05", "7F 01 11\r>")).message, /rejected PID 05/);
assert.match(missing(() => readingFromReply("0C", "41 0C 1A F8")).message, /incomplete/);
assert.match(missing(() => supportBitmap("NO DATA\r>", "00")).message, /did not report/);
assert.equal(readingFromReply("0D", "41 0D 00\r>").display, "0 km/h");

assert.ok(BLUETOOTH_SUPPORT.unsupported.some((item) => item.id === "fixd-proprietary"));
assert.ok(BLUETOOTH_SUPPORT.unsupported.some((item) => item.id === "classic-bluetooth-serial"));
assert.ok(BLUETOOTH_SUPPORT.unsupported.some((item) => item.id === "wifi-elm"));
assert.equal(BLUETOOTH_SUPPORT.compatible.length, 4);

console.log("live-readings: Mode 01 formulas, support bits, and unsupported protocols covered");
