/**
 * Web Bluetooth transport for ATDD live Connect Scanner (FIXD / ELM-class adapters).
 * Connection = GATT link + UART-like write/notify chars.
 * FIXD application protocol claim is PARTIAL: Sierra Mode 03 owner-confirmed; EBCM/live DID still fail-closed.
 */

import { CANDIDATE_GATT_PROFILES } from "./fixd-protocol-probe.js";

/** Services we may open after the chooser. Chrome only exposes listed optionalServices. */
export const OPTIONAL_SERVICES = [
  0xfff0,
  0xffe0,
  0x18f0,
  0x1800, // Generic Access
  0x180a, // Device Information
  0x180f, // Battery
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
  "00001800-0000-1000-8000-00805f9b34fb",
  "0000180a-0000-1000-8000-00805f9b34fb",
  "0000180f-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  // Extra short-form clones often seen on cheap OBD dongles
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ff10-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000aaa0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
];

const WRITE_HINTS = ["fff2", "ffe1", "6e400002", "2af1", "ff02", "ae01", "aaa1"];
const NOTIFY_HINTS = ["fff1", "ffe1", "6e400003", "2af0", "ff01", "ae02", "aaa2"];

function normalizeUuid(uuid) {
  return String(uuid).toLowerCase().replace(/-/g, "");
}

export function pickCharacteristics(characteristics) {
  let write = null;
  let notify = null;
  for (const ch of characteristics) {
    const id = normalizeUuid(ch.uuid);
    const props = ch.properties || {};
    if (
      !write &&
      WRITE_HINTS.some((h) => id.includes(h)) &&
      (props.write || props.writeWithoutResponse)
    ) {
      write = ch;
    }
    if (!notify && NOTIFY_HINTS.some((h) => id.includes(h)) && (props.notify || props.indicate)) {
      notify = ch;
    }
  }
  if (!write) {
    write =
      characteristics.find((c) => c.properties?.write || c.properties?.writeWithoutResponse) ||
      null;
  }
  if (!notify) {
    notify =
      characteristics.find((c) => c.properties?.notify || c.properties?.indicate) || null;
  }
  return { write, notify };
}

export function webBluetoothAvailable() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth?.requestDevice;
}

export function webBluetoothBlockReason() {
  if (typeof navigator === "undefined") return "No browser environment.";
  const ua = navigator.userAgent || "";
  const isiOS = /iPhone|iPad|iPod/i.test(ua);
  if (isiOS) {
    return "This iPhone screen cannot use Web Bluetooth. Open the ATDD Connect app and tap Connect Scanner.";
  }
  if (!navigator.bluetooth?.requestDevice) {
    return "This browser has no Web Bluetooth. Use Chrome or Edge over HTTPS (or localhost).";
  }
  if (!window.isSecureContext) {
    return "Web Bluetooth requires HTTPS (or localhost). This page is not a secure context.";
  }
  return null;
}

function describeBleError(err) {
  const name = err?.name || "";
  const msg = err?.message || String(err);
  if (name === "NotFoundError" || /no.*device|chooser.*cancel|user cancelled/i.test(msg)) {
    return "No adapter selected (chooser closed). Keep FIXD powered/plugged in, then tap Connect FIXD again and pick the FIXD device.";
  }
  if (name === "SecurityError") {
    return "Browser blocked Bluetooth (needs HTTPS + user gesture). Reload over HTTPS and tap Connect FIXD again.";
  }
  if (name === "NetworkError" || /gatt|connect/i.test(msg)) {
    return `Bluetooth link failed: ${msg}. Unplug/replug FIXD, forget it in system Bluetooth settings, then retry.`;
  }
  return msg;
}

/**
 * Create a live Web Bluetooth transport aimed at FIXD-named and ELM-class adapters.
 */
