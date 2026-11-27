import { capacitorBleAvailable, createCapacitorBleTransport, formatBlePayloadDiagnostic } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";
import { storedCodes } from "./stored-codes.js";

// Proven FIXD / ELM327-class setup from the last working TestFlight Mode 03 path.
// Do not flip ATH0→ATH1 or enable ATL1/ATCAF1 here — that broke code reads on FIXD.
const ELM_ADAPTER_INIT = Object.freeze(["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"]);

const el = (id) => document.getElementById(id);
const panel = el("bluetoothCard");
const field = el("codes");
const connect = el("btnBtConnect");
const top = el("btnBluetoothTop");
const read = el("btnBtReadCodes");
const clear = el("btnBtClearVehicle");
const disconnect = el("btnBtDisconnect");
const scanAll = el("btnBtScanAll");
const output = el("btLog");
let active;
let ready = false;
let adapterReady = false;
let busy = false;
let available = false;
let answeredNodes = [];

function scanApi() {
  const api = window.ATDDVehicleScan;
  if (!api) throw new Error("Vehicle scan parser is missing from this build.");
  return api;
}

function readout() {
  return typeof window !== "undefined" ? window.ATDDScanReadout : null;
}

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  if (scanAll) scanAll.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  if (clear) clear.disabled = busy || !ready;
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
    answeredNodes = [];
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

async function sendLogged(scanner, command, timeoutMs) {
  log("> " + command);
  const reply = await scanner.send(command, { timeoutMs });
  log(String(reply).trim());
  if (active !== scanner) throw new Error("Scanner disconnected.");
  return reply;
}

async function sendOptional(scanner, command, timeoutMs) {
  try {
    return await sendLogged(scanner, command, timeoutMs);
  } catch (error) {
    log(command + " failed: " + (error?.message || error) + ". Continuing.");
    if (active !== scanner) throw new Error("Scanner disconnected.");
    return "";
  }
}

async function prepareAdapter(scanner) {
  log("Sending ELM adapter setup (ATZ, ATE0, ATL0, ATS0, ATH0, ATSP0). Dongle only — not Mode 04.");
  for (const cmd of ELM_ADAPTER_INIT) {
    await sendOptional(scanner, cmd, cmd === "ATZ" ? 8000 : 4000);
  }
}

function showCodes(codes, reply, label) {
  const list = Array.from(new Set((codes || []).filter(Boolean)));
  field.value = list.join("\n");
  field.dispatchEvent(new Event("input", { bubbles: true }));
  const api = readout();
  if (api) api.showScanReadout({ ok: true, codes: list, reply });
  if (list.length) {
    log((label || "Codes") + " from the vehicle: " + list.join(", ") + ".");
  } else {
    log((label || "The vehicle") + " reported no fault codes.");
  }
  return list;
}

function mergeUnique(target, more) {
  for (const code of more || []) {
    if (code && !target.includes(code)) target.push(code);
  }
  return target;
}

async function readModeFamily(scanner, command, label, timeoutMs) {
  log("Requesting " + label + " (" + command + ").");
  const reply = await sendOptional(scanner, command, timeoutMs || 12000);
  if (!reply) return { codes: [], reply: "" };
  try {
    const codes = storedCodes(reply);
    return { codes, reply };
  } catch (error) {
    // Mode 07/0A often return NO DATA when empty; do not fail the whole read.
    log(label + " parse: " + (error?.message || error));
    const api = readout();
    if (api && command === "03") {
      api.showScanReadout({ ok: false, reply, error: error?.message || String(error) });
    }
    return { codes: [], reply, error };
  }
}

