/**
 * Capacitor BLE transport for native iPhone/Android ATDD Connect FIXD.
 * Uses @capacitor-community/bluetooth-le when running inside the Capacitor shell.
 * FIXD application protocol remains UNVERIFIED.
 */

import { CANDIDATE_GATT_PROFILES } from "./fixd-protocol-probe.js";
import { pickCharacteristics } from "./web-bluetooth-transport.js";
import { assertAllowedObdCommand } from "./obd-command-guard.js";
import { reassembleElmReply } from "./elm-reply.js";

function getCapacitor() {
  return typeof window !== "undefined" ? window.Capacitor : null;
}

/**
 * The native BluetoothLe plugin is linked in the iOS/Android shell, but Capacitor
 * does not put it on `Capacitor.Plugins` until JS calls `registerPlugin`.
 * Looking only at `Plugins.BluetoothLe` made the installed app treat itself as a
 * web page and disable Connect Scanner.
 */
export function resolveNativeBlePlugin(cap) {
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return null;
  if (cap.Plugins?.BluetoothLe) return cap.Plugins.BluetoothLe;
  if (cap.Plugins?.BleClient) return cap.Plugins.BleClient;
  if (typeof cap.registerPlugin === "function") return cap.registerPlugin("BluetoothLe");
  return null;
}

export function capacitorBleAvailable() {
  return resolveNativeBlePlugin(getCapacitor()) != null;
}

function plugin() {
  const ble = resolveNativeBlePlugin(getCapacitor());
  if (!ble) {
    throw new Error(
      "Capacitor BluetoothLe plugin missing. Rebuild the native app with @capacitor-community/bluetooth-le.",
    );
  }
  return ble;
}

const BLE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Native iOS builds CBUUID(string:) and crashes the process on a bad UUID.
 * Reject here so the Connect screen can show the error.
 */
export function assertBleUuid(uuid, label) {
  const s = String(uuid || "").trim().toLowerCase();
  if (!BLE_UUID_RE.test(s)) {
    throw new Error(`${label || "UUID"} is not a 128-bit Bluetooth UUID.`);
  }
  return s;
}

/**
 * Bluetooth-base UUIDs are shortened by CBUUID.uuidString. Plugin.swift emits
 * notification events with that short lowercase form ("fff1"), so the listener
 * has to include it. Device.swift must store the native callback under
 * cbuuidToStringUppercase or didUpdateValueFor never finds it and Mode 03
 * bytes never arrive. See ios/scripts/patch-ble-notifications.mjs.
 */
export function shortBluetoothUuid(uuid) {
  const full = assertBleUuid(uuid, "UUID");
  const alias16 = full.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/);
  if (alias16) return alias16[1];
  const alias32 = full.match(/^([0-9a-f]{8})-0000-1000-8000-00805f9b34fb$/);
  if (alias32 && !alias32[1].startsWith("0000")) return alias32[1];
  return full;
}

export function notificationEventKeys(deviceId, service, characteristic) {
  const svc = assertBleUuid(service, "Service");
  const chr = assertBleUuid(characteristic, "Characteristic");
  const id = String(deviceId || "");
  const keys = [`notification|${id}|${svc}|${chr}`];
  const shortSvc = shortBluetoothUuid(svc);
  const shortChr = shortBluetoothUuid(chr);
  if (shortSvc !== svc || shortChr !== chr) {
    keys.push(`notification|${id}|${shortSvc}|${shortChr}`);
  }
  return keys;
}

/**
 * @capacitor-community/bluetooth-le native write parses a space-separated hex
 * string and force-unwraps each byte. Base64 (or any non-hex token) crashes iOS.
 */
export function textToBleHex(text) {
  const bytes = new TextEncoder().encode(String(text));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ");
}

