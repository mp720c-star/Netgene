import { createScannerSession, createSimulatedTransport } from "./scanner-session.js";
import {
  createWebBluetoothTransport,
  webBluetoothAvailable,
} from "./web-bluetooth-transport.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Mount Connect Scanner controls.
 * Connect Scanner always does something useful:
 *  - Web Bluetooth when the browser can open a chooser
 *  - otherwise a one-click labeled Demo that auto-connects + probes
 * Demo results are always marked SIMULATED — never as live FIXD data.
 */
export function mountScannerUi(root, options = {}) {
  const autoStart = options.autoStart === true;
  let session = null;
  let transportKind = "none";
  let busy = false;

  root.innerHTML = `
    <div class="scanner-ui">
      <p><strong>Connect Scanner</strong> opens a live BLE adapter when Web Bluetooth is available.
        Otherwise it runs a labeled <strong>Demo (SIMULATED)</strong> path so the button still works.
        FIXD protocol support stays <code>UNVERIFIED</code>.</p>
      <p id="btSupport" class="note"></p>
      <div class="row">
        <button type="button" id="connectScannerBtn" class="primary">Connect Scanner</button>
        <button type="button" id="demoBtn" class="ghost">Force Demo (SIMULATED)</button>
        <button type="button" id="probeBtn" class="ghost" disabled>Probe protocol</button>
        <button type="button" id="dtcBtn" class="ghost" disabled>Read DTCs</button>
        <button type="button" id="discBtn" class="ghost" disabled>Disconnect</button>
      </div>
      <p id="scanStatus" class="note">Status: idle</p>
      <ul id="deviceList" class="facts"></ul>
      <pre id="scanOut" class="log"></pre>
    </div>
  `;

  const supportEl = root.querySelector("#btSupport");
  const statusEl = root.querySelector("#scanStatus");
  const listEl = root.querySelector("#deviceList");
  const outEl = root.querySelector("#scanOut");
  const connectBtn = root.querySelector("#connectScannerBtn");
  const demoBtn = root.querySelector("#demoBtn");
  const probeBtn = root.querySelector("#probeBtn");
  const dtcBtn = root.querySelector("#dtcBtn");
  const discBtn = root.querySelector("#discBtn");

  const bleOk = webBluetoothAvailable();
  supportEl.textContent = bleOk
    ? "Web Bluetooth available. Connect Scanner will open the system device chooser. If you cancel, a labeled Demo runs instead."
    : "Web Bluetooth not available here (common on iPhone Safari). Connect Scanner will run Demo (SIMULATED) so the control still works.";

  function setBusy(next) {
    busy = next;
    connectBtn.disabled = busy;
    demoBtn.disabled = busy;
  }

  function bindSession(nextSession) {
    session = nextSession;
    session.subscribe((s) => {
      const sim = s.provenance === "simulated" ? " (SIMULATED transport)" : "";
      const ble = s.provenance === "web-bluetooth" ? " (Web Bluetooth)" : "";
      statusEl.textContent = `Status: ${s.status}${s.lastError ? " — " + s.lastError : ""}${sim}${ble}`;
      const linked = ["connected", "ready", "probing"].includes(s.status);
      probeBtn.disabled = !linked;
      dtcBtn.disabled = !linked;
      discBtn.disabled = !s.selected;
      if (!busy) {
        connectBtn.disabled = linked;
        demoBtn.disabled = linked;
      }
    });
  }

  function renderDevices(devices, { autoConnectId } = {}) {
    listEl.innerHTML = devices
      .map(
        (d) =>
          `<li><button type="button" data-id="${escapeHtml(d.id)}">Connect: ${escapeHtml(d.name)}</button></li>`,
      )
      .join("");
    listEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        void connectDevice(btn.getAttribute("data-id"));
      });
    });
    if (autoConnectId) {
      return connectDevice(autoConnectId);
    }
    return null;
  }

  async function connectDevice(deviceId) {
    try {
      await session.connect(deviceId);
      const sim = transportKind === "simulated";
      outEl.textContent = sim
        ? "Connected to SIMULATED adapter.\nProbe protocol runs next. Results stay labeled SIMULATED — not live FIXD/vehicle data.\n"
        : `Connected via Web Bluetooth (${deviceId}).\nProbe protocol before claiming FIXD/ELM compatibility (FIXD remains UNVERIFIED).\n`;
      if (sim || options.autoProbe !== false) {
        const report = await session.probeProtocol();
        outEl.textContent =
          (sim
            ? "⚠ DEMO PROBE COMPLETE (SIMULATED)\n"
            : "Probe complete (FIXD still UNVERIFIED)\n") +
          JSON.stringify(report, null, 2);
      }
    } catch (err) {
      outEl.textContent = `Connect/probe failed: ${err.message || err}\n`;
      throw err;
    }
  }

  async function startDemo({ reason = "manual" } = {}) {
    transportKind = "simulated";
    bindSession(createScannerSession(createSimulatedTransport()));
    outEl.textContent =
      reason === "fallback-no-ble"
        ? "No Web Bluetooth in this browser. Running Demo Scanner (SIMULATED)…\n"
        : reason === "fallback-ble-failed"
          ? "Live Bluetooth connect failed/cancelled. Falling back to Demo Scanner (SIMULATED)…\n"
          : "Demo transport armed (SIMULATED). Connecting demo adapter…\n";
    const devices = await session.scan();
    await renderDevices(devices, { autoConnectId: "sim-elm" });
  }

  async function startBle() {
    transportKind = "web-bluetooth";
    const transport = createWebBluetoothTransport();
    bindSession(createScannerSession(transport));
    outEl.textContent = "Opening Bluetooth device chooser…\n";
    listEl.innerHTML = "";
    const devices = await session.scan();
    listEl.innerHTML = devices
      .map(
        (d) =>
          `<li><button type="button" data-id="${escapeHtml(d.id)}" class="primary">Connect: ${escapeHtml(d.name || d.id)}</button></li>`,
      )
      .join("");
    const chosen = devices[0];
    if (!chosen) throw new Error("No Bluetooth device selected");
    await connectDevice(chosen.id);
  }

  /** Primary control: always succeeds with either live BLE or labeled demo. */
  async function startConnect() {
    if (busy) return;
    setBusy(true);
    try {
      if (bleOk) {
        try {
          await startBle();
          return;
        } catch (err) {
          const msg = err?.message || String(err);
          outEl.textContent = `Live Connect Scanner failed: ${msg}\n`;
          await startDemo({ reason: "fallback-ble-failed" });
          return;
        }
      }
      await startDemo({ reason: "fallback-no-ble" });
    } finally {
      setBusy(false);
    }
  }

  connectBtn.addEventListener("click", () => {
    void startConnect();
  });
  demoBtn.addEventListener("click", async () => {
    if (busy) return;
    setBusy(true);
    try {
      await startDemo({ reason: "manual" });
    } finally {
      setBusy(false);
    }
  });

  probeBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const report = await session.probeProtocol();
      const banner =
        transportKind === "simulated"
          ? "⚠ DEMO PROBE (SIMULATED)\n"
          : "Probe report (FIXD still UNVERIFIED)\n";
      outEl.textContent = banner + JSON.stringify(report, null, 2);
    } catch (err) {
      outEl.textContent = `Probe failed: ${err.message || err}\n`;
    }
  });

  dtcBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const dtcs = await session.readStoredDtcs();
      const banner =
        dtcs.isSimulated || transportKind === "simulated"
          ? "⚠ SIMULATED RESULTS — not live FIXD/vehicle data\n"
          : "Adapter payload (FIXD claim still UNVERIFIED)\n";
      outEl.textContent = banner + JSON.stringify(dtcs, null, 2);
    } catch (err) {
      outEl.textContent = `Read DTCs failed: ${err.message || err}\n`;
    }
  });

  discBtn.addEventListener("click", async () => {
    if (!session) return;
    await session.disconnect();
    connectBtn.disabled = false;
    demoBtn.disabled = false;
    outEl.textContent += "\nDisconnected.\n";
  });

  if (autoStart) void startConnect();
}