async function probeNodes(scanner, sections) {
  const api = scanApi();
  const nodes = api.PHYSICAL_NODES.concat(api.EXTRA_NODES);
  const answered = [];
  log("Optional: asking modules that answer on this adapter. Silent modules are skipped.");
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.request.length === 8 && answered.some((item) => item.request.length === 8 && item.unsupported)) break;
    log("Module " + node.response + " (" + (index + 1) + " of " + nodes.length + ").");
    let setupFailed = false;
    for (const command of api.adapterHeader(node)) {
      const reply = await sendOptional(scanner, command, 3000);
      if (/\?/.test(reply) && node.request.length === 8) {
        answered.push({ request: node.request, response: node.response, unsupported: true });
        setupFailed = true;
        break;
      }
    }
    if (setupFailed) continue;
    let nodeAnswered = false;
    for (const step of api.MODULE_READS) {
      // Skip UDS 1902FF on the FIXD-first path — many ELM clones stall here.
      if (step.command === "1902FF") continue;
      const reply = await sendOptional(scanner, step.command, step.timeoutMs);
      sections.push({ label: node.response + " " + step.label, raw: reply });
      if (api.replyHasVehicleData(reply)) nodeAnswered = true;
    }
    if (nodeAnswered) answered.push({ request: node.request, response: node.response });
  }
  for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
  return answered.filter((node) => !node.unsupported);
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    if (!adapterReady) {
      await prepareAdapter(scanner);
      adapterReady = true;
    }

    // FIXD-critical path: Mode 03 first (this is what worked on earlier TestFlight builds).
    const stored = await readModeFamily(scanner, "03", "stored codes", 12000);
    if (stored.error && !stored.codes.length && /incomplete|did not reply|rejected/i.test(stored.error.message || stored.error)) {
      throw new Error(stored.error.message || String(stored.error));
    }
    let codes = showCodes(stored.codes, stored.reply, "Stored codes");

    const pending = await readModeFamily(scanner, "07", "pending codes", 10000);
    codes = showCodes(mergeUnique(codes, pending.codes), [stored.reply, pending.reply].filter(Boolean).join("\n"), "Stored/pending codes");

    const permanent = await readModeFamily(scanner, "0A", "permanent codes", 10000);
    codes = showCodes(
      mergeUnique(codes, permanent.codes),
      [stored.reply, pending.reply, permanent.reply].filter(Boolean).join("\n"),
      "Codes"
    );

    // Light status only — do not block on a long 0100/VIN/module sweep before codes appear.
    await sendOptional(scanner, "0101", 6000);

    try {
      const sections = [
        { label: "stored codes", raw: stored.reply },
        { label: "pending codes", raw: pending.reply },
        { label: "permanent codes", raw: permanent.reply },
      ];
      answeredNodes = await probeNodes(scanner, sections);
      const report = scanApi().buildReport(sections);
      if (report.uniqueCodes.length) {
        codes = showCodes(mergeUnique(codes, report.uniqueCodes), sections.map((s) => s.raw).join("\n"), "Codes");
      }
      if (!report.chassisCodes.length) {
        log("No chassis-module codes in the replies. ABS codes appear only when that module answers.");
      }
    } catch (error) {
      log("Module probe skipped after primary read: " + (error?.message || error));
    }

    if (!codes.length) {
      log("Primary Mode 03/07/0A returned no codes. If the check-engine light is on, retry Read codes with key on, engine off.");
    }
  });
}

function confirmClear() {
  const dialog = el("clearCodesDialog");
  if (!dialog || typeof dialog.showModal !== "function") {
    return Promise.resolve(window.confirm("Clear codes on this vehicle? Park, key on, engine off."));
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      resolve(value);
    };
    el("clearCodesForm").addEventListener("submit", (event) => {
      event.preventDefault();
      finish(true);
    }, { once: true });
    el("btnClearVehicleCancel").addEventListener("click", () => finish(false), { once: true });
    dialog.addEventListener("cancel", () => finish(false), { once: true });
    dialog.showModal();
  });
}

async function clearVehicle() {
  if (!ready) return;
  const accepted = await confirmClear();
  if (!accepted) {
    log("Clear cancelled. Nothing was sent to the vehicle.");
    return;
  }
  await perform(async () => {
    const scanner = active;
    const api = scanApi();
    log("Clearing codes the vehicle accepts. New scan does not send Mode 04.");
    for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
    await sendLogged(scanner, api.CLEAR_EMISSIONS, 8000);
    for (const node of answeredNodes) {
      for (const command of api.adapterHeader(node)) await sendOptional(scanner, command, 3000);
      await sendOptional(scanner, api.CLEAR_MODULE, 8000);
    }
    for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
    log("Reading stored codes again.");
    adapterReady = true;
    const stored = await readModeFamily(scanner, "03", "stored codes", 12000);
    showCodes(stored.codes, stored.reply, "Stored codes");
  });
}

panel.querySelector(".lead").textContent =
  "Connect a FIXD or generic ELM327-style BLE OBD-II reader, then Read codes. FIXD brand protocol claim is " +
  FIXD_COMPATIBILITY +
  ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "Read codes starts with Mode 03 (stored), then pending and permanent. Adapter setup is ATZ/ATE0/ATL0/ATS0/ATH0/ATSP0 — the same sequence as the last working TestFlight read. Clear still needs confirmation. No simulated scanner data is used.";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect";
if (clear) clear.textContent = "Clear codes (incl. ABS)";
if (scanAll) scanAll.hidden = false;
const demoBtn = el("btnBtDemo");
if (demoBtn) demoBtn.remove();
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. Pick your FIXD or other ELM327-style BLE adapter. Protocol claim is " + FIXD_COMPATIBILITY + "."
  : "The native Bluetooth connection is unavailable in this copy.";
top.onclick = connect.onclick = () => choose();
if (scanAll) scanAll.onclick = () => choose();
read.onclick = readVehicle;
if (clear) clear.onclick = clearVehicle;
disconnect.onclick = () => perform(async () => {
  await release(active);
  log("Disconnected.");
});
buttons();

async function choose() {
  panel.hidden = false;
  panel.scrollIntoView({ block: "start" });
  if (active || !available) return;
  await perform(async () => {
    output.textContent = "";
    const scanner = createCapacitorBleTransport({
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
    log("Choose a FIXD or other ELM327-style BLE OBD-II adapter plugged into the vehicle.");
    log("FIXD compatibility is " + FIXD_COMPATIBILITY + ".");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    const name = device.name || "BLE adapter";
    const fixdName = device.isFixdName ? " (FIXD-named device)" : "";
    log("Connected to " + name + fixdName + ". Tap Read codes for Mode 03 stored faults first.");
  });
}

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
  ELM_ADAPTER_INIT,
};