/**
 * True when `value` is space-separated or contiguous hex from the BLE plugin.
 * @capacitor-community/bluetooth-le 6.1.0 writes use spaced hex ("41 54 5a 0d").
 * Native iOS notifications/reads use Data.toHexString(), which is contiguous
 * with no spaces ("41545a0d"). See Conversion.swift in 6.1.0 and BleClient.convertValue().
 */
export function isBleHexString(value) {
  const s = String(value || "").trim();
  if (!s) return false;
  if (/^(?:[0-9a-fA-F]{2})+$/.test(s)) return true;
  if (/^[0-9a-fA-F]{1,2}$/.test(s)) return true;
  if (/^(?:[0-9a-fA-F]{1,2})(?:\s+[0-9a-fA-F]{1,2})+$/.test(s)) return true;
  return false;
}

export function bleHexToBytes(hex) {
  const s = String(hex || "").trim();
  if (!isBleHexString(s)) {
    throw new Error("Adapter payload was not BLE hex.");
  }
  const compact = s.replace(/\s+/g, "");
  const even = compact.length % 2 === 0 ? compact : "0" + compact;
  const bytes = [];
  for (let i = 0; i < even.length; i += 2) {
    bytes.push(parseInt(even.slice(i, i + 2), 16));
  }
  return Uint8Array.from(bytes);
}

export function bleHexToText(hex) {
  return new TextDecoder().decode(bleHexToBytes(hex));
}

export function bytesToBleHex(bytes) {
  return Array.from(bytes || [], (b) => b.toString(16).padStart(2, "0")).join(" ");
}

export function formatBlePayloadDiagnostic(bytes, text) {
  const hex = bytes && bytes.length ? bytesToBleHex(bytes) : "(empty)";
  const ascii = String(text ?? "").replace(/[^\x20-\x7e\r\n\t]/g, ".");
  return "Raw adapter payload (hex): " + hex + "\nRaw adapter payload (ASCII): " + JSON.stringify(ascii);
}

function previewUnknownPayload(value) {
  if (typeof value === "string") {
    return "Received string (" + value.length + " chars): " + JSON.stringify(value.slice(0, 240));
  }
  const type = value === null ? "null" : typeof value;
  return "Received " + type + ".";
}

/**
 * Decode a notification or read value from the raw Capacitor BluetoothLe plugin
 * (not BleClient). 6.1.0 iOS delivers a contiguous hex string; the JS API of
 * BleClient would have converted that to a DataView. Arrays, DataViews, and
 * already-decoded ASCII ELM text are also accepted. Never invents bytes.
 */
export function decodeBleNotification(value) {
  if (value == null) {
    throw new Error("Adapter payload was empty. " + previewUnknownPayload(value));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isBleHexString(trimmed)) {
      const bytes = bleHexToBytes(trimmed);
      return { bytes, text: new TextDecoder().decode(bytes), encoding: "ble-hex" };
    }
    // Defensive: some wrappers may already surface ASCII ELM text.
    if (/[>]|SEARCHING|NO DATA|UNABLE TO CONNECT|BUS INIT/.test(value) && /[^0-9a-fA-F\s]/.test(value)) {
      const bytes = new TextEncoder().encode(value);
      return { bytes, text: value, encoding: "ascii" };
    }
    throw new Error("Adapter payload was not BLE hex. " + previewUnknownPayload(value));
  }
  let bytes = null;
  if (value instanceof ArrayBuffer) {
    bytes = new Uint8Array(value);
  } else if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value)) {
    bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  } else if (value && value.buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || value.buffer.byteLength);
  } else if (Array.isArray(value) && value.every((n) => Number.isInteger(n))) {
    bytes = Uint8Array.from(value);
  } else if (value && typeof value.value === "string") {
    return decodeBleNotification(value.value);
  }
  if (!bytes) {
    throw new Error("Unexpected Bluetooth notification. " + previewUnknownPayload(value));
  }
  return { bytes, text: new TextDecoder().decode(bytes), encoding: "bytes" };
}

