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
for (const allowed of ["07", "0A", "04", "0902", "1902FF", "14FFFFFF", "1001", "1003", "ATI", "ATDP", "ATDPN", "ATH1", "ATCAF1", "ATSH7E4", "ATCRA7EC", "ATSH18DA28F1", "ATFCSD300000"]) {
  assert.equal(assertAllowedObdCommand(allowed), allowed.replace(/\s+/g, ""), allowed);
}

for (const blocked of [
  "ATS1",
  "ATE1",
  "ATSP6",
  "ATMA",
  "ATPP",
  "ATAT",
  "04 00",
  "0400",
  "02",
  "1002",
  "14FFFF",
  "1901",
  "",
  "  ",
  "ZZ",
]) {
  assert.throws(() => assertAllowedObdCommand(blocked), /Blocked/, blocked);
}

console.log("obd-command-guard: reads, confirmed clear, and header setup allowed; ATMA, ATPP, programming session, and other commands blocked; FIXD claim UNVERIFIED");

import { createCapacitorBleTransport } from "../web/js/capacitor-ble-transport.js";
const transport = createCapacitorBleTransport();
assert.equal(assertAllowedObdCommand("ATZ"), "ATZ");
await assert.rejects(() => transport.send("ATMA"), /Blocked/);
await assert.rejects(() => transport.send("ATPP"), /Blocked/);
await assert.rejects(() => transport.send("1002"), /Blocked/);
assert.equal(assertAllowedObdCommand("04"), "04");
await assert.rejects(() => transport.send("04"), /BluetoothLe plugin missing/);
console.log("obd-command-guard: capacitor transport send() allows the confirmed clear, rejects ATMA/ATPP and programming session before talking to the plugin");
