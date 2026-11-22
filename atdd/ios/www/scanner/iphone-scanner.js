import { capacitorBleAvailable, createCapacitorBleTransport } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";
import { storedCodes } from "./stored-codes.js";
import { prepareElmAdapter } from "./elm-adapter.js";

const el = (id) => document.getElementById(id);
const panel = el("bluetoothCard");
const field = el("codes");
const connect = el("btnBtConnect");
const top = el("btnBluetoothTop");
const read = el("btnBtReadCodes");
const disconnect = el("btnBtDisconnect");
const output = el("btLog");
const setup = document.createElement("button");
setup.id = "btnBtPrepareElm";
setup.type = "button";
setup.className = "secondary";
setup.textContent = "Prepare ELM scanner";
setup.title = "For an ELM-compatible scanner: set automatic vehicle protocol without clearing codes.";
connect.parentElement.appendChild(setup);
const copy = document.createElement("button");
copy.id = "btnBtCopyDiagnostics";
copy.type = "button";
copy.className = "secondary";
copy.textContent = "Copy diagnostics";
connect.parentElement.appendChild(copy);
const state = document.createElement("p");
state.setAttribute("role", "status");
state.setAttribute("aria-live", "polite");
panel.insertBefore(state, output);
let active;
let activeDevice;
let ready = false;
let busy = false;
let available = false;
const report = {
  app: "Auto/Truck Diagnostics for Dummies",
  sourceCommit: document.querySelector('meta[name="atdd-source"]')?.content || "unknown",
  build: document.querySelector('meta[name="atdd-build"]')?.content || "local",
  startedAt: new Date().toISOString(),
  fixdCompatibility: FIXD_COMPATIBILITY,
  vehicleRead: "not-attempted",
  connection: null,
  rawReply: null,
  events: [],
};

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  // A pending read can be cancelled by disconnecting.
  disconnect.disabled = !active;
  setup.disabled = busy || !ready || Boolean(activeDevice?.isFixdName);
}

function log(message) {
  const text = String(message);
  report.events.push({ at: new Date().toISOString(), message: text.slice(0, 4096) });
  report.events = report.events.slice(-100);
  output.textContent = (output.textContent + (output.textContent ? "\n" : "") + text).slice(-65536);
  output.scrollTop = output.scrollHeight;
}

async function release(scanner) {
  if (scanner) report.connection = scanner.connectionInfo();
  if (active === scanner) {
    active = undefined;
    activeDevice = undefined;
    ready = false;
  }
  if (scanner) await scanner.disconnect();
}

async function perform(action, releaseOnError = false) {
  if (busy) return;
  busy = true;
  buttons();
  try {
    await action();
  } catch (error) {
    log(error?.message || String(error));
    state.textContent = "Scanner operation failed. See diagnostics below.";
    if (releaseOnError) {
      try { await release(active); } catch (cleanup) { log(cleanup?.message || String(cleanup)); }
    }
  } finally {
    busy = false;
    buttons();
  }
}

async function choose() {
  panel.hidden = false;
  panel.scrollIntoView({ block: "start" });
  if (active || !available) return;
  await perform(async () => {
    state.textContent = "Choose your powered OBD-II scanner.";
    const scanner = createCapacitorBleTransport({
      requireKnownProfile: false,
      onDisconnect() {
        if (active !== scanner) return;
        state.textContent = "Scanner disconnected.";
        log("Scanner disconnected.");
        void release(scanner).catch((error) => log(error?.message || String(error))).finally(buttons);
      },
    });
    active = scanner;
    log("Choose your OBD-II scanner. Close other scanner apps before connecting.");
    const [device] = await scanner.scan();
    activeDevice = device;
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    report.connection = scanner.connectionInfo();
    state.textContent = "Bluetooth connected. Vehicle communication has not been checked yet.";
    log("Bluetooth connected to " + (device.name || "BLE adapter") + ". Tap Read codes to verify the vehicle reply.");
    if (device.isFixdName) {
      log("FIXD support remains " + FIXD_COMPATIBILITY + ". ELM setup is disabled for FIXD-named devices; no private commands will be guessed.");
    } else {
      log("For an ELM-compatible scanner that cannot read yet, tap Prepare ELM scanner, then Read codes.");
    }
  }, true);
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    state.textContent = "Waiting for the vehicle's stored-code reply...";
    report.vehicleRead = "waiting";
    report.rawReply = null;
    try {
      const reply = await scanner.send("03");
      report.rawReply = reply;
      log("Mode 03 reply\n" + reply.trim());
      const codes = storedCodes(reply);
      if (active !== scanner) throw new Error("Scanner disconnected before the read finished.");
      report.vehicleRead = "received";
      report.connection = scanner.connectionInfo();
      field.value = codes.join("\n");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      state.textContent = codes.length
        ? "Vehicle replied with " + codes.length + " stored code(s)."
        : "Vehicle replied with no stored fault codes.";
      if (codes.length) {
        log("Stored codes received: " + codes.join(", "));
        el("btnLookup").click();
      } else {
        log("The vehicle reported no stored fault codes.");
      }
    } catch (error) {
      report.vehicleRead = "failed";
      throw error;
    }
  });
}

async function copyDiagnostics() {
  const text = JSON.stringify(report, null, 2);
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Use selection");
    await navigator.clipboard.writeText(text);
    copy.textContent = "Diagnostics copied";
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.readOnly = true;
    area.setAttribute("aria-label", "Scanner diagnostics to copy");
    panel.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand?.("copy");
    copy.textContent = copied ? "Diagnostics copied" : "Select diagnostics below to copy";
    if (copied) area.remove();
  }
}

panel.querySelector(".lead").textContent =
  "Connect an iPhone-compatible Bluetooth Low Energy OBD-II scanner and read stored engine codes. Scanner protocols vary; support for every Bluetooth scanner cannot be guaranteed.";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "Vehicle operations are read-only. Code clearing is blocked. Prepare ELM scanner changes connection settings only after the adapter identifies itself. FIXD compatibility remains " + FIXD_COMPATIBILITY + ".";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect Scanner";
el("btnBtScanAll").hidden = true;
el("btnBtDemo").hidden = true;
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. Select the scanner inside this app."
  : "Native Bluetooth is unavailable in this copy. Open the updated ATDD TestFlight app.";
state.textContent = "No scanner connected.";
top.onclick = connect.onclick = choose;
read.onclick = readVehicle;
setup.onclick = () => perform(async () => {
  if (!ready || activeDevice?.isFixdName) return;
  state.textContent = "Preparing ELM scanner connection settings...";
  const scanner = active;
  await prepareElmAdapter(scanner, log);
  if (active !== scanner) throw new Error("Scanner disconnected during setup.");
  report.connection = scanner.connectionInfo();
  state.textContent = "ELM scanner prepared. Tap Read codes to check the vehicle.";
});
copy.onclick = copyDiagnostics;
disconnect.onclick = async () => {
  try {
    await release(active);
    state.textContent = "Scanner disconnected.";
    log("Disconnected.");
  } catch (error) {
    log(error?.message || String(error));
  } finally {
    buttons();
  }
};
buttons();
