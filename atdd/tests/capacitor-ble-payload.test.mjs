import assert from "node:assert/strict";
import {
  assertBleUuid,
  bleHexToText,
  buildRequestDeviceOptions,
  bytesToBleHex,
  decodeBleNotification,
  formatBlePayloadDiagnostic,
  isBleHexString,
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
assert.equal(isBleHexString("QVRaDQ=="), false);
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

// Test-only fixture. Cited format: ISO 15031-5 / SAE J1979 Mode 03 reply with an
// ELM327 prompt, encoded the way @capacitor-community/bluetooth-le 6.1.0 iOS
// Conversion.swift dataToString / Data.toHexString() delivers notifications:
// contiguous hex, no spaces. This is not a live vehicle recording.
const elmAscii = "03\rSEARCHING...\r43 01 03 00\r>";
const unspaced = Buffer.from(elmAscii, "ascii").toString("hex");
assert.equal(unspaced.includes(" "), false);
assert.equal(isBleHexString(unspaced), true);
assert.equal(bleHexToText(unspaced), elmAscii);

const decoded = decodeBleNotification(unspaced);
assert.equal(decoded.encoding, "ble-hex");
assert.equal(decoded.text, elmAscii);
assert.equal(bytesToBleHex(decoded.bytes).replace(/\s+/g, ""), unspaced);

const diagnostic = formatBlePayloadDiagnostic(decoded.bytes, decoded.text);
assert.match(diagnostic, /Raw adapter payload \(hex\):/);
assert.match(diagnostic, /Raw adapter payload \(ASCII\):/);
assert.match(diagnostic, /43 01 03 00/);
assert.match(diagnostic, /SEARCHING/);

const view = new DataView(decoded.bytes.buffer, decoded.bytes.byteOffset, decoded.bytes.byteLength);
assert.equal(decodeBleNotification(view).text, elmAscii);
assert.equal(decodeBleNotification(Uint8Array.from(decoded.bytes)).text, elmAscii);

// Already-decoded ASCII ELM text (defensive path).
assert.equal(decodeBleNotification("NO DATA\r>").encoding, "ascii");
assert.equal(decodeBleNotification("NO DATA\r>").text, "NO DATA\r>");

assert.throws(() => decodeBleNotification("not-hex-and-not-an-ELM-reply"), /not BLE hex/);

console.log("capacitor-ble-payload: ok");
