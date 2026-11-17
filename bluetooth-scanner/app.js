import {
  OPTIONAL_SERVICES,
  pickCharacteristics,
  parseMode03Response,
  parseRpmResponse,
  parseSpeedResponse,
  buildDemoMode03,
  buildDemoRpm,
  buildDemoSpeed
} from "./obd.js";

const ui = {
  supportNote: document.getElementById("supportNote"),
  statusPill: document.getElementById("statusPill"),
  connectBtn: document.getElementById("connectBtn"),
  demoBtn: document.getElementById("demoBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  initBtn: document.getElementById("initBtn"),
  readDtcsBtn: document.getElementById("readDtcsBtn"),
  readLiveBtn: document.getElementById("readLiveBtn"),
  clearLogBtn: document.getElementById("clearLogBtn"),
  deviceName: document.getElementById("deviceName"),
  transportLabel: document.getElementById("transportLabel"),
  results: document.getElementById("results"),
  trafficLog: document.getElementById("trafficLog")
};

const state = {
  mode: "idle", // idle | ble | demo
  device: null,
  server: null,
  writeChar: null,
  notifyChar: null,
  decoder: new TextDecoder(),
  encoder: new TextEncoder(),
  pendingResolve: null,
  pendingReject: null,
  buffer: "",
  responseTimer: null
};

function setStatus(label, stateName) {
  ui.statusPill.textContent = label;
  ui.statusPill.dataset.state = stateName;
}

function setConnectedUi(connected) {
  ui.connectBtn.disabled = connected;
  ui.demoBtn.disabled = connected;
  ui.disconnectBtn.disabled = !connected;
  ui.initBtn.disabled = !connected;
  ui.readDtcsBtn.disabled = !connected;
  ui.readLiveBtn.disabled = !connected;
}

function logLine(direction, text) {
  const stamp = new Date().toLocaleTimeString();
  ui.trafficLog.textContent += `[${stamp}] ${direction} ${text.trim()}\n`;
  ui.trafficLog.scrollTop = ui.trafficLog.scrollHeight;
}

function webBluetoothAvailable() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

function refreshSupportNote() {
  if (!webBluetoothAvailable()) {
    ui.supportNote.textContent =
      "Web Bluetooth is not available in this browser. Use Chrome/Edge on Android or desktop over HTTPS, or run Demo mode.";
    ui.connectBtn.disabled = true;
    return;
  }
  ui.supportNote.textContent =
    "Pick your ELM327 BLE adapter from the system chooser. Accept the Bluetooth permission prompt when shown.";
}

async function connectBle() {
  if (!webBluetoothAvailable()) {
    setStatus("Unsupported", "error");
    return;
  }
  setStatus("Connecting…", "connecting");
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: OPTIONAL_SERVICES
    });
    device.addEventListener("gattserverdisconnected", onDisconnected);
    const server = await device.gatt.connect();
    const { write, notify } = await discoverChars(server);
    if (!write || !notify) {
      throw new Error("Could not find write/notify UART characteristics on this adapter.");
    }
    await notify.startNotifications();
    notify.addEventListener("characteristicvaluechanged", onNotify);

    state.mode = "ble";
    state.device = device;
    state.server = server;
    state.writeChar = write;
    state.notifyChar = notify;

    ui.deviceName.textContent = device.name || "BLE adapter";
    ui.transportLabel.textContent = "Web Bluetooth (BLE)";
    setStatus("Connected", "ready");
    setConnectedUi(true);
    logLine("SYS", `Connected to ${device.name || device.id}`);
  } catch (err) {
    setStatus("Error", "error");
    ui.results.innerHTML = `<p class="empty">${escapeHtml(err.message || String(err))}</p>`;
    logLine("ERR", err.message || String(err));
  }
}

async function discoverChars(server) {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    let chars;
    try {
      chars = await service.getCharacteristics();
    } catch {
      continue;
    }
    const picked = pickCharacteristics(chars);
    if (picked.write && picked.notify) return picked;
  }
  return { write: null, notify: null };
}

function onNotify(event) {
  const chunk = state.decoder.decode(event.target.value);
  state.buffer += chunk;
  if (state.buffer.includes(">")) {
    const full = state.buffer;
    state.buffer = "";
    if (state.responseTimer) {
      clearTimeout(state.responseTimer);
      state.responseTimer = null;
    }
    if (state.pendingResolve) {
      const resolve = state.pendingResolve;
      state.pendingResolve = null;
      state.pendingReject = null;
      resolve(full);
    }
  }
}

function onDisconnected() {
  logLine("SYS", "Adapter disconnected");
  hardResetConnection("Disconnected");
}

function hardResetConnection(statusLabel = "Disconnected") {
  if (state.responseTimer) clearTimeout(state.responseTimer);
  if (state.pendingReject) state.pendingReject(new Error("Disconnected"));
  state.mode = "idle";
  state.device = null;
  state.server = null;
  state.writeChar = null;
  state.notifyChar = null;
  state.pendingResolve = null;
  state.pendingReject = null;
  state.buffer = "";
  state.responseTimer = null;
  ui.deviceName.textContent = "—";
  ui.transportLabel.textContent = "—";
  setStatus(statusLabel, statusLabel === "Disconnected" ? "idle" : "error");
  setConnectedUi(false);
}