export function createWebBluetoothTransport() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let device = null;
  let server = null;
  let writeChar = null;
  let notifyChar = null;
  let buffer = "";
  let pendingResolve = null;
  let pendingReject = null;
  let responseTimer = null;
  let commandChain = Promise.resolve();
  let lastServices = [];

  function onNotify(event) {
    buffer += decoder.decode(event.target.value);
    // ELM-style prompt; also accept bare responses ending with newline after short idle via timeout.
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

  function recordService(service, chars) {
    return {
      uuid: service.uuid,
      characteristics: chars.map((c) => ({
        uuid: c.uuid,
        properties: {
          notify: !!c.properties?.notify,
          indicate: !!c.properties?.indicate,
          write: !!c.properties?.write,
          writeWithoutResponse: !!c.properties?.writeWithoutResponse,
        },
      })),
    };
  }

  async function tryService(gattServer, uuid) {
    try {
      const service = await gattServer.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      return { service, chars };
    } catch {
      return null;
    }
  }

  async function discoverChars(gattServer) {
    const inspected = [];
    // 1) Known candidate profiles first (includes 18f0 / fff0 / ffe0 / Nordic UART).
    for (const profile of CANDIDATE_GATT_PROFILES) {
      const hit = await tryService(gattServer, profile.service);
      if (!hit) continue;
      inspected.push(recordService(hit.service, hit.chars));
      const picked = pickCharacteristics(hit.chars);
      if (picked.write && picked.notify) {
        return { ...picked, inspected };
      }
    }
    // 2) Any other optional service we declared.
    for (const uuid of OPTIONAL_SERVICES) {
      if (typeof uuid === "number") continue;
      if (CANDIDATE_GATT_PROFILES.some((p) => p.service === uuid)) continue;
      const hit = await tryService(gattServer, uuid);
      if (!hit) continue;
      inspected.push(recordService(hit.service, hit.chars));
      const picked = pickCharacteristics(hit.chars);
      if (picked.write && picked.notify) {
        return { ...picked, inspected };
      }
    }
    // 3) Enumerate whatever Chrome exposes.
    try {
      const services = await gattServer.getPrimaryServices();
      for (const service of services) {
        if (inspected.some((s) => s.uuid === service.uuid)) continue;
        let chars;
        try {
          chars = await service.getCharacteristics();
        } catch {
          continue;
        }
        inspected.push(recordService(service, chars));
        const picked = pickCharacteristics(chars);
        if (picked.write && picked.notify) {
          return { ...picked, inspected };
        }
      }
    } catch {
      /* ignore — optionalServices may restrict enumeration */
    }
    return { write: null, notify: null, inspected };
  }

  async function openChooser({ preferFixdName } = { preferFixdName: true }) {
    const block = webBluetoothBlockReason();
    if (block) throw new Error(block);

    const optionalServices = OPTIONAL_SERVICES;
    // Prefer FIXD-named devices so the chooser surfaces the real scanner first.
    if (preferFixdName) {
      try {
        return await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: "FIXD" },
            { namePrefix: "Fixd" },
            { namePrefix: "fixd" },
            { namePrefix: "OBD" },
            { namePrefix: "ELM" },
            { namePrefix: "V-LINK" },
            { namePrefix: "VLINK" },
            { namePrefix: "VEEPEAK" },
          ],
          optionalServices,
        });
      } catch (err) {
        // Fall through to accept-all if nothing matched those names.
        if (err?.name !== "NotFoundError") throw err;
      }
    }
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices,
    });
  }

  return {
    kind: "web-bluetooth",
    async scan(options = {}) {
      try {
        device = await openChooser({ preferFixdName: options.preferFixdName !== false });
      } catch (err) {
        throw new Error(describeBleError(err));
      }
      const name = device.name || "BLE adapter";
      return [{ id: device.id, name, isFixdName: /fixd/i.test(name) }];
    },
    async connect(_deviceId) {
      if (!device) throw new Error("No device selected — tap Connect FIXD first.");
      device.addEventListener("gattserverdisconnected", () => {
        server = null;
        writeChar = null;
        notifyChar = null;
      });
      try {
        server = await device.gatt.connect();
      } catch (err) {
        throw new Error(describeBleError(err));
      }
      const found = await discoverChars(server);
      lastServices = found.inspected || [];
      this._lastServices = lastServices;
      if (!found.write || !found.notify) {
        const seen = lastServices.map((s) => s.uuid).join(", ") || "(none visible)";
        throw new Error(
          `GATT connected to ${device.name || device.id}, but no write/notify UART characteristics were found. Visible services: ${seen}. If this is a FIXD unit with a private service UUID, Web Bluetooth cannot talk to it until that UUID is known — native iOS BLE may still work.`,
        );
      }
      writeChar = found.write;
      notifyChar = found.notify;
      await notifyChar.startNotifications();
      notifyChar.addEventListener("characteristicvaluechanged", onNotify);
    },
    async inspectServices() {
      return lastServices;
    },
    async send(cmd) {
      if (!writeChar) throw new Error("Not connected");
      const payload = `${String(cmd).trim()}\r`;
      const run = () =>
        new Promise((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
          buffer = "";
          const useWithoutResponse = !!writeChar.properties?.writeWithoutResponse;
          const writePromise = useWithoutResponse
            ? writeChar.writeValueWithoutResponse(encoder.encode(payload))
            : writeChar.writeValue(encoder.encode(payload));
          writePromise.catch(reject);
          responseTimer = setTimeout(() => {
            if (pendingReject) {
              // Return whatever arrived — proprietary stacks may not use '>' .
              const partial = buffer;
              buffer = "";
              if (partial) {
                pendingResolve?.(partial);
              } else {
                pendingReject(new Error("Adapter response timeout (no data). FIXD may not speak ELM AT commands."));
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
        if (notifyChar) {
          notifyChar.removeEventListener("characteristicvaluechanged", onNotify);
          await notifyChar.stopNotifications().catch(() => {});
        }
        device?.gatt?.disconnect();
      } finally {
        device = null;
        server = null;
        writeChar = null;
        notifyChar = null;
        lastServices = [];
      }
    },
  };
}
