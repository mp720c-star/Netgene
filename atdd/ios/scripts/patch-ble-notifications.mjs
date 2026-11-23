/**
 * @capacitor-community/bluetooth-le 6.1.0 drops iOS notifications for the
 * 16-bit GATT services FIXD and ELM327 BLE adapters use (FFF0 / FFE0 / 18F0).
 *
 * setNotifications stored its callbacks under CBUUID.uuidString, which Apple
 * shortens to "FFF1". didUpdateValueFor looks them up with getKey, which
 * expands that to "0000FFF1-0000-1000-8000-00805F9B34FB". The keys never
 * match, so the adapter's Mode 03 reply never reaches JavaScript. The link
 * still comes up, which is why Connect succeeds and Read codes does not.
 *
 * Store those callbacks with cbuuidToStringUppercase, the same string getKey
 * uses. Idempotent. Run after npm ci and before cap sync.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEVICE_SWIFT = path.join(
  root,
  "node_modules/@capacitor-community/bluetooth-le/ios/Plugin/Device.swift",
);

const REPLACEMENTS = [
  [
    'let key = "read|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"',
    'let key = "read|\\(cbuuidToStringUppercase(serviceUUID))|\\(cbuuidToStringUppercase(characteristicUUID))"',
  ],
  [
    'let key = "write|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"',
    'let key = "write|\\(cbuuidToStringUppercase(serviceUUID))|\\(cbuuidToStringUppercase(characteristicUUID))"',
  ],
  [
    'let key = "setNotifications|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"',
    'let key = "setNotifications|\\(cbuuidToStringUppercase(serviceUUID))|\\(cbuuidToStringUppercase(characteristicUUID))"',
  ],
  [
    'let notifyKey = "notification|\\(serviceUUID.uuidString)|\\(characteristicUUID.uuidString)"',
    'let notifyKey = "notification|\\(cbuuidToStringUppercase(serviceUUID))|\\(cbuuidToStringUppercase(characteristicUUID))"',
  ],
];

export function patchDeviceSwift(source) {
  if (!source.includes("func setNotifications(")) {
    throw new Error("Device.swift is missing setNotifications.");
  }
  let next = source;
  for (const [from, to] of REPLACEMENTS) {
    const found = next.includes(from);
    const already = next.includes(to);
    if (found) next = next.replace(from, to);
    else if (!already) {
      throw new Error("BLE plugin callback key is not the known 6.1.0 form: " + from);
    }
  }
  return next;
}

function main() {
  if (!fs.existsSync(DEVICE_SWIFT)) {
    throw new Error("Install @capacitor-community/bluetooth-le@6.1.0 before patching " + DEVICE_SWIFT);
  }
  const source = fs.readFileSync(DEVICE_SWIFT, "utf8");
  const patched = patchDeviceSwift(source);
  if (patched !== source) fs.writeFileSync(DEVICE_SWIFT, patched);
  console.log("BLE notification callback keys match getKey in Device.swift");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
