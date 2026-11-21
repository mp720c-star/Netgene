/**
 * Capacitor BLE transport for native iPhone/Android ATDD Connect FIXD.
 * Uses @capacitor-community/bluetooth-le when running inside the Capacitor shell.
 * FIXD application protocol remains UNVERIFIED.
 */

import { CANDIDATE_GATT_PROFILES } from "./fixd-protocol-probe.js";
import { OPTIONAL_SERVICES, pickCharacteristics } from "./web-bluetooth-transport.js";

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

function toUuidList(list) {
  return (list || [])
    .map((u) => (typeof u === "number" ? u.toString(16).padStart(4, "0") : String(u).toLowerCase()))
    .filter(Boolean);
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
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  function onValue(value) {
    // Plugin may pass base64 or DataView depending on version — normalize to string.
    let chunk = "";
    if (typeof value === "string") {
      try {
        const bin = atob(value);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        chunk = decoder.decode(bytes);
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
          properties: c.properties || {
            notify: true,
            write: true,
            writeWithoutResponse: true,
          },
        })),
      });
      const picked = pickCharacteristics(
        characteristics.map((c) => ({
          uuid: c.uuid || c,
          properties: c.properties || {
            notify: !!c.properties?.notify,
            indicate: !!c.properties?.indicate,
            write: !!c.properties?.write,
            writeWithoutResponse: !!c.properties?.writeWithoutResponse,
          },
        })),
      );
      // If properties missing, fall back to profile hints by UUID.
      if (!picked.write || !picked.notify) {
        for (const profile of CANDIDATE_GATT_PROFILES) {
          if (!String(uuid).toLowerCase().includes(profile.service.slice(4, 8))) continue;
          const writeChar = characteristics.find((c) =>
            String(c.uuid || c).toLowerCase().includes(profile.write.slice(-8).replace("-", "")),
          );
          const notifyChar = characteristics.find((c) =>
            String(c.uuid || c).toLowerCase().includes(profile.notify.slice(-8).replace("-", "")),
          );
          if (writeChar && notifyChar) {
            return {
              write: { service: uuid, characteristic: writeChar.uuid || writeChar },
              notify: { service: uuid, characteristic: notifyChar.uuid || notifyChar },
              inspected,
            };
          }
        }
      } else {
        return {
          write: { service: uuid, characteristic: picked.write.uuid },
          notify: { service: uuid, characteristic: picked.notify.uuid },
          inspected,
        };
      }
    }
    return { write: null, notify: null, inspected };
  }

  return {
    kind: "capacitor-ble",
    async scan(options = {}) {
      const ble = plugin();
      await ble.initialize({ androidNeverForLocation: true });
      const optionalServices = toUuidList(OPTIONAL_SERVICES.filter((u) => typeof u === "string"));
      const services = CANDIDATE_GATT_PROFILES.map((p) => p.service);
      let device;
      try {
        device = await ble.requestDevice({
          services: options.preferFixdName === false ? undefined : undefined,
          optionalServices: [...new Set([...services, ...optionalServices])],
          allowDuplicates: false,
        });
      } catch (err) {
        // Retry with accept-all style (no service filter) if the plugin supports it.
        device = await ble.requestDevice({
          optionalServices: [...new Set([...services, ...optionalServices])],
        });
        if (!device) throw err;
      }
      deviceId = device.deviceId || device.device?.deviceId || device.id;
      deviceName = device.name || device.device?.name || "BLE adapter";
      if (!deviceId) throw new Error("Capacitor BLE chooser returned no deviceId");
      return [{ id: deviceId, name: deviceName, isFixdName: /fixd/i.test(deviceName) }];
    },
    async connect(id) {
      const ble = plugin();
      deviceId = id || deviceId;
      if (!deviceId) throw new Error("No device selected — tap Connect FIXD first.");
      await ble.connect({ deviceId });
      const found = await discover(ble);
      lastServices = found.inspected || [];
      this._lastServices = lastServices;
      if (!found.write || !found.notify) {
        const seen = lastServices.map((s) => s.uuid).join(", ") || "(none)";
        throw new Error(
          `Native BLE connected to ${deviceName || deviceId}, but no UART write/notify characteristics found. Services: ${seen}`,
        );
      }
      write = found.write;
      notify = found.notify;
      await ble.startNotifications(
        {
          deviceId,
          service: notify.service,
          characteristic: notify.characteristic,
        },
        (event) => {
          onValue(event?.value ?? event);
        },
      );
    },
    async inspectServices() {
      return lastServices;
    },
    async send(cmd) {
      if (!write || !deviceId) throw new Error("Not connected");
      const ble = plugin();
      const payload = `${String(cmd).trim()}\r`;
      const bytes = encoder.encode(payload);
      // Plugin expects base64 string for write
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const value = btoa(binary);
      const run = () =>
        new Promise((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
          buffer = "";
          ble
            .write({
              deviceId,
              service: write.service,
              characteristic: write.characteristic,
              value,
            })
            .catch(reject);
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
        lastServices = [];
      }
    },
  };
}
