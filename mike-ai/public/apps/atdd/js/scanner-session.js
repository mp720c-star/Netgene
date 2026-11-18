/**
 * Scanner session state machine for ATDD Connect Scanner.
 * Works with a transport adapter:
 *  - Capacitor BLE (iOS) when imported project is present
 *  - Web Bluetooth (browser)
 *  - Simulated (MUST be labeled; never shown as real)
 */

import { buildProbeReport, ELM_PROBE_SEQUENCE, nameLooksLikeFixd } from "./fixd-protocol-probe.js";
import { parseMode03FrameAware } from "./obd-protocol-v3-frame-aware.js";

export function createScannerSession(transport) {
  const state = {
    status: "idle", // idle|scanning|connecting|connected|probing|ready|error|disconnected
    devices: [],
    selected: null,
    services: [],
    transcript: "",
    lastError: null,
    lastProbe: null,
    lastDtcs: null,
    provenance: transport?.kind || "unknown"
  };

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn({ ...state }));

  return {
    getState: () => ({ ...state }),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async scan(options = {}) {
      state.status = "scanning";
      state.lastError = null;
      emit();
      try {
        state.devices = await transport.scan(options);
        state.status = "idle";
        emit();
        return state.devices;
      } catch (err) {
        state.status = "error";
        state.lastError = err.message || String(err);
        emit();
        throw err;
      }
    },

    async connect(deviceId) {
      state.status = "connecting";
      state.lastError = null;
      emit();
      try {
        const device = state.devices.find((d) => d.id === deviceId) || { id: deviceId };
        state.selected = device;
        await transport.connect(deviceId);
        state.services = (await transport.inspectServices?.()) || [];
        state.status = "connected";
        state.provenance = transport.kind;
        emit();
        return state.selected;
      } catch (err) {
        state.status = "error";
        state.lastError = err.message || String(err);
        emit();
        throw err;
      }
    },

    async disconnect() {
      try {
        await transport.disconnect?.();
      } finally {
        state.status = "disconnected";
        state.selected = null;
        state.services = [];
        emit();
      }
    },

    async probeProtocol() {
      if (!["connected", "ready", "probing"].includes(state.status)) {
        throw new Error("Not connected");
      }
      state.status = "probing";
      state.transcript = "";
      emit();
      try {
        for (const cmd of ELM_PROBE_SEQUENCE) {
          const reply = await transport.send(cmd);
          state.transcript += `TX ${cmd}\nRX ${reply}\n`;
        }
        state.lastProbe = buildProbeReport({
          deviceName: state.selected?.name,
          services: state.services,
          transcript: state.transcript,
          connectionState: state.status
        });
        if (nameLooksLikeFixd(state.selected?.name)) {
          state.lastProbe.fixdNameAdvertised = true;
          state.lastProbe.fixdCompatibility = "UNVERIFIED_NAME_MATCH_ONLY";
        }
        state.status = "ready";
        emit();
        return state.lastProbe;
      } catch (err) {
        state.status = "error";
        state.lastError = err.message || String(err);
        emit();
        throw err;
      }
    },

    async readStoredDtcs() {
      if (state.status !== "ready" && state.status !== "connected") {
        throw new Error("Connect and probe before reading DTCs");
      }
      const reply = await transport.send("03");
      state.transcript += `TX 03\nRX ${reply}\n`;
      const provenance = transport.kind === "simulated" ? "simulated" : "live_adapter";
      const parsed = parseMode03FrameAware(reply, { provenance });
      if (parsed.isSimulated) {
        parsed.warning = "SIMULATED — not live vehicle data";
      }
      // Refuse to treat simulated as live
      state.lastDtcs = {
        ...parsed,
        presentedAsLive: provenance !== "simulated"
      };
      emit();
      return state.lastDtcs;
    }
  };
}

/** Simulated transport — always provenance=simulated. */
export function createSimulatedTransport() {
  return {
    kind: "simulated",
    async scan() {
      return [
        { id: "sim-elm", name: "Demo ELM327 (SIMULATED)" },
        { id: "sim-fixd-name", name: "FIXD-NAME-ONLY (SIMULATED — not a protocol proof)" }
      ];
    },
    async connect() {},
    async inspectServices() {
      return [
        {
          uuid: "0000fff0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            { uuid: "0000fff1-0000-1000-8000-00805f9b34fb", properties: { notify: true } },
            { uuid: "0000fff2-0000-1000-8000-00805f9b34fb", properties: { write: true } }
          ]
        }
      ];
    },
    async send(cmd) {
      const c = String(cmd).trim().toUpperCase();
      if (c.startsWith("AT")) return "OK\r>";
      if (c === "0100") return "41 00 BE 1F A8 13\r>";
      if (c === "03") return "43 02 03 01 04 20\r>";
      return "NO DATA\r>";
    },
    async disconnect() {}
  };
}
