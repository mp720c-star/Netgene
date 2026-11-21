/**
 * Wi-Fi OBD-II transport (ELM327-class TCP adapters).
 *
 * Typical adapters open a soft-AP; the phone joins that Wi-Fi network, then
 * this transport opens TCP to host:port (commonly 192.168.0.10:35000).
 *
 * Requires the native Capacitor plugin `ObdWifi` on iOS/Android.
 * Browser/PWA cannot open raw TCP sockets — that path stays unavailable.
 *
 * Does NOT use Bluetooth Classic (unsupported for apps on iOS).
 */

const DEFAULT_HOST = "192.168.0.10";
const DEFAULT_PORT = 35000;

function getCapacitor() {
  return typeof window !== "undefined" ? window.Capacitor : null;
}

export function wifiObdAvailable() {
  const cap = getCapacitor();
  if (!cap?.isNativePlatform?.()) return false;
  return !!(cap.Plugins?.ObdWifi);
}

export function wifiObdBlockReason() {
  const cap = getCapacitor();
  if (!cap?.isNativePlatform?.()) {
    return "Wi-Fi OBD needs the native ATDD Connect app (raw TCP is not available in Safari/Chrome web shells).";
  }
  if (!cap.Plugins?.ObdWifi) {
    return "ObdWifi native plugin missing. Rebuild ATDD Connect with the ObdWifi Swift plugin.";
  }
  return null;
}

/**
 * Live Wi-Fi ELM-class transport via native TCP.
 */
export function createWifiObdTransport(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port || DEFAULT_PORT);
  let connected = false;
  let buffer = "";

  function plugin() {
    const p = getCapacitor()?.Plugins?.ObdWifi;
    if (!p) {
      throw new Error(wifiObdBlockReason() || "ObdWifi unavailable");
    }
    return p;
  }

  return {
    kind: "wifi-obd",
    host,
    port,
    async scan() {
      // Wi-Fi adapters are not discovered over BLE — present the configured endpoint.
      return [
        {
          id: `wifi://${host}:${port}`,
          name: `Wi-Fi OBD ${host}:${port}`,
          transport: "wifi",
          isFixdName: false,
        },
      ];
    },
    async connect(id) {
      const ble = plugin();
      let targetHost = host;
      let targetPort = port;
      if (typeof id === "string" && id.startsWith("wifi://")) {
        try {
          const u = new URL(id);
          targetHost = u.hostname || host;
          targetPort = Number(u.port || port);
        } catch {
          /* keep defaults */
        }
      }
      const result = await ble.connect({ host: targetHost, port: targetPort, timeoutMs: 8000 });
      if (result?.ok === false) {
        throw new Error(result?.message || `Wi-Fi OBD connect failed to ${targetHost}:${targetPort}`);
      }
      connected = true;
      buffer = "";
      this._endpoint = { host: targetHost, port: targetPort };
    },
    async inspectServices() {
      return [
        {
          uuid: "wifi-tcp",
          characteristics: [{ uuid: "elm-ascii", properties: { write: true, notify: true } }],
        },
      ];
    },
    async send(cmd) {
      if (!connected) throw new Error("Wi-Fi OBD not connected");
      const ble = plugin();
      const payload = `${String(cmd).trim()}\r`;
      const result = await ble.send({ data: payload, waitForPrompt: true, timeoutMs: 8000 });
      const reply = result?.data != null ? String(result.data) : "";
      buffer = reply;
      if (!reply) {
        throw new Error("Wi-Fi OBD response timeout (no data). Confirm the phone is on the adapter Wi-Fi and host/port are correct.");
      }
      return reply;
    },
    async disconnect() {
      try {
        const ble = plugin();
        await ble.disconnect().catch(() => {});
      } finally {
        connected = false;
        buffer = "";
      }
    },
  };
}
