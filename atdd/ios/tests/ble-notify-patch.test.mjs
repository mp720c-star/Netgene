import assert from "node:assert/strict";
import { patchDeviceSwift } from "../scripts/patch-ble-notifications.mjs";

// CBUUID.uuidString shortens a Bluetooth-base UUID. getKey expands it again.
function appleUuidString(fullLower) {
  const alias16 = fullLower.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/);
  return alias16 ? alias16[1].toUpperCase() : fullLower.toUpperCase();
}

function callbackLookup(uuidString) {
  let str = uuidString.toLowerCase();
  if (str.length === 4) str = "0000" + str + "-0000-1000-8000-00805f9b34fb";
  return str.toUpperCase();
}

const service = appleUuidString("0000fff0-0000-1000-8000-00805f9b34fb");
const notify = appleUuidString("0000fff1-0000-1000-8000-00805f9b34fb");
assert.equal(service, "FFF0");
assert.equal(notify, "FFF1");
const storedBeforeFix = "notification|" + service + "|" + notify;
const lookedUp = "notification|" + callbackLookup(service) + "|" + callbackLookup(notify);
assert.equal(lookedUp, "notification|0000FFF0-0000-1000-8000-00805F9B34FB|0000FFF1-0000-1000-8000-00805F9B34FB");
assert.notEqual(storedBeforeFix, lookedUp);

const buggy = `
func setNotifications(
) {
    let key = "setNotifications|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"
    let notifyKey = "notification|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"
}
func read() {
    let key = "read|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"
}
func write() {
    let key = "write|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"
}
`;
const patched = patchDeviceSwift(buggy);
assert.equal(patchDeviceSwift(patched), patched);
const expanded = "cbuuidToStringUppercase(serviceUUID))|\\(cbuuidToStringUppercase(characteristicUUID))";
assert.ok(patched.includes('let key = "setNotifications|\\(' + expanded));
assert.ok(patched.includes('let notifyKey = "notification|\\(' + expanded));
assert.ok(patched.includes('let key = "read|\\(' + expanded));
assert.ok(patched.includes('let key = "write|\\(' + expanded));
assert.equal(patched.includes("uuidString"), false);

console.log("ble-notify-patch: 16-bit FIXD callback key now matches the lookup");
