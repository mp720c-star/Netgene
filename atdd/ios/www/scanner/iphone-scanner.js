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
  adapterReady = true;
}

async function restoreFunctional(scanner) {
  const api = scanApi();
  for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 3000);
  await sendOptional(scanner, "ATH0", 3000);
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

function rememberNode(node) {
  if (!node?.request) return;
  if (answeredNodes.some((item) => item.request === node.request)) return;
  answeredNodes.push({
    request: node.request,
    response: node.response,
    label: node.label || "",
  });
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

async function applyNodeHeader(scanner, node, soft) {
  const api = scanApi();
  const commands = soft && typeof api.adapterHeaderSoft === "function"
    ? api.adapterHeaderSoft(node)
    : api.adapterHeader(node);
  let rejected = false;
  for (const command of commands) {
    const reply = await sendOptional(scanner, command, 2500);
    if (/\?/.test(reply)) rejected = true;
  }
  return !rejected;
}

async function readModuleSteps(scanner, node, sections) {
  const api = scanApi();
  let nodeAnswered = false;
  for (const step of api.MODULE_READS) {
    let reply = await sendOptional(scanner, step.command, Math.min(step.timeoutMs || 4000, 4000));
    if (step.command === "1902FF" && api.needsExtendedSession(reply)) {
      await sendOptional(scanner, api.EXTENDED_SESSION, 3000);
      reply = await sendOptional(scanner, step.command, 4000);
      await sendOptional(scanner, api.DEFAULT_SESSION, 3000);
    }
    sections.push({ label: (node.label || node.response) + " " + step.label, raw: reply });
    if (api.replyHasVehicleData(reply)) nodeAnswered = true;
  }
  return nodeAnswered;
}

async function probeAbsFast(scanner, sections) {
  const api = scanApi();
  const nodes = typeof api.chassisAbsCandidates === "function"
    ? api.chassisAbsCandidates()
    : (api.GM_CANDIDATE_NODES || []);
  const answered = [];
  log("ABS/chassis fast probe (" + nodes.length + " candidates). Soft headers first for FIXD-class adapters.");
  await sendOptional(scanner, "ATH1", 2500);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    log("ABS candidate " + (node.label || node.request) + " (" + (index + 1) + " of " + nodes.length + ").");
    let ok = await applyNodeHeader(scanner, node, true);
    let nodeAnswered = await readModuleSteps(scanner, node, sections);
    if (!nodeAnswered) {
      ok = await applyNodeHeader(scanner, node, false);
      if (ok) nodeAnswered = await readModuleSteps(scanner, node, sections);
    }
    if (nodeAnswered) {
      answered.push({ request: node.request, response: node.response, label: node.label || "" });
      rememberNode(node);
    }
  }
  await restoreFunctional(scanner);
  return answered;
}

