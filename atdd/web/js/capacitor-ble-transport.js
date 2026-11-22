/**
 * Native BLE UART transport. A GATT link is not proof of vehicle communication.
 * Vehicle requests remain limited to Mode 01 and Mode 03.
 */
import { CANDIDATE_GATT_PROFILES } from "./fixd-protocol-probe.js";
import { assertAllowedObdCommand } from "./obd-command-guard.js";

function getCapacitor() {
  return typeof window !== "undefined" ? window.Capacitor : null;
}

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
  if (!ble) throw new Error("Native Bluetooth is unavailable in this copy of ATDD.");
  return ble;
}

const BLE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function assertBleUuid(uuid, label) {
  const value = String(uuid || "").trim().toLowerCase();
  if (!BLE_UUID_RE.test(value)) throw new Error((label || "UUID") + " is not a 128-bit Bluetooth UUID.");
  return value;
}

export function expandBleUuid(uuid) {
  let value = String(uuid || "").trim().toLowerCase();
  if (/^[0-9a-f]{4}$/.test(value)) value = "0000" + value + "-0000-1000-8000-00805f9b34fb";
  else if (/^[0-9a-f]{8}$/.test(value)) value += "-0000-1000-8000-00805f9b34fb";
  return assertBleUuid(value);
}

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
  const keys = ["notification|" + id + "|" + svc + "|" + chr];
  const shortSvc = shortBluetoothUuid(svc);
  const shortChr = shortBluetoothUuid(chr);
  if (shortSvc !== svc || shortChr !== chr) keys.push("notification|" + id + "|" + shortSvc + "|" + shortChr);
  return keys;
}

export function textToBleHex(text) {
  return Array.from(new TextEncoder().encode(String(text)), (b) => b.toString(16).padStart(2, "0")).join(" ");
}

