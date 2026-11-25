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
const clearAll = el("btnBtClearAllSupported");
const disconnect = el("btnBtDisconnect");
const scanAll = el("btnBtScanAll");
const output = el("btLog");
let active;
let ready = false;
let adapterReady = false;
let busy = false;
let available = false;
let answeredNodes = [];
let lastReport = null;
let adapterName = "";

function scanApi() {
  const api = window.ATDDVehicleScan;
  if (!api) throw new Error("Vehicle scan parser is missing from this build.");
  return api;
}

function gmApi() {
  return window.ATDDGmBrake || null;
}

function readout() {
  return typeof window !== "undefined" ? window.ATDDScanReadout : null;
}

function historyApi() {
  return window.ATDDDiagnosticHistory || null;
}

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  if (scanAll) scanAll.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  if (clear) clear.disabled = busy || !ready;
  if (clearAll) clearAll.disabled = busy || !ready;
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
    lastReport = null;
    adapterName = "";
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
  log("Sending ELM adapter setup. These configure the dongle only. New scan does not send Mode 04.");
  log("FIXD compatibility is " + FIXD_COMPATIBILITY + ". Not every ELM327 command is assumed to work.");
  for (const cmd of ELM_ADAPTER_INIT) {
    await sendOptional(scanner, cmd, cmd === "ATZ" ? 8000 : 4000);
  }
  // Capability fingerprint — informational only.
  await sendOptional(scanner, "ATI", 4000);
  await sendOptional(scanner, "ATDP", 4000);
  await sendOptional(scanner, "ATDPN", 4000);
}

function publishUi(report, liveSnapshot, clearDiff) {
  const gm = gmApi();
  const sections = gm && report ? gm.sectionizeReport(report, liveSnapshot || []) : null;
  if (sections && window.ATDDModuleDiagnosticsUi) {
    window.ATDDModuleDiagnosticsUi.renderModuleDiagnostics(sections);
  }
  if (clearDiff) {
    log(
      "Clear result — cleared: " +
        (clearDiff.cleared.join(", ") || "(none)") +
        "; remained: " +
        (clearDiff.remained.join(", ") || "(none)") +
        "; appeared: " +
        (clearDiff.appeared.join(", ") || "(none)") +
        "."
    );
  }
  if (window.ATDDModuleDiagnosticsUi) window.ATDDModuleDiagnosticsUi.renderHistoryList();
}

function showReport(sections, extras) {
  const reply = sections.map((section) => section.raw).filter(Boolean).join("\n");
  try {
    const report = scanApi().buildReport(sections);
    lastReport = report;
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
    publishUi(report, extras && extras.live, extras && extras.clearDiff);
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
  const nodes = typeof api.allProbeNodes === "function" ? api.allProbeNodes() : api.PHYSICAL_NODES.concat(api.EXTRA_NODES);
  const answered = [];
  log("Asking each module on this adapter, including GM ABS/BCM candidates. Silent modules are left out.");
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.request.length === 8 && answered.some((item) => item.request.length === 8 && item.unsupported)) break;
    log("Module " + (node.label || node.response) + " (" + (index + 1) + " of " + nodes.length + ").");
    let setupFailed = false;
    for (const command of api.adapterHeader(node)) {
      const reply = await sendOptional(scanner, command, 3000);
      if (/\?/.test(reply) && (node.request.length === 8 || node.request.length === 3)) {
        if (node.request.length === 8) {
          answered.push({ request: node.request, response: node.response, unsupported: true });
          setupFailed = true;
          break;
        }
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
      sections.push({ label: (node.label || node.response) + " " + step.label, raw: reply });
      if (api.replyHasVehicleData(reply)) nodeAnswered = true;
    }
    if (nodeAnswered) answered.push({ request: node.request, response: node.response, label: node.label || "" });
  }
  for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
  return answered.filter((node) => !node.unsupported);
}

async function probeLiveData(scanner, reachableNodes) {
  const gm = gmApi();
  if (!gm) return [];
  const api = scanApi();
  const probes = {};
  const absNodes = reachableNodes.filter((node) => {
    const req = String(node.request || "").toUpperCase();
    return req === "241" || req === "24C" || req === "18DA40F1" || /ABS|EBCM/i.test(node.label || "");
  });
  const bcmNodes = reachableNodes.filter((node) => {
    const req = String(node.request || "").toUpperCase();
    return req === "244" || /BCM/i.test(node.label || "");
  });

  log("Probing live DIDs only on modules that answered. Unverified scaling is never shown as a reading.");
  for (const param of gm.LIVE_PARAMETERS) {
    const attempts = [];
    const targets =
      param.moduleRoles.indexOf("abs") >= 0 || param.moduleRoles.indexOf("traction") >= 0
        ? absNodes
        : param.moduleRoles.indexOf("bcm") >= 0 || param.section === "parking_brake"
          ? bcmNodes.concat(absNodes)
          : absNodes;
    if (!targets.length) {
      probes[param.id] = { attempts: [] };
      continue;
    }
    for (const node of targets) {
      for (const command of api.adapterHeader(node)) await sendOptional(scanner, command, 3000);
      for (const did of param.dids) {
        const reply = await sendOptional(scanner, did, 4000);
        attempts.push({
          moduleId: node.response,
          did,
          raw: reply,
          positive: gm.isPositiveDidReply(reply),
        });
        if (gm.isPositiveDidReply(reply)) break;
      }
    }
    for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
    probes[param.id] = { attempts };
  }
  return gm.buildLiveSnapshot(probes);
}