async function probeRemainingModules(scanner, sections, already) {
  const api = scanApi();
  const seen = new Set(already.map((node) => String(node.request).toUpperCase()));
  const nodes = (typeof api.allProbeNodes === "function"
    ? api.allProbeNodes()
    : api.PHYSICAL_NODES.concat(api.EXTRA_NODES)
  ).filter((node) => !seen.has(String(node.request).toUpperCase()));
  const answered = already.slice();
  if (!nodes.length) return answered;
  log("Probing remaining modules (" + nodes.length + "). Silent modules are skipped.");
  await sendOptional(scanner, "ATH1", 2500);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.request.length === 8 && answered.some((item) => item.request.length === 8 && item.unsupported)) break;
    log("Module " + (node.label || node.response) + " (" + (index + 1) + " of " + nodes.length + ").");
    let setupFailed = false;
    const softOk = await applyNodeHeader(scanner, node, true);
    if (!softOk && node.request.length === 8) {
      answered.push({ request: node.request, response: node.response, unsupported: true });
      setupFailed = true;
    }
    if (setupFailed) continue;
    let nodeAnswered = await readModuleSteps(scanner, node, sections);
    if (!nodeAnswered) {
      await applyNodeHeader(scanner, node, false);
      nodeAnswered = await readModuleSteps(scanner, node, sections);
    }
    if (nodeAnswered) {
      const hit = { request: node.request, response: node.response, label: node.label || "" };
      answered.push(hit);
      rememberNode(hit);
    }
  }
  await restoreFunctional(scanner);
  return answered.filter((node) => !node.unsupported);
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    await prepareAdapter(scanner);

    // FIXD-critical path: Mode 03 first.
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

    const statusReply = await sendOptional(scanner, "0101", 6000);
    const milOn = /41\s*01\s*[8-9A-F]/i.test(String(statusReply).replace(/\s+/g, ""));
    if (statusReply) {
      log(
        milOn
          ? "Mode 01 PID 01: check-engine / MIL bit is on for at least one answering computer."
          : "Mode 01 PID 01: check-engine / MIL bit is off on the answering computers."
      );
    }

    const sections = [
      { label: "stored codes", raw: stored.reply },
      { label: "pending codes", raw: pending.reply },
      { label: "permanent codes", raw: permanent.reply },
    ];

    try {
      const absHits = await probeAbsFast(scanner, sections);
      let report = scanApi().buildReport(sections);
      if (report.uniqueCodes.length) {
        codes = showCodes(mergeUnique(codes, report.uniqueCodes), sections.map((s) => s.raw).join("\n"), "Codes");
      }
      if (report.chassisCodes.length) {
        log("ABS/chassis codes from answering modules: " + report.chassisCodes.join(", ") + ".");
      } else if (absHits.length) {
        log("ABS candidates answered but no C-codes were in the replies.");
      } else {
        log("No ABS/chassis module answered on the fast probe. Continuing with other modules.");
      }

      answeredNodes = await probeRemainingModules(scanner, sections, absHits);
      report = scanApi().buildReport(sections);
      if (report.uniqueCodes.length) {
        codes = showCodes(mergeUnique(codes, report.uniqueCodes), sections.map((s) => s.raw).join("\n"), "Codes");
      }
      if (report.chassisCodes.length) {
        log("ABS/chassis codes after full probe: " + report.chassisCodes.join(", ") + ".");
      } else if (!absHits.length) {
        log(
          "No ABS/chassis module answered on FIXD. Emissions Mode 03/07/0A still listed — nothing was invented. " +
            "On many GMT900 trucks the EBCM is not reachable from this adapter's HS-CAN bridge."
        );
      }
    } catch (error) {
      log("Module probe skipped after primary read: " + (error?.message || error));
      await restoreFunctional(scanner);
    }

    if (!codes.length) {
      if (!milOn) {
        log(
          "The PCM reported no stored/pending codes and MIL off. Clear will have nothing emissions-side to erase. " +
            "If an ABS light is on, that module did not answer FIXD — need an EBCM-capable tool for those codes."
        );
      } else {
        log("Primary Mode 03/07/0A returned no codes while MIL looks on. Retry with key on, engine off, then re-read.");
      }
    }
  });
}

function confirmClear() {
  const dialog = el("clearCodesDialog");
  const confirmBtn = el("btnClearVehicleConfirm");
  const cancelBtn = el("btnClearVehicleCancel");
  if (!dialog || typeof dialog.showModal !== "function" || !confirmBtn) {
    return Promise.resolve(window.confirm("Clear codes on this vehicle? Park, key on, engine off."));
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      confirmBtn.removeEventListener("click", onConfirm);
      if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);
      dialog.removeEventListener("cancel", onCancel);
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const onConfirm = (event) => {
      event.preventDefault();
      finish(true);
    };
    const onCancel = () => finish(false);
    confirmBtn.addEventListener("click", onConfirm);
    if (cancelBtn) cancelBtn.addEventListener("click", onCancel);
    dialog.addEventListener("cancel", onCancel);
    dialog.showModal();
  });
}