export function bleHexToText(hex) {
  const parts = String(hex || "").trim().split(/\s+/).filter(Boolean);
  const bytes = [];
  for (const part of parts) {
    if (!/^[0-9a-fA-F]+$/.test(part) || (part.length > 2 && part.length % 2 !== 0)) {
      throw new Error("Adapter payload was not BLE hex.");
    }
    if (part.length <= 2) bytes.push(parseInt(part, 16));
    else for (let i = 0; i < part.length; i += 2) bytes.push(parseInt(part.slice(i, i + 2), 16));
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

// Native iOS scans all devices without a present-but-empty services array.
export function buildRequestDeviceOptions() {
  return {};
}

const canWrite = (c) => Boolean(c.properties.write || c.properties.writeWithoutResponse);
const canNotify = (c) => Boolean(c.properties.notify || c.properties.indicate);

/** Inspect every service before choosing a channel; service order is arbitrary. */
export function selectNativeBleChannel(services, requireKnownProfile = false) {
  const inspected = services.map((svc) => ({
    uuid: expandBleUuid(svc.uuid),
    characteristics: (svc.characteristics || []).map((c) => ({
      uuid: expandBleUuid(c.uuid),
      properties: c.properties || {},
    })),
  }));
  for (const profile of CANDIDATE_GATT_PROFILES) {
    const svc = inspected.find((s) => s.uuid === profile.service);
    if (!svc) continue;
    const write = svc.characteristics.find((c) => c.uuid === profile.write && canWrite(c));
    const notify = svc.characteristics.find((c) => c.uuid === profile.notify && canNotify(c));
    if (write && notify) return {
      write: { ...write, service: svc.uuid },
      notify: { ...notify, service: svc.uuid },
      profile: profile.id,
      inspected,
    };
  }
  if (!requireKnownProfile) {
    // A single unambiguous custom UART can be tried. Do not guess between control
    // and serial channels, or between unrelated services on the same device.
    const candidates = inspected.filter((svc) => !/^000018[0-9a-f]{2}-0000-1000-8000-00805f9b34fb$/.test(svc.uuid))
      .flatMap((svc) => {
        const writes = svc.characteristics.filter(canWrite);
        const notifications = svc.characteristics.filter(canNotify);
        return writes.length === 1 && notifications.length === 1
          ? [{ write: { ...writes[0], service: svc.uuid }, notify: { ...notifications[0], service: svc.uuid } }]
          : [];
      });
    if (candidates.length === 1) return { ...candidates[0], profile: "custom-uart", inspected };
    if (candidates.length > 1) return { write: null, notify: null, profile: null, inspected, reason: "This scanner exposes multiple Bluetooth data channels. Its protocol needs a specific adapter profile." };
  }
  return { write: null, notify: null, profile: null, inspected };
}

// Adapter-only configuration, separate from the ECU request allowlist.
// No reset, programmable-parameter commands, arbitrary AT commands, or clearing.
export function assertAllowedAdapterSetupCommand(command) {
  const value = String(command ?? "").trim().toUpperCase();
  if (!["ATI", "ATE0", "ATL0", "ATS1", "ATH0", "ATSP0"].includes(value)) {
    throw new Error("Blocked: this adapter setup command is not allowed.");
  }
  return value;
}

export function createCapacitorBleTransport({
  onDisconnect,
  requireKnownProfile = false,
  replyTimeoutMs = 30000,
  setupTimeoutMs = 8000,
} = {}) {
  let deviceId = null;
  let deviceName = null;
  let write = null;
  let notify = null;
  let pending = null;
  let connected = false;
  let generation = 0;
  let commandChain = Promise.resolve();
  let lastServices = [];
  let selectedProfile = null;
  let writeMode = "write";
  let handles = [];
  let subscribed = false;
  let adapterIdentified = false;

  function finish(error, reply) {
    if (!pending) return;
    const command = pending;
    pending = null;
    clearTimeout(command.timeout);
    if (error) command.reject(error);
    else command.resolve(reply);
  }

  function onValue(value, session) {
    if (!pending || session !== generation) return;
    try {
      if (typeof value === "string") pending.buffer += bleHexToText(value);
      else if (ArrayBuffer.isView(value)) pending.buffer += new TextDecoder().decode(value);
      else if (Array.isArray(value)) pending.buffer += new TextDecoder().decode(Uint8Array.from(value));
      else throw new Error("Unexpected Bluetooth notification.");
      if (pending.buffer.length > 32768) throw new Error("Scanner reply exceeded the receive buffer.");
      if (pending.buffer.includes(">")) finish(null, pending.buffer);
    } catch (error) {
      finish(error);
    }
  }

  function transact(command, timeoutMs) {
    const target = deviceId;
    const session = generation;
    const run = () => new Promise((resolve, reject) => {
      if (!connected || !write || !subscribed || !target || target !== deviceId || session !== generation) {
        reject(new Error("Scanner disconnected."));
        return;
      }
      const current = { resolve, reject, buffer: "" };
      pending = current;
      current.timeout = setTimeout(() => {
        if (pending !== current) return;
        finish(new Error("Timed out waiting for the scanner's complete reply. Check ignition power and close other scanner apps."));
        // A late prompt must not be mistaken for the next command's response.
        void transport.disconnect().then(() => onDisconnect?.()).catch(() => {});
      }, timeoutMs);
      Promise.resolve().then(() => plugin()[writeMode]({
        deviceId: target,
        service: write.service,
        characteristic: write.uuid,
        value: textToBleHex(command + "\r"),
      })).catch((error) => {
        if (pending === current) finish(error);
      });
    });
    const result = commandChain.then(run, run);
    // Keep the queue usable after errors without an unhandled rejected tail.
    commandChain = result.catch(() => {});
    return result;
  }

  const transport = {
    kind: "capacitor-ble",
    async scan() {
      const ble = plugin();
      await ble.initialize({ androidNeverForLocation: true });
      if (typeof ble.isEnabled === "function") {
        const enabled = await ble.isEnabled();
        if (enabled === false || enabled?.value === false) throw new Error("Bluetooth is off. Turn it on, then tap Connect Scanner again.");
      }
      const selected = await ble.requestDevice(buildRequestDeviceOptions());
      deviceId = selected.deviceId || selected.device?.deviceId || selected.id;
      deviceName = selected.name || selected.device?.name || "BLE adapter";
      if (!deviceId) throw new Error("No scanner was selected.");
      return [{ id: deviceId, name: deviceName, isFixdName: /fixd/i.test(deviceName) }];
    },
    async connect(id) {
      if (connected || handles.length) throw new Error("Disconnect the current scanner before reconnecting.");
      const ble = plugin();
      deviceId = id || deviceId;
      if (!deviceId) throw new Error("Choose a scanner first.");
      const session = ++generation;
      try {
        const handle = await ble.addListener("disconnected|" + deviceId, () => {
          if (session !== generation) return;
          connected = false;
          adapterIdentified = false;
          finish(new Error("Scanner disconnected before the vehicle reply was complete."));
          onDisconnect?.();
        });
        handles.push(handle);
        await ble.connect({ deviceId, timeout: 20000 });
        if (session !== generation) throw new Error("Scanner connection was cancelled.");
        connected = true;
        const result = await ble.getServices({ deviceId });
        if (!connected || session !== generation) throw new Error("Scanner disconnected during service discovery.");
        const services = Array.isArray(result) ? result : result?.services;
        if (!Array.isArray(services)) throw new Error("The scanner did not return its Bluetooth services.");
        const found = selectNativeBleChannel(services, requireKnownProfile);
        lastServices = found.inspected;
        selectedProfile = found.profile;
        if (!found.write || !found.notify) throw new Error(found.reason || "No supported scanner data channel was found. This adapter may use a private protocol or Bluetooth Classic.");
        write = found.write;
        notify = found.notify;
        // Prefer acknowledged writes when offered; no-response-only UARTs still work.
        writeMode = write.properties.write ? "write" : "writeWithoutResponse";
        for (const key of notificationEventKeys(deviceId, notify.service, notify.uuid)) {
          handles.push(await ble.addListener(key, (event) => onValue(event?.value ?? event, session)));
        }
        await ble.startNotifications({ deviceId, service: notify.service, characteristic: notify.uuid });
        if (!connected || session !== generation) throw new Error("Scanner disconnected while enabling replies.");
        subscribed = true;
      } catch (error) {
        await transport.disconnect();
        throw error;
      }
    },
    async inspectServices() {
      return lastServices;
    },
    connectionInfo() {
      return { deviceName, profile: selectedProfile, connected, adapterIdentified, services: lastServices };
    },
    async identifyAdapter() {
      const session = generation;
      const reply = await transact("ATI", setupTimeoutMs);
      if (!connected || session !== generation) throw new Error("Scanner disconnected during identification.");
      // Only an actual identification reply enables ELM configuration.
      const identity = String(reply).replace(/ATI/gi, "").replace(/>/g, "").trim();
      adapterIdentified = /\b(?:ELM327|STN[0-9]+|OBDLINK|VLINKER)\b/i.test(identity);
      if (!adapterIdentified) throw new Error("The scanner did not identify as an ELM-compatible adapter. Its private protocol is not supported by this connection.");
      return identity;
    },
    async configureAdapter(command) {
      const allowed = assertAllowedAdapterSetupCommand(command);
      if (allowed === "ATI") return transport.identifyAdapter();
      if (!adapterIdentified) throw new Error("Identify the ELM adapter before changing its connection settings.");
      return transact(allowed, setupTimeoutMs);
    },
    async send(command) {
      return transact(assertAllowedObdCommand(command), replyTimeoutMs);
    },
    async disconnect() {
      const ble = plugin();
      const previousId = deviceId;
      const previousNotify = notify;
      const previousHandles = handles;
      const wasSubscribed = subscribed;
      generation++;
      connected = false;
      subscribed = false;
      adapterIdentified = false;
      finish(new Error("Scanner disconnected."));
      handles = [];
      deviceId = null;
      write = null;
      notify = null;
      try {
        for (const handle of previousHandles) {
          try { await handle?.remove?.(); } catch { /* already removed */ }
        }
        if (previousId && previousNotify && wasSubscribed) {
          await ble.stopNotifications({
            deviceId: previousId, service: previousNotify.service, characteristic: previousNotify.uuid,
          }).catch(() => {});
        }
        if (previousId) await ble.disconnect({ deviceId: previousId }).catch(() => {});
      } finally {
        writeMode = "write";
      }
    },
  };
  return transport;
}
