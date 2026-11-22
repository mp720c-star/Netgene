import { capacitorBleAvailable, createCapacitorBleTransport, formatBlePayloadDiagnostic } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";
import { storedCodes } from "./stored-codes.js";

const ELM_ADAPTER_INIT = Object.freeze(["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"]);

const el = (id) => document.getElementById(id);
const panel = el("bluetoothCard");
const field = el("codes");
const connect = el("btnBtConnect");
const top = el("btnBluetoothTop");
const read = el("btnBtReadCodes");
const disconnect = el("btnBtDisconnect");
const output = el("btLog");
let active;
let ready = false;
let adapterReady = false;
let busy = false;
let available = false;

function readout() {
  return typeof window !== "undefined" ? window.ATDDScanReadout : null;
}

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  disconnect.disabled = busy || !ready;
}

function log(message) {
  output.textContent += (output.textContent ? "\n" : "") + message;
  output.scrollTop = output.scrollHeight;
}

async function release(scanner) {
  if (active === scanner) {
    active = undefined;
    ready = false;
    adapterReady = false;
  }
  if (scanner) await scanner.disconnect();
}

async function perform(action) {
  if (busy) return;
  busy = true;
  buttons();
  try {
    await action();
  } catch (error) {
    log(error?.message || String(error));
    await release(active);
  } finally {
    busy = false;
    buttons();
  }
}

async function prepareAdapter(scanner) {
  log("Sending read-only ELM adapter setup (ATZ, ATE0, ATL0, ATS0, ATH0, ATSP0). These configure the dongle only; they are not vehicle writes and do not clear codes.");
  for (const cmd of ELM_ADAPTER_INIT) {
    const timeoutMs = cmd === "ATZ" ? 8000 : 4000;
    try {
      const reply = await scanner.send(cmd, { timeoutMs });
      log(cmd + " → " + String(reply).trim());
    } catch (error) {
      log(cmd + " failed: " + (error?.message || error) + ". Continuing with the next setup step.");
    }
    if (active !== scanner) throw new Error("Scanner disconnected during adapter setup.");
  }
}

async function choose() {
  panel.hidden = false;
  panel.scrollIntoView({ block: "start" });
  if (active || !available) return;
  await perform(async () => {
    output.textContent = "";
    const scanner = createCapacitorBleTransport({
      // Prefer known FIXD/ELM GATT profiles, then fall back to a generic UART
      // service so off-brand ELM327-style BLE adapters can still be chosen.
      requireKnownProfile: false,
      onRawPayload(decoded) {
        log(formatBlePayloadDiagnostic(decoded.bytes, decoded.text));
      },
      onDisconnect() {
        if (active !== scanner) return;
        log("Scanner disconnected.");
        void release(scanner).finally(buttons);
      },
    });
    active = scanner;
    log("Choose a FIXD or generic ELM327-style BLE OBD-II adapter plugged into the vehicle.");
    log("FIXD compatibility is " + FIXD_COMPATIBILITY + " until a real-device Mode 03 round-trip is confirmed.");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    const name = device.name || "BLE adapter";
    const fixdName = device.isFixdName ? " (FIXD-named device; protocol still " + FIXD_COMPATIBILITY + ")" : "";
    log("Connected to " + name + fixdName + ". Tap Read codes to request stored faults (Mode 03 only).");
  });
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    if (!adapterReady) {
      await prepareAdapter(scanner);
      adapterReady = true;
    }
    log("Requesting stored fault codes (Mode 03 only). No Mode 04 clear is sent.");
    const reply = await scanner.send("03");
    log("Vehicle reply for Mode 03\n" + String(reply).trim());
    if (active !== scanner) throw new Error("Scanner disconnected before the read finished.");
    const api = readout();
    try {
      const codes = storedCodes(reply);
      field.value = codes.join("\n");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      if (api) {
        api.showScanReadout({ ok: true, codes, reply });
      }
      if (codes.length) {
        log("Stored codes from the vehicle: " + codes.join(", ") + ". Decoded meanings are listed below this card.");
      } else {
        log("The vehicle reported no stored fault codes.");
      }
    } catch (error) {
      if (api) {
        api.showScanReadout({ ok: false, reply, error: error?.message || String(error) });
      }
      log("could not parse\n" + String(reply || "(empty reply)") + "\n" + (error?.message || String(error)));
    }
  });
}

panel.querySelector(".lead").textContent =
  "Connect a FIXD or generic ELM327-style BLE OBD-II scanner, then read stored codes (Mode 01/03 only). FIXD compatibility is " +
  FIXD_COMPATIBILITY +
  ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "A successful Mode 03 read lists decoded codes below this card. Mode 04 clear-codes stays blocked. Adapter setup is limited to ATZ/ATE0/ATL0/ATS0/ATH0/ATSP0. No simulated scanner data is used.";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect Scanner";
el("btnBtScanAll").hidden = true;
const demoBtn = el("btnBtDemo");
if (demoBtn) demoBtn.remove();
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. FIXD compatibility is " + FIXD_COMPATIBILITY + "."
  : "The native Bluetooth connection is unavailable in this copy.";
top.onclick = connect.onclick = choose;
read.onclick = readVehicle;
disconnect.onclick = () => perform(async () => {
  await release(active);
  log("Disconnected.");
});
buttons();