function clearAccepted(reply) {
  const text = String(reply || "").toUpperCase();
  if (!text.trim()) return false;
  if (/\bNO DATA\b|\bUNABLE TO CONNECT\b|\bCAN ERROR\b|\b\?\b/.test(text)) return false;
  return /\bOK\b|44|54|7F14/.test(text) || /[0-9A-F]/.test(text.replace(/[^0-9A-F]/g, ""));
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

    // Full adapter reset — required after physical ABS headers or a cold connect.
    await prepareAdapter(scanner);
    await restoreFunctional(scanner);

    // Before snapshot so the operator can see what clear changed.
    const beforeStored = await readModeFamily(scanner, "03", "stored codes before clear", 12000);
    const beforePending = await readModeFamily(scanner, "07", "pending codes before clear", 8000);
    const before = mergeUnique(beforeStored.codes.slice(), beforePending.codes);
    showCodes(before, [beforeStored.reply, beforePending.reply].filter(Boolean).join("\n"), "Before clear");

    // Always try ABS candidates for module clear, even if the last read found none.
    const clearTargets = [];
    const seen = new Set();
    function addTarget(node) {
      const key = String(node.request || "").toUpperCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      clearTargets.push(node);
    }
    answeredNodes.forEach(addTarget);
    (typeof api.chassisAbsCandidates === "function" ? api.chassisAbsCandidates() : api.GM_CANDIDATE_NODES || []).forEach(addTarget);

    log("Clearing emissions (Mode 04) on the functional address.");
    let emissions = await sendOptional(scanner, api.CLEAR_EMISSIONS, 8000);
    if (!clearAccepted(emissions)) {
      log("Mode 04 did not look accepted. Resetting adapter and retrying once.");
      await prepareAdapter(scanner);
      await restoreFunctional(scanner);
      emissions = await sendLogged(scanner, api.CLEAR_EMISSIONS, 8000);
    }
    if (clearAccepted(emissions)) log("Mode 04 reply looked accepted.");
    else log("Mode 04 reply was inconclusive. Continuing with module clears.");

    log("Clearing ABS/chassis and other module candidates (" + clearTargets.length + ").");
    await sendOptional(scanner, "ATH1", 2500);
    for (const node of clearTargets) {
      log("Module clear → " + (node.label || node.request));
      await applyNodeHeader(scanner, node, true);
      let cleared = await sendOptional(scanner, api.CLEAR_MODULE, 8000);
      if (!clearAccepted(cleared)) {
        await applyNodeHeader(scanner, node, false);
        cleared = await sendOptional(scanner, api.CLEAR_MODULE, 8000);
      }
      if (clearAccepted(cleared)) log("Module clear accepted at " + (node.label || node.request) + ".");
    }
    await restoreFunctional(scanner);

    log("Reading codes again after clear.");
    await prepareAdapter(scanner);
    const afterStored = await readModeFamily(scanner, "03", "stored codes after clear", 12000);
    const afterPending = await readModeFamily(scanner, "07", "pending codes after clear", 8000);
    const afterPermanent = await readModeFamily(scanner, "0A", "permanent codes after clear", 8000);
    const after = mergeUnique(mergeUnique(afterStored.codes.slice(), afterPending.codes), afterPermanent.codes);
    showCodes(after, [afterStored.reply, afterPending.reply, afterPermanent.reply].filter(Boolean).join("\n"), "After clear");

    const cleared = before.filter((code) => !after.includes(code));
    const remained = after.filter((code) => before.includes(code));
    if (cleared.length) log("Cleared (gone on rescan): " + cleared.join(", ") + ".");
    if (remained.length) log("Still present after clear: " + remained.join(", ") + ".");
    if (afterPermanent.codes.length) {
      log("Permanent (0A) codes may stay until the monitor runs a drive cycle — Mode 04 does not always erase them.");
    }
    if (!before.length && !after.length) {
      log("No stored/pending codes before or after clear. If the light is still on, run Read codes again with key on, engine off.");
    }
  });
}

panel.querySelector(".lead").textContent =
  "Connect a FIXD or generic ELM327-style BLE OBD-II reader, then Read codes. FIXD brand protocol claim is " +
  FIXD_COMPATIBILITY +
  ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "Read codes starts with Mode 03, then a fast ABS/chassis probe, then other modules. Clear resets the adapter, sends Mode 04, clears ABS/module candidates, and rescans. Permanent codes may remain until a drive cycle. No simulated scanner data is used.";
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
    adapterReady = false;
    answeredNodes = [];
    const name = device.name || "BLE adapter";
    const fixdName = device.isFixdName ? " (FIXD-named device)" : "";
    log("Connected to " + name + fixdName + ". Tap Read codes (Mode 03 first, then ABS probe) or Clear codes.");
  });
}

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
  ELM_ADAPTER_INIT,
};
