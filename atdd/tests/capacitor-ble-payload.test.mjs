import assert from "node:assert/strict";
import {
  assertBleUuid,
  bleHexToText,
  buildRequestDeviceOptions,
  notificationEventKeys,
  textToBleHex,
} from "../web/js/capacitor-ble-transport.js";

// iOS stringToData splits on spaces and force-unwraps UInt8(token, radix: 16).
// "ATZ\\r" as base64 is "QVRaDQ==", which crashes TestFlight. Hex does not.
const atz = textToBleHex("ATZ\r");
assert.equal(atz, "41 54 5a 0d");
assert.equal(bleHexToText(atz), "ATZ\r");
assert.equal(atz.includes("="), false);
for (const token of atz.split(" ")) {
  assert.match(token, /^[0-9a-f]{2}$/);
}

assert.throws(() => bleHexToText("QVRaDQ=="), /not BLE hex/);
assert.throws(() => assertBleUuid("fff0", "Service"), /128-bit/);
assert.equal(
  assertBleUuid("0000FFF0-0000-1000-8000-00805F9B34FB", "Service"),
  "0000fff0-0000-1000-8000-00805f9b34fb",
);

const keys = notificationEventKeys(
  "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000fff1-0000-1000-8000-00805f9b34fb",
);
assert.deepEqual(keys, [
  "notification|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|0000fff0-0000-1000-8000-00805f9b34fb|0000fff1-0000-1000-8000-00805f9b34fb",
  "notification|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|fff0|fff1",
]);

const request = buildRequestDeviceOptions();
assert.deepEqual(request, {});
assert.equal(Object.hasOwn(request, "services"), false);

console.log("capacitor-ble-payload: ok");
