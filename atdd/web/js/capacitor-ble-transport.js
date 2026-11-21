/**
 * Capacitor BLE transport for native iPhone/Android ATDD Connect FIXD.
 * Uses @capacitor-community/bluetooth-le when running inside the Capacitor shell.
 * FIXD application protocol remains UNVERIFIED.
 */

import { CANDIDATE_GATT_PROFILES } from "./fixd-protocol-probe.js";
import { pickCharacteristics } from "./web-bluetooth-transport.js";

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

/** Bluetooth-base UUIDs are shortened by CBUUID.uuidString, which the plugin uses in event names. */
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

export function bleHexToText(hex) {
  const parts = String(hex || "").trim().split(/\s+/).filter(Boolean);
  const bytes = [];
  for (const part of parts) {
    if (!/^[0-9a-fA-F]{1,2}$/.test(part)) {
      throw new Error("Adapter payload was not BLE hex.");
    }
    bytes.push(parseInt(part, 16));
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
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
export function createCapacitorBleTransport() {
  let deviceId = null;
  let deviceName = null;
  let write = null;
  let notify = null;
  let buffer = "";
  let pendingResolve = null;
  let pendingReject = null;
  let responseTimer = null;
  let commandChain = Promise.resolve();
  let lastServices = [];
  let writeMode = "writeWithoutResponse";
  let notifyHandles = [];
  const decoder = new TextDecoder();

  function onValue(value) {
    // Native plugin delivers space-separated hex. DataView is the web shape.
    let chunk = "";
    if (typeof value === "string") {
      try {
        chunk = bleHexToText(value);
      } catch {
        chunk = value;
      }
    } else if (value?.buffer) {
      chunk = decoder.decode(value);
    } else if (Array.isArray(value)) {
      chunk = decoder.decode(Uint8Array.from(value));
    }
    buffer += chunk;
    if (buffer.includes(">")) {
      const full = buffer;
      buffer = "";
      if (responseTimer) {
        clearTimeout(responseTimer);
        responseTimer = null;
      }
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        pendingReject = null;
        resolve(full);
      }
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
      const normalized = characteristics.map((c) => ({
        uuid: c.uuid || c,
        properties: c.properties || {},
      }));
      const picked = pickCharacteristics(normalized);
      // Guessing notify/write when the plugin omits properties makes iOS throw
      // inside setNotifyValue / writeValue and kills the TestFlight app.
      if (!picked.write || !picked.notify) {
        for (const profile of CANDIDATE_GATT_PROFILES) {
          if (!String(uuid).toLowerCase().includes(profile.service.slice(4, 8))) continue;
          const writeChar = normalized.find((c) =>
            String(c.uuid).toLowerCase().includes(profile.write.slice(-8).replace("-", "")),
          );
          const notifyChar = normalized.find((c) =>
            String(c.uuid).toLowerCase().includes(profile.notify.slice(-8).replace("-", "")),
          );
          const wp = writeChar?.properties || {};
          const np = notifyChar?.properties || {};
          const writable = wp.write || wp.writeWithoutResponse;
          const notifiable = np.notify || np.indicate;
          if (writeChar && notifyChar && writable && notifiable) {
            return {
              write: { service: uuid, characteristic: writeChar.uuid, properties: wp },
              notify: { service: uuid, characteristic: notifyChar.uuid, properties: np },
              inspected,
            };
          }
        }
      } else {
        return {
          write: {
            service: uuid,
            characteristic: picked.write.uuid,
            properties: picked.write.properties || {},
          },
          notify: {
            service: uuid,
            characteristic: picked.notify.uuid,
            properties: picked.notify.properties || {},
          },
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
      await ble.connect({ deviceId, timeout: 20000 });
      const found = await discover(ble);
      lastServices = found.inspected || [];
      this._lastServices = lastServices;
      if (!found.write || !found.notify) {
        const seen = lastServices.map((s) => s.uuid).join(", ") || "(none)";
        throw new Error(
          `Native BLE connected to ${deviceName || deviceId}, but no UART write/notify characteristics found. Services: ${seen}`,
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
      notifyHandles = [];
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
    async send(cmd) {
      if (!write || !deviceId) throw new Error("Not connected");
      const ble = plugin();
      const value = textToBleHex(`${String(cmd).trim()}\r`);
      const writeCall = writeMode === "write" ? ble.write.bind(ble) : ble.writeWithoutResponse.bind(ble);
      const run = () =>
        new Promise((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
          buffer = "";
          writeCall({
            deviceId,
            service: write.service,
            characteristic: write.characteristic,
            value,
          }).catch(reject);
          responseTimer = setTimeout(() => {
            if (pendingReject) {
              const partial = buffer;
              buffer = "";
              if (partial) pendingResolve?.(partial);
              else {
                pendingReject(
                  new Error("Adapter response timeout (no data). FIXD may not speak ELM AT commands."),
                );
              }
              pendingResolve = null;
              pendingReject = null;
            }
          }, 8000);
        });
      commandChain = commandChain.then(run, run);
      return commandChain;
    },
    async disconnect() {
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