async function disconnect() {
  try {
    if (state.notifyChar) {
      try {
        state.notifyChar.removeEventListener("characteristicvaluechanged", onNotify);
        await state.notifyChar.stopNotifications();
      } catch {
        /* ignore */
      }
    }
    if (state.device?.gatt?.connected) state.device.gatt.disconnect();
  } finally {
    hardResetConnection("Disconnected");
  }
}

function connectDemo() {
  state.mode = "demo";
  ui.deviceName.textContent = "Demo ELM327";
  ui.transportLabel.textContent = "Simulated (no radio)";
  setStatus("Demo ready", "ready");
  setConnectedUi(true);
  logLine("SYS", "Demo mode — replies are simulated adapter traffic");
  ui.results.innerHTML = `<p class="empty">Demo connected. Initialize, then read DTCs or live data.</p>`;
}

async function sendCommand(cmd, { timeoutMs = 4000 } = {}) {
  const line = cmd.endsWith("\r") ? cmd : `${cmd}\r`;
  logLine("TX", cmd);

  if (state.mode === "demo") {
    const response = demoReply(cmd);
    logLine("RX", response.replace(/\r/g, "\\r"));
    await delay(120);
    return response;
  }

  if (!state.writeChar) throw new Error("Not connected");

  state.buffer = "";
  const responsePromise = new Promise((resolve, reject) => {
    state.pendingResolve = resolve;
    state.pendingReject = reject;
    state.responseTimer = setTimeout(() => {
      state.pendingResolve = null;
      state.pendingReject = null;
      reject(new Error(`Timeout waiting for reply to ${cmd}`));
    }, timeoutMs);
  });

  const payload = state.encoder.encode(line);
  if (state.writeChar.properties.writeWithoutResponse) {
    await state.writeChar.writeValueWithoutResponse(payload);
  } else {
    await state.writeChar.writeValue(payload);
  }

  const response = await responsePromise;
  logLine("RX", response.replace(/\r/g, "\\r"));
  return response;
}

function demoReply(cmd) {
  const c = cmd.trim().toUpperCase();
  if (c.startsWith("AT")) return "OK\r\n>";
  if (c === "03") return buildDemoMode03();
  if (c === "010C") return buildDemoRpm();
  if (c === "010D") return buildDemoSpeed();
  return "NO DATA\r\n>";
}

async function initializeAdapter() {
  ui.results.innerHTML = `<p class="empty">Initializing adapter…</p>`;
  const steps = ["ATZ", "ATE0", "ATL0", "ATH0", "ATS0", "ATSP0"];
  try {
    for (const step of steps) {
      await sendCommand(step, { timeoutMs: step === "ATZ" ? 6000 : 4000 });
      await delay(80);
    }
    ui.results.innerHTML = `<p class="empty">Adapter initialized. Ready to read DTCs.</p>`;
    setStatus(state.mode === "demo" ? "Demo ready" : "Ready", "ready");
  } catch (err) {
    setStatus("Error", "error");
    ui.results.innerHTML = `<p class="empty">${escapeHtml(err.message || String(err))}</p>`;
  }
}

async function readDtcs() {
  ui.results.innerHTML = `<p class="empty">Reading Mode 03 stored DTCs…</p>`;
  try {
    const raw = await sendCommand("03", { timeoutMs: 8000 });
    const codes = parseMode03Response(raw);
    if (!codes.length) {
      ui.results.innerHTML = `<p class="empty">No stored DTCs reported by the ECU (or adapter returned empty Mode 03 payload).</p>`;
      return;
    }
    ui.results.innerHTML = `
      <p class="note" style="margin-bottom:0.65rem">Raw codes from ECU — no repair text attached.</p>
      <ul class="dtc-list">
        ${codes
          .map(
            (code) =>
              `<li><code>${escapeHtml(code)}</code><span>Mode 03</span></li>`
          )
          .join("")}
      </ul>`;
  } catch (err) {
    setStatus("Error", "error");
    ui.results.innerHTML = `<p class="empty">${escapeHtml(err.message || String(err))}</p>`;
  }
}

async function readLive() {
  ui.results.innerHTML = `<p class="empty">Reading RPM (010C) and speed (010D)…</p>`;
  try {
    const rpmRaw = await sendCommand("010C", { timeoutMs: 5000 });
    const speedRaw = await sendCommand("010D", { timeoutMs: 5000 });
    const rpm = parseRpmResponse(rpmRaw);
    const speed = parseSpeedResponse(speedRaw);
    ui.results.innerHTML = `
      <div class="live-grid">
        <article>
          <span class="label">Engine RPM</span>
          <span class="value">${rpm == null ? "—" : escapeHtml(String(rpm))}</span>
        </article>
        <article>
          <span class="label">Speed (km/h)</span>
          <span class="value">${speed == null ? "—" : escapeHtml(String(speed))}</span>
        </article>
      </div>`;
  } catch (err) {
    setStatus("Error", "error");
    ui.results.innerHTML = `<p class="empty">${escapeHtml(err.message || String(err))}</p>`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

ui.connectBtn.addEventListener("click", () => connectBle());
ui.demoBtn.addEventListener("click", () => connectDemo());
ui.disconnectBtn.addEventListener("click", () => disconnect());
ui.initBtn.addEventListener("click", () => initializeAdapter());
ui.readDtcsBtn.addEventListener("click", () => readDtcs());
ui.readLiveBtn.addEventListener("click", () => readLive());
ui.clearLogBtn.addEventListener("click", () => {
  ui.trafficLog.textContent = "";
});

refreshSupportNote();
setConnectedUi(false);