/**
 * Scan every nearby device. Do not pass `services: undefined` — the iOS plugin
 * turns a present-but-empty service list into CBUUID values and can crash while
 * showing the picker. One request per tap; a second requestDevice while the
 * first alert is still up also crashes.
 */
export function buildRequestDeviceOptions() {
  return {};
}

/**
 * Live FIXD/OBD transport via Capacitor Bluetooth LE (iOS/Android).
 */
export function createCapacitorBleTransport({ onDisconnect, onRawPayload, requireKnownProfile = false } = {}) {
  let deviceId = null;
  let deviceName = null;
  let write = null;
  let notify = null;
  let buffer = "";
  let pending = null;
  let connected = false;
  let commandChain = Promise.resolve();
  let lastServices = [];
  let writeMode = "writeWithoutResponse";
  let notifyHandles = [];

  function finish(error, reply) {
    if (!pending) return;
    const command = pending;
    pending = null;
    buffer = "";
    clearTimeout(command.timeout);
    if (error) command.reject(error);
    else command.resolve(reply);
  }

  function onValue(value) {
    if (!pending) return;
    try {
      const decoded = decodeBleNotification(value);
      if (typeof onRawPayload === "function") {
        try { onRawPayload(decoded); } catch { /* UI logging must not break the read */ }
      }
      buffer += decoded.text;
      if (buffer.length > 32768) throw new Error("Scanner reply exceeded the receive buffer.");
      // Do not stop on the first ">". Multiline Mode 03 replies often prompt
      // after each row; later notifications still belong to this command.
      const reply = reassembleElmReply(buffer, pending.command);
      if (reply) finish(null, reply);
    } catch (error) {
      finish(error);
    }
  }

  async function discover(ble) {
    const inspected = [];
    const services = await ble.getServices({ deviceId });
    const serviceList = services?.services || services || [];
    for (const svc of serviceList) {
      const uuid = svc.uuid || svc;
      let characteristics = svc.characteristics || [];
      if (!characteristics.length) {
        try {
          const got = await ble.getCharacteristics({ deviceId, service: uuid });
          characteristics = got?.characteristics || got || [];
        } catch {
          characteristics = [];
        }
      }
      inspected.push({
        uuid,
        characteristics: characteristics.map((c) => ({
          uuid: c.uuid || c,
          properties: c.properties || {},
        })),
      });
      const profile = CANDIDATE_GATT_PROFILES.find((item) => item.service === String(uuid).toLowerCase());
      if (requireKnownProfile && !profile) continue;
      let picked;
      if (profile) {
        const channels = characteristics.filter((c) =>
          [profile.write, profile.notify].includes(String(c.uuid).toLowerCase()));
        picked = pickCharacteristics(channels);
      }
      if ((!picked?.write || !picked.notify) && !requireKnownProfile) {
        picked = pickCharacteristics(characteristics);
      }
      if (picked?.write && picked.notify) {
        return {
          write: { service: uuid, characteristic: picked.write.uuid, properties: picked.write.properties },
          notify: { service: uuid, characteristic: picked.notify.uuid, properties: picked.notify.properties },
          inspected,
        };
      }
    }
    return { write: null, notify: null, inspected };
  }

  return {
    kind: "capacitor-ble",
    async scan() {
      const ble = plugin();
      await ble.initialize({ androidNeverForLocation: true });
      if (typeof ble.isEnabled === "function") {
        const enabled = await ble.isEnabled();
        if (enabled && enabled.value === false) {
          throw new Error("Bluetooth is off. Turn Bluetooth on, then tap Connect Scanner again.");
        }
      }
      const device = await ble.requestDevice(buildRequestDeviceOptions());
      deviceId = device.deviceId || device.device?.deviceId || device.id;
      deviceName = device.name || device.device?.name || "BLE adapter";
      if (!deviceId) throw new Error("Capacitor BLE chooser returned no deviceId");
      return [{ id: deviceId, name: deviceName, isFixdName: /fixd/i.test(deviceName) }];
    },
    async connect(id) {
      const ble = plugin();
      deviceId = id || deviceId;
      if (!deviceId) throw new Error("No device selected — tap Connect Scanner first.");
      const handle = await ble.addListener("disconnected|" + deviceId, () => {
        connected = false;
        finish(new Error("Scanner disconnected before the vehicle reply was complete."));
        onDisconnect?.();
      });
      notifyHandles.push(handle);
      await ble.connect({ deviceId, timeout: 20000 });
      connected = true;
      const found = await discover(ble);
      lastServices = found.inspected || [];
      this._lastServices = lastServices;
      if (!found.write || !found.notify) {
        const seen = lastServices.map((s) => s.uuid).join(", ") || "(none)";
        throw new Error(
          `Native BLE connected to ${deviceName || deviceId}, but no supported OBD data channel was found. Services: ${seen}`,
        );
      }
      write = {
        service: assertBleUuid(found.write.service, "Write service"),
        characteristic: assertBleUuid(found.write.characteristic, "Write characteristic"),
      };
      notify = {
        service: assertBleUuid(found.notify.service, "Notify service"),
        characteristic: assertBleUuid(found.notify.characteristic, "Notify characteristic"),
      };
      const writeProps = found.write.properties || {};
      const notifyProps = found.notify.properties || {};
      if (writeProps.writeWithoutResponse) writeMode = "writeWithoutResponse";
      else if (writeProps.write) writeMode = "write";
      else {
        throw new Error("Write characteristic does not allow write or write-without-response.");
      }
      if (!notifyProps.notify && !notifyProps.indicate) {
        throw new Error("Notify characteristic does not support notifications.");
      }
      if (typeof ble.addListener === "function") {
        for (const key of notificationEventKeys(deviceId, notify.service, notify.characteristic)) {
          const handle = await ble.addListener(key, (event) => {
            onValue(event?.value ?? event);
          });
          if (handle) notifyHandles.push(handle);
        }
      }
      await ble.startNotifications({
        deviceId,
        service: notify.service,
        characteristic: notify.characteristic,
      });
    },
    async inspectServices() {
      return lastServices;
    },
    async send(cmd, options = {}) {
      const allowed = assertAllowedObdCommand(cmd);
      const target = deviceId;
      const ble = plugin();
      const value = textToBleHex(allowed + "\r");
      const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 12000;
      const run = () => new Promise((resolve, reject) => {
        if (!connected || !write || !target || target !== deviceId) {
          reject(new Error("Scanner disconnected."));
          return;
        }
        const command = { resolve, reject, command: allowed };
        pending = command;
        buffer = "";
        command.timeout = setTimeout(() => {
          if (pending === command) {
            const partial = buffer;
            const extra = partial
              ? " Partial reply:\n" + formatBlePayloadDiagnostic(new TextEncoder().encode(partial), partial)
              : " No bytes were received.";
            finish(new Error("Timed out waiting for a complete scanner reply." + extra));
          }
        }, timeoutMs);
        Promise.resolve().then(() => ble[writeMode]({
          deviceId: target, service: write.service, characteristic: write.characteristic, value,
        })).catch((error) => {
          if (pending === command) finish(error);
        });
      });
      commandChain = commandChain.then(run, run);
      return commandChain;
    },
    async disconnect() {
      connected = false;
      finish(new Error("Scanner disconnected."));
      try {
        const ble = plugin();
        for (const handle of notifyHandles) {
          try {
            await handle?.remove?.();
          } catch {
            /* listener already gone */
          }
        }
        notifyHandles = [];
        if (deviceId && notify) {
          await ble.stopNotifications({
            deviceId,
            service: notify.service,
            characteristic: notify.characteristic,
          }).catch(() => {});
        }
        if (deviceId) await ble.disconnect({ deviceId }).catch(() => {});
      } finally {
        deviceId = null;
        write = null;
        notify = null;
        writeMode = "writeWithoutResponse";
        lastServices = [];
      }
    },
  };
}
