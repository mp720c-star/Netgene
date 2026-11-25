import { createScannerSession } from "./scanner-session.js";
import {
  createWebBluetoothTransport,
  webBluetoothAvailable,
  webBluetoothBlockReason,
} from "./web-bluetooth-transport.js";
import {
  capacitorBleAvailable,
  createCapacitorBleTransport,
} from "./capacitor-ble-transport.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Live FIXD / BLE only. This UI does not invent demo or simulated scan results.
 * A failed live connect does not invent codes.
 */
export function mountScannerUi(root, options = {}) {
  const autoStart = options.autoStart === true;
  let session = null;
  let transportKind = "none";
  let busy = false;

  root.innerHTML = `
    <div class="scanner-ui">
      <p><strong>Connect Scanner</strong> pairs your real <strong>FIXD</strong> over Bluetooth.
        The app does not invent demo or simulated scan results.</p>
      <p id="btSupport" class="note"></p>
      <div id="iphoneInstallGate" class="warn" hidden></div>
      <div class="row">
        <button type="button" id="connectScannerBtn" class="primary">Connect Scanner</button>
        <button type="button" id="scanAllBtn" class="ghost">Scan all BLE devices</button>
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
  const scanAllBtn = root.querySelector("#scanAllBtn");
  const probeBtn = root.querySelector("#probeBtn");
  const dtcBtn = root.querySelector("#dtcBtn");
  const discBtn = root.querySelector("#discBtn");

  const capOk = capacitorBleAvailable();
  const webOk = webBluetoothAvailable();
  const bleOk = capOk || webOk;
  const blockReason = !bleOk ? webBluetoothBlockReason() : null;
  const installGate = root.querySelector("#iphoneInstallGate");
  supportEl.textContent = capOk
    ? "Native Bluetooth ready. Tap Connect Scanner with FIXD powered in the OBD port."
    : webOk
      ? "Web Bluetooth ready. Tap Connect Scanner, pick your FIXD device."
      : blockReason || "Bluetooth unavailable.";
  if (!bleOk) {
    connectBtn.disabled = true;
    scanAllBtn.disabled = true;
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (isiOS && installGate) {
      installGate.hidden = false;
      installGate.textContent =
        "Bluetooth is not available in this screen. Open the ATDD Connect app from the Home Screen or TestFlight, then tap Connect Scanner.";
    }
    outEl.textContent =
      "Live FIXD connect is blocked in this web shell.\n\n" +
      (blockReason || "") +
      "\n\nConnect Scanner cannot reach FIXD until native Bluetooth is available.\n" +
      "No simulated or demo codes are invented.\n";
  }

  function setBusy(next) {
    busy = next;
    if (bleOk) {
      connectBtn.disabled = busy;
      scanAllBtn.disabled = busy;
    }
  }

  function bindSession(nextSession) {
    session = nextSession;
    session.subscribe((s) => {
      const sim = s.provenance === "simulated" ? " (SIMULATED — not FIXD)" : "";
      const ble =
        s.provenance === "web-bluetooth"
          ? " (live Web Bluetooth)"
          : s.provenance === "capacitor-ble"
            ? " (live native Bluetooth)"
            : "";
      statusEl.textContent = `Status: ${s.status}${s.lastError ? " — " + s.lastError : ""}${sim}${ble}`;
      const linked = ["connected", "ready", "probing"].includes(s.status);
      probeBtn.disabled = !linked;
      dtcBtn.disabled = !linked;
      discBtn.disabled = !s.selected;
      if (!busy) {
        if (bleOk) {
          connectBtn.disabled = linked;
          scanAllBtn.disabled = linked;
        }
      }
    });
  }

  async function connectDevice(deviceId) {
    await session.connect(deviceId);
    const state = session.getState();
    const name = state.selected?.name || deviceId;
    outEl.textContent =
      `Live GATT connected to ${name}.\n` +
      `Services discovered: ${(state.services || []).map((s) => s.uuid).join(", ") || "(see probe)"}\n` +
      "Running protocol probe (FIXD claim PARTIAL — Sierra Mode 03 confirmed; EBCM still fail-closed)...\n";
    try {
      const report = await session.probeProtocol();
      outEl.textContent =
        `Live connection established to ${name}.\n` +
        (report.fixdNameAdvertised ? "Device name looks like FIXD. " : "") +
        `fixdCompatibility: ${report.fixdCompatibility}\n` +
        JSON.stringify(report, null, 2);
    } catch (err) {
      outEl.textContent =
        `GATT is connected to ${name}, but protocol probe failed: ${err.message || err}\n` +
        "The radio link worked; FIXD may not speak ELM AT commands. Connection is still live — try Read DTCs or Disconnect.\n";
    }
  }

  async function startLive({ preferFixdName = true } = {}) {
    if (!bleOk) {
      outEl.textContent =
        "Cannot connect FIXD here.\n" + (blockReason || "Bluetooth unavailable.") + "\n";
      statusEl.textContent = "Status: blocked — no Bluetooth API";
      return;
    }
    const transport = capOk ? createCapacitorBleTransport() : createWebBluetoothTransport();
    transportKind = transport.kind;
    bindSession(createScannerSession(transport));
    outEl.textContent = capOk
      ? "Opening native Bluetooth chooser for FIXD…\nPower the FIXD in the vehicle OBD port, then select it.\n"
      : preferFixdName
        ? "Opening Web Bluetooth chooser (FIXD / OBD named devices first)…\nPower the FIXD in the vehicle OBD port, then select it.\n"
        : "Opening Web Bluetooth chooser (all BLE devices)…\nSelect your FIXD adapter.\n";
    listEl.innerHTML = "";
    // Live path only: a failed connect does not invent codes.
    const devices = await session.scan({ preferFixdName });
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

  async function run(fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      const msg = err?.message || String(err);
      outEl.textContent = `FIXD/live connect failed:\n${msg}\n\nNo codes were invented. Fix the Bluetooth issue above, then tap Connect Scanner again.\n`;
      statusEl.textContent = `Status: error — ${msg}`;
    } finally {
      setBusy(false);
    }
  }

  connectBtn.addEventListener("click", () => {
    void run(() => startLive({ preferFixdName: true }));
  });
  scanAllBtn.addEventListener("click", () => {
    void run(() => startLive({ preferFixdName: false }));
  });
  probeBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const report = await session.probeProtocol();
      const banner = "Live probe (FIXD protocol claim PARTIAL)\n";
      outEl.textContent = banner + JSON.stringify(report, null, 2);
    } catch (err) {
      outEl.textContent = `Probe failed: ${err.message || err}\n`;
    }
  });

  dtcBtn.addEventListener("click", async () => {
    if (!session) return;
    try {
      const dtcs = await session.readStoredDtcs();
      if (dtcs.isSimulated) {
        outEl.textContent = "No data – this adapter path is not a live vehicle reading. No result was shown as a diagnosis.\n";
        return;
      }
      const banner = "Live adapter payload (FIXD protocol claim PARTIAL)\n";
      outEl.textContent = banner + JSON.stringify(dtcs, null, 2);
    } catch (err) {
      outEl.textContent = `Read DTCs failed: ${err.message || err}\n`;
    }
  });

  discBtn.addEventListener("click", async () => {
    if (!session) return;
    await session.disconnect();
    if (bleOk) {
      connectBtn.disabled = false;
      scanAllBtn.disabled = false;
    }
    outEl.textContent += "\nDisconnected.\n";
  });

  // autoStart is only set from a button tap. Page load leaves it false so iOS
  // does not present the Bluetooth sheet before the view controller is ready.
  if (autoStart && bleOk) {
    void run(() => startLive({ preferFixdName: true }));
  } else if (bleOk) {
    statusEl.textContent = "Status: ready — tap Connect Scanner";
  } else if (autoStart) {
    statusEl.textContent = "Status: Bluetooth is not available in this screen";
  }
}
