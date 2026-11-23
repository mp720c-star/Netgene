import { capacitorBleAvailable, createCapacitorBleTransport, formatBlePayloadDiagnostic } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";
import { readUntilParsed } from "./read-until-parsed.js";
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
const PARSE_RETRY_MS = 2000;

let active;
let ready = false;
let adapterReady = false;
let busy = false;
let available = false;
let readToken;

function readout() {
  return typeof window !== "undefined" ? window.ATDDScanReadout : null;
}

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  disconnect.disabled = !active;
}

function log(message) {
  output.textContent += (output.textContent ? "\n" : "") + message;
  output.scrollTop = output.scrollHeight;
}

async function release(scanner) {
  readToken = null;
  if (active === scanner) {
    active = undefined;
    ready = false;
    adapterReady = false;
  }
  if (scanner) await scanner.disconnect();
}

async function pause(ms, shouldContinue) {
  const step = 200;
  for (let waited = 0; waited < ms && shouldContinue(); waited += step) {
    await new Promise((resolve) => setTimeout(resolve, step));
  }
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

async function readStored(scanner) {
  const token = {};
  readToken = token;
  const alive = () => active === scanner && readToken === token;
  log("Requesting stored fault codes (Mode 03 only). No Mode 04 clear is sent. A reply that cannot be parsed is requested again.");
  const result = await readUntilParsed({
    request: () => scanner.send("03"),
    parse: storedCodes,
    shouldContinue: alive,
    pause: () => pause(PARSE_RETRY_MS, alive),
    onFailure: async ({ attempt, kind, error, reply }) => {
      const api = readout();
      const message = error?.message || String(error);
      if (kind === "parse") {
        if (api) api.showScanReadout({ ok: false, trying: true, reply, error: message });
        log("could not parse\n" + String(reply || "(empty reply)") + "\n" + message);
      } else {
        if (api) api.showScanReadout({ ok: false, trying: true, reply, error: message });
        log("Mode 03 did not finish: " + message);
      }
      if (alive()) log("Trying Mode 03 again (" + (attempt + 1) + "). No Mode 04 clear is sent.");
    },
  });
  if (!result.ok || !alive()) return;
  const reply = result.reply;
  const codes = result.codes;
  log("Vehicle reply for Mode 03\n" + String(reply).trim());
  field.value = codes.join("\n");
  field.dispatchEvent(new Event("input", { bubbles: true }));
  const api = readout();
  if (api) api.showScanReadout({ ok: true, codes, reply });
  if (codes.length) {
    log("Stored codes from the vehicle: " + codes.join(", ") + ". Decoded meanings are listed below this card.");
  } else {
    log("The vehicle reported no stored fault codes.");
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
    log("Connected to " + name + fixdName + ". Reading stored fault codes.");
    if (!adapterReady) {
      await prepareAdapter(scanner);
      adapterReady = true;
    }
    await readStored(scanner);
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
    await readStored(scanner);
  });
}

panel.querySelector(".lead").textContent =
  "Connect a FIXD or generic ELM327-style BLE OBD-II scanner, then read stored codes (Mode 01/03 only). FIXD compatibility is " +
  FIXD_COMPATIBILITY +
  ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "A successful Mode 03 read lists decoded codes below this card. If a reply cannot be parsed, Mode 03 is requested again until it parses or you disconnect. Mode 04 clear-codes stays blocked. Adapter setup is limited to ATZ/ATE0/ATL0/ATS0/ATH0/ATSP0. No simulated scanner data is used.";
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
disconnect.onclick = () => {
  const scanner = active;
  readToken = null;
  busy = false;
  void release(scanner).then(() => {
    log("Disconnected.");
    buttons();
  });
};
buttons();

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
};