async function fullVehicleScan() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    if (!adapterReady) {
      await prepareAdapter(scanner);
      adapterReady = true;
    }
    const sections = await readSections(scanner);
    answeredNodes = await probeNodes(scanner, sections);
    const live = await probeLiveData(scanner, answeredNodes);
    const report = showReport(sections, { live });
    if (report && historyApi()) {
      historyApi().addEntry({
        kind: "full_scan",
        label: "Full Vehicle Scan",
        adapterName,
        codesAfter: (window.ATDDGmBrake && window.ATDDGmBrake.collectCodesFromReport(report)) || report.uniqueCodes,
        modulesReached: answeredNodes.map((n) => n.response),
        notes: "Live DIDs without verified scaling are stored as unavailable readings only.",
      });
      if (window.ATDDModuleDiagnosticsUi) window.ATDDModuleDiagnosticsUi.renderHistoryList();
    }
  });
}

function confirmDialog(dialogId, formId, cancelId) {
  const dialog = el(dialogId);
  if (!dialog || typeof dialog.showModal !== "function") {
    return Promise.resolve(window.confirm("Confirm clear on this vehicle? Park, key on, engine off."));
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      resolve(value);
    };
    el(formId).addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        finish(true);
      },
      { once: true }
    );
    el(cancelId).addEventListener("click", () => finish(false), { once: true });
    dialog.addEventListener("cancel", () => finish(false), { once: true });
    dialog.showModal();
  });
}

async function runClearAndRescan(label) {
  const scanner = active;
  const api = scanApi();
  const gm = gmApi();
  const beforeCodes =
    (lastReport && gm && gm.collectCodesFromReport(lastReport)) ||
    (lastReport && lastReport.uniqueCodes) ||
    [];
  if (historyApi()) {
    historyApi().addEntry({
      kind: "pre_clear",
      label: label + " — before",
      adapterName,
      codesBefore: beforeCodes,
      modulesReached: answeredNodes.map((n) => n.response),
    });
  }
  log("Clearing codes the vehicle accepts. This does not program modules or disable ABS.");
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
  const live = await probeLiveData(scanner, answeredNodes);
  const report = showReport(sections, { live });
  const afterCodes = (report && gm && gm.collectCodesFromReport(report)) || (report && report.uniqueCodes) || [];
  const diff = gm ? gm.compareCodeSets(beforeCodes, afterCodes) : { cleared: [], remained: afterCodes, appeared: [], returned: [], couldNotClear: [] };
  publishUi(report, live, diff);
  if (historyApi()) {
    historyApi().addEntry({
      kind: "clear_all",
      label: label + " — after",
      adapterName,
      codesBefore: beforeCodes,
      codesAfter: afterCodes,
      cleared: diff.cleared,
      remained: diff.remained,
      appeared: diff.appeared,
      modulesReached: answeredNodes.map((n) => n.response),
      notes: "Could not clear = remained active after rescan.",
    });
    if (window.ATDDModuleDiagnosticsUi) window.ATDDModuleDiagnosticsUi.renderHistoryList();
  }
}

async function clearVehicle() {
  if (!ready) return;
  const accepted = await confirmDialog("clearCodesDialog", "clearCodesForm", "btnClearVehicleCancel");
  if (!accepted) {
    log("Clear cancelled. Nothing was sent to the vehicle.");
    return;
  }
  await perform(async () => {
    await runClearAndRescan("Clear vehicle codes");
  });
}

async function clearAllSupported() {
  if (!ready) return;
  const accepted = await confirmDialog(
    "clearAllSupportedDialog",
    "clearAllSupportedForm",
    "btnClearAllSupportedCancel"
  );
  if (!accepted) {
    log("Clear All Supported Codes cancelled. Nothing was sent to the vehicle.");
    return;
  }
  await perform(async () => {
    const scanner = active;
    if (!adapterReady) {
      await prepareAdapter(scanner);
      adapterReady = true;
    }
    log("Scanning all accessible modules before clear.");
    const beforeSections = await readSections(scanner);
    answeredNodes = await probeNodes(scanner, beforeSections);
    const beforeLive = await probeLiveData(scanner, answeredNodes);
    showReport(beforeSections, { live: beforeLive });
    await runClearAndRescan("Clear All Supported Codes");
  });
}

panel.querySelector(".lead").textContent =
  "Connect any ELM327-style Bluetooth OBD-II scanner, including FIXD. Compatibility is " + FIXD_COMPATIBILITY + ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "Full Vehicle Scan lists only codes and modules this adapter returns, including GM ABS/BCM candidates when they answer. Clear All Supported Codes requires confirmation and rescans. No simulated scanner data is used.";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect Scanner";
if (scanAll) scanAll.hidden = false;
const demoBtn = el("btnBtDemo");
if (demoBtn) demoBtn.remove();
el("btIphoneGate").hidden = true;
try {
  available = capacitorBleAvailable();
} catch {
  available = false;
}
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. FIXD and other ELM327-style adapters can be chosen. FIXD compatibility is " +
    FIXD_COMPATIBILITY +
    "."
  : "The native Bluetooth connection is unavailable in this copy.";
top.onclick = connect.onclick = () => choose();
if (scanAll) scanAll.onclick = () => choose();
read.onclick = fullVehicleScan;
if (clear) clear.onclick = clearVehicle;
if (clearAll) clearAll.onclick = clearAllSupported;
disconnect.onclick = () =>
  perform(async () => {
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
    log("Primary validation target: 2008 GMC Sierra 1500 SLT 5.3L. FIXD compatibility is " + FIXD_COMPATIBILITY + ".");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    adapterName = device.name || "BLE adapter";
    const fixdNamed = device.isFixdName ? " (FIXD-named device; protocol still " + FIXD_COMPATIBILITY + ")" : "";
    log("Connected to " + adapterName + fixdNamed + ". Tap Full Vehicle Scan.");
  });
}

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
};
