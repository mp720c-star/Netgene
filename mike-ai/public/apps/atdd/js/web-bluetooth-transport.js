/**
 * Web Bluetooth transport for ATDD Connect Scanner.
 * Uses common ELM327-clone GATT profiles. FIXD protocol remains UNVERIFIED.
 */

const OPTIONAL_SERVICES = [
  0xfff0,
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  0xffe0,
  "000018f0-0000-1000-8000-00805f9b34fb",
];

const WRITE_HINTS = ["fff2", "ffe1", "6e400002", "2af1"];
const NOTIFY_HINTS = ["fff1", "ffe1", "6e400003", "2af0"];

function normalizeUuid(uuid) {
  return String(uuid).toLowerCase().replace(/-/g, "");
}

function pickCharacteristics(characteristics) {
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

/**
 * Create a live Web Bluetooth transport.
 * scan() opens the system chooser (Web Bluetooth has no silent scan list).
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

  function onNotify(event) {
    buffer += decoder.decode(event.target.value);
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

  async function discoverChars(gattServer) {
    const services = await gattServer.getPrimaryServices();
    const inspected = [];
    for (const service of services) {
      let chars;
      try {
        chars = await service.getCharacteristics();
      } catch {
        continue;
      }
      inspected.push({
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
      });
      const picked = pickCharacteristics(chars);
      if (picked.write && picked.notify) {
        return { ...picked, inspected };
      }
    }
    return { write: null, notify: null, inspected };
  }

  return {
    kind: "web-bluetooth",
    async scan() {
      if (!webBluetoothAvailable()) {
        throw new Error(
          "Web Bluetooth unavailable. Use Chrome/Edge (HTTPS or localhost), or Demo Scanner.",
        );
      }
      // Chooser is the scan UX on Web Bluetooth.
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES,
      });
      return [{ id: device.id, name: device.name || "BLE adapter" }];
    },
    async connect(_deviceId) {
      if (!device) throw new Error("No device selected — tap Connect Scanner first.");
      device.addEventListener("gattserverdisconnected", () => {
        server = null;
        writeChar = null;
        notifyChar = null;
      });
      server = await device.gatt.connect();
      const found = await discoverChars(server);
      if (!found.write || !found.notify) {
        throw new Error("No write/notify UART characteristics found on this adapter.");
      }
      writeChar = found.write;
      notifyChar = found.notify;
      await notifyChar.startNotifications();
      notifyChar.addEventListener("characteristicvaluechanged", onNotify);
      this._lastServices = found.inspected || [];
    },
    async inspectServices() {
      return this._lastServices || [];
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
              pendingReject(new Error("Adapter response timeout"));
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
      }
    },
  };
}
