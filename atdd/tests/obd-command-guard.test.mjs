import assert from "node:assert/strict";
import {
  ALLOWED_ELM_ADAPTER_INIT,
  FIXD_COMPATIBILITY,
  assertAllowedObdCommand,
  normalizeObdCommand,
} from "../web/js/obd-command-guard.js";

assert.equal(FIXD_COMPATIBILITY, "UNVERIFIED");
assert.deepEqual(ALLOWED_ELM_ADAPTER_INIT, ["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"]);
assert.equal(normalizeObdCommand(" 01 00 "), "0100");
assert.equal(assertAllowedObdCommand("03"), "03");
assert.equal(assertAllowedObdCommand("0100"), "0100");
assert.equal(assertAllowedObdCommand("01 0C"), "010C");
assert.equal(assertAllowedObdCommand("0104"), "0104");

for (const allowed of ALLOWED_ELM_ADAPTER_INIT) {
  assert.equal(assertAllowedObdCommand(allowed), allowed, allowed);
}
assert.equal(assertAllowedObdCommand("at z"), "ATZ");

for (const blocked of [
  "ATS1",
  "ATE1",
  "ATH1",
  "ATSP6",
  "ATMA",
  "ATPP",
  "ATAT",
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

console.log("obd-command-guard: Mode 01/03 and exact ELM adapter-setup set allowed; Mode 04, ATMA, ATPP, and other AT commands blocked; FIXD claim UNVERIFIED");

import { createCapacitorBleTransport } from "../web/js/capacitor-ble-transport.js";
const transport = createCapacitorBleTransport();
assert.equal(assertAllowedObdCommand("ATZ"), "ATZ");
await assert.rejects(() => transport.send("ATMA"), /Blocked/);
await assert.rejects(() => transport.send("ATPP"), /Blocked/);
await assert.rejects(() => transport.send("04"), /Blocked/);
console.log("obd-command-guard: capacitor transport send() allows adapter setup, rejects ATMA/ATPP and Mode 04 before talking to the plugin");
