import assert from "node:assert/strict";
import {
  FIXD_COMPATIBILITY,
  assertAllowedObdCommand,
  normalizeObdCommand,
} from "../web/js/obd-command-guard.js";

assert.equal(FIXD_COMPATIBILITY, "UNVERIFIED");
assert.equal(normalizeObdCommand(" 01 00 "), "0100");
assert.equal(assertAllowedObdCommand("03"), "03");
assert.equal(assertAllowedObdCommand("0100"), "0100");
assert.equal(assertAllowedObdCommand("01 0C"), "010C");
assert.equal(assertAllowedObdCommand("0104"), "0104");

for (const blocked of [
  "ATZ",
  "ATE0",
  "ATL0",
  "ATS1",
  "ATH0",
  "ATSP0",
  "at z",
  "04",
  "04 00",
  "0400",
  "02",
  "07",
  "0A",
  "0902",
  "",
  "  ",
  "ZZ",
]) {
  assert.throws(() => assertAllowedObdCommand(blocked), /Blocked/, blocked);
}

console.log("obd-command-guard: Mode 01/03 allowed, Mode 04 and AT writes blocked, FIXD claim UNVERIFIED");

import { createCapacitorBleTransport } from "../web/js/capacitor-ble-transport.js";
const transport = createCapacitorBleTransport();
await assert.rejects(() => transport.send("ATZ"), /Blocked/);
await assert.rejects(() => transport.send("ATE0"), /Blocked/);
await assert.rejects(() => transport.send("04"), /Blocked/);
console.log("obd-command-guard: capacitor transport send() rejects AT and Mode 04 before talking to the plugin");
