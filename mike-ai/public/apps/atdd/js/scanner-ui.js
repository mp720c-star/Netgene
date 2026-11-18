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
 * Mount a working Connect Scanner control panel.
 * Primary path: Web Bluetooth when available.
 * Always-available fallback: labeled Demo (SIMULATED) transport — never presented as live.
 */
export function mountScannerUi(root, options = {}) {
  const autoDemo = options.autoDemo === true;
  let session = null;
  let transportKind = "none";

  root.innerHTML = `
    <div class="scanner-ui">
      <p><strong>Connect Scanner</strong> — FIXD protocol support stays <code>UNVERIFIED</code> until a live GATT + Mode 03 round-trip is recorded.</p>
      <p id="btSupport" class="note"></p>
      <div class="row">
        <button type="button" id="connectScannerBtn" class="primary">Connect Scanner</button>
        <button type="button" id="demoBtn" class="ghost">Demo Scanner (SIMULATED)</button>
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
    ? "Web Bluetooth available. Connect Scanner opens the system chooser for ELM327-class BLE adapters. Demo mode is always available and labeled SIMULATED."
    : "Web Bluetooth not available in this browser (need Chrome/Edge on HTTPS or localhost). Use Demo Scanner (SIMULATED) — never shown as live vehicle data.";
  if (!bleOk) connectBtn.disabled = true;

  function bindSession(nextSession) {
    session = nextSession;
    session.subscribe((s) => {
      const sim = s.provenance === "simulated" ? " (SIMULATED transport)" : "";
      const ble = s.provenance === "web-bluetooth" ? " (Web Bluetooth)" : "";
      statusEl.textContent = `Status: ${s.status}${s.lastError ? " — " + s.lastError : ""}${sim}${ble}`;
      probeBtn.disabled = !(s.status === "connected" || s.status === "ready");
      dtcBtn.disabled = !(s.status === "ready" || s.status === "connected");
      discBtn.disabled = !s.selected;
      connectBtn.disabled = !!s.selected && s.status !== "disconnected" && s.status !== "idle" && s.status !== "error";
      if (s.selected && (s.status === "connected" || s.status === "ready" || s.status === "probing")) {
        connectBtn.disabled = true;
        demoBtn.disabled = true;
      } else if (!bleOk) {
        connectBtn.disabled = true;
        demoBtn.disabled = false;
      } else {
        demoBtn.disabled = false;
      }
    });
  }

  async function startDemo() {
    transportKind = "simulated";
    bindSession(createScannerSession(createSimulatedTransport()));
    outEl.textContent = "Demo transport armed (SIMULATED). Scanning demo devices…\n";
    const devices = await session.scan();
    listEl.innerHTML = devices
      .map(
        (d) =>
          `<li><button type="button" data-id="${escapeHtml(d.id)}">Connect: ${escapeHtml(d.name)}</button></li>`,
      )
      .join("");
    listEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await session.connect(btn.getAttribute("data-id"));
          outEl.textContent =
            "Connected to SIMULATED adapter. Probe protocol, then Read DTCs.\nResults are labeled SIMULATED — not live FIXD/vehicle data.\n";
        } catch (err) {
          outEl.textContent = `Connect failed: ${err.message || err}\n`;
        }
      });
    });
  }

  async function startBle() {
    transportKind = "web-bluetooth";
    const transport = createWebBluetoothTransport();
    bindSession(createScannerSession(transport));
    outEl.textContent = "Opening Bluetooth device chooser…\n";
    listEl.innerHTML = "";
    try {
      const devices = await session.scan();
      listEl.innerHTML = devices
        .map(
          (d) =>
            `<li><button type="button" data-id="${escapeHtml(d.id)}" class="primary">Connect: ${escapeHtml(d.name || d.id)}</button></li>`,
        )
        .join("");
      // Auto-connect the chosen device (chooser already selected it).
      const chosen = devices[0];
      if (chosen) {
        await session.connect(chosen.id);
        outEl.textContent = `Connected to ${chosen.name || chosen.id} via Web Bluetooth.\nRun Probe protocol before claiming FIXD/ELM compatibility (FIXD remains UNVERIFIED).\n`;
      }
    } catch (err) {
      const msg = err?.message || String(err);
      outEl.textContent = `Connect Scanner cancelled or failed: ${msg}\nYou can retry or use Demo Scanner (SIMULATED).\n`;
      statusEl.textContent = `Status: error — ${msg}`;
      // Fall back to demo so the button always leads somewhere useful.
      if (/cancel|user cancelled|NotFoundError/i.test(msg)) {
        outEl.textContent += "\nStarting Demo Scanner fallback…\n";
        await startDemo();
      }
    }
  }

  connectBtn.addEventListener("click", () => {
    void startBle();
  });
  demoBtn.addEventListener("click", () => {
    void startDemo();
  });

  probeBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const report = await session.probeProtocol();
      outEl.textContent = JSON.stringify(report, null, 2);
    } catch (err) {
      outEl.textContent = `Probe failed: ${err.message || err}\n`;
    }
  });

  dtcBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const dtcs = await session.readStoredDtcs();
      const banner = dtcs.isSimulated || transportKind === "simulated"
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
    connectBtn.disabled = !bleOk;
    demoBtn.disabled = false;
    outEl.textContent += "\nDisconnected.\n";
  });

  if (autoDemo) void startDemo();
}
