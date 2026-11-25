import { capacitorBleAvailable, createCapacitorBleTransport, formatBlePayloadDiagnostic } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";

const ELM_ADAPTER_INIT = Object.freeze(["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATH1", "ATL1", "ATCAF1", "ATAT1", "ATSP0"]);

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
  const reply = command === "03"
    ? await scanner.send("03", { timeoutMs })
    : await scanner.send(command, { timeoutMs });
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
  log("Sending ELM adapter setup. These configure the dongle only. New scan does not send Mode 04.");
  for (const cmd of ELM_ADAPTER_INIT) {
    await sendOptional(scanner, cmd, cmd === "ATZ" ? 8000 : 4000);
  }
}

function showReport(sections) {
  const reply = sections.map((section) => section.raw).filter(Boolean).join("\n");
  try {
    const report = scanApi().buildReport(sections);
    field.value = report.uniqueCodes.join("\n");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    const api = readout();
    if (api) api.showScanReadout({ ok: true, codes: report.uniqueCodes, reply, report });
    if (!report.answered) {
      log("The vehicle did not reply. No codes were added.");
    } else if (report.uniqueCodes.length) {
      log("Codes from the vehicle: " + report.uniqueCodes.join(", ") + ".");
    } else {
      log("The vehicle answered and reported no fault codes.");
    }
    if (!report.chassisCodes.length) {
      log("No chassis-module codes were in the replies. ABS codes appear only when that module answers.");
    }
    return report;
  } catch (error) {
    log("could not parse\n" + (error?.message || error));
    const api = readout();
    if (api) api.showScanReadout({ ok: false, reply, error: error?.message || String(error) });
    return null;
  }
}

async function readSections(scanner) {
  const sections = [];
  for (const step of scanApi().FUNCTIONAL_READS) {
    log("Requesting " + step.label + ".");
    sections.push({ label: step.label, raw: await sendOptional(scanner, step.command, step.timeoutMs) });
  }
  return sections;
}

async function probeNodes(scanner, sections) {
  const api = scanApi();
  const nodes = api.PHYSICAL_NODES.concat(api.EXTRA_NODES);
  const answered = [];
  log("Asking each module on this adapter. A module that does not answer is left out.");
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
      let reply = await sendOptional(scanner, step.command, step.timeoutMs);
      if (step.command === "1902FF" && api.needsExtendedSession(reply)) {
        await sendOptional(scanner, api.EXTENDED_SESSION, 3000);
        reply = await sendOptional(scanner, step.command, step.timeoutMs);
        await sendOptional(scanner, api.DEFAULT_SESSION, 3000);
      }
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
    const sections = await readSections(scanner);
    answeredNodes = await probeNodes(scanner, sections);
    showReport(sections);
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
    log("Reading the vehicle again.");
    const sections = await readSections(scanner);
    answeredNodes = await probeNodes(scanner, sections);
    showReport(sections);
  });
}

panel.querySelector(".lead").textContent =
  "Connect any Bluetooth-capable ELM327-style OBD-II reader. FIXD brand protocol claim is " + FIXD_COMPATIBILITY + ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "A read lists stored, pending, permanent, and module codes the vehicle returns, including ABS/chassis codes when that module answers. Clear sends Mode 04 plus a module clear to each computer that answered. New scan does not send Mode 04. No simulated scanner data is used.";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect Scanner";
if (clear) clear.textContent = "Clear codes (incl. ABS)";
if (scanAll) scanAll.hidden = false;
const demoBtn = el("btnBtDemo");
if (demoBtn) demoBtn.remove();
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. Pick any ELM327-style BLE OBD-II adapter. FIXD brand protocol claim is " + FIXD_COMPATIBILITY + "."
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
    log("Connected to " + name + ". Tap Read codes. The app lists only codes this adapter returns.");
  });
}

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
};
