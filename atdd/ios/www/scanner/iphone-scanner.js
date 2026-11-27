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
const probeAbsBtn = el("btnBtProbeAbs");
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
let lastMilOn = false;

function scanApi() {
  const api = window.ATDDVehicleScan;
  if (!api) throw new Error("Vehicle scan parser is missing from this build.");
  return api;
}

function primaryVehicleLabel() {
  try {
    const v = window.ATDDVehicleScan && window.ATDDVehicleScan.PRIMARY_VEHICLE;
    if (v && v.label) return v.label;
  } catch (_) {
    /* launch must not die if the scan parser is late or incomplete */
  }
  return "2008 GMC Sierra 1500 SLT flex-fuel (GMT900)";
}

function setText(node, value) {
  if (node) node.textContent = value;
}

function readout() {
  return typeof window !== "undefined" ? window.ATDDScanReadout : null;
}

function buttons() {
  if (top) top.disabled = busy;
  if (connect) connect.disabled = busy || !available || Boolean(active);
  if (scanAll) scanAll.disabled = busy || !available || Boolean(active);
  if (read) read.disabled = busy || !ready;
  if (probeAbsBtn) probeAbsBtn.disabled = busy || !ready;
  if (clear) clear.disabled = busy || !ready;
  if (disconnect) disconnect.disabled = busy || !ready;
}

function log(message) {
  if (!output) return;
  output.textContent += (output.textContent ? "\n" : "") + message;
  output.scrollTop = output.scrollHeight;
}

async function release(scanner) {
  if (active === scanner) {
    active = undefined;
    ready = false;
    adapterReady = false;
    answeredNodes = [];
    lastMilOn = false;
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
  for (const command of api.RESTORE_HEADER) await sendOptional(scanner, command, 2500);
  await sendOptional(scanner, "ATH0", 2500);
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
    log(label + " parse: " + (error?.message || error));
    const api = readout();
    if (api && command === "03") {
      api.showScanReadout({ ok: false, reply, error: error?.message || String(error) });
    }
    return { codes: [], reply, error };
  }
}

async function applyNodeHeaderSoft(scanner, node) {
  const api = scanApi();
  const commands = typeof api.adapterHeaderSoft === "function"
    ? api.adapterHeaderSoft(node)
    : ["ATSH" + node.request];
  for (const command of commands) {
    await sendOptional(scanner, command, 2000);
  }
}

async function readModuleStepsSafe(scanner, node, sections) {
  const api = scanApi();
  const steps = api.MODULE_READS_SAFE || [
    { command: "03", timeoutMs: 2500, label: "stored codes" },
    { command: "07", timeoutMs: 2500, label: "pending codes" },
  ];
  let nodeAnswered = false;
  for (const step of steps) {
    // No 1902FF / 1003 here — extended session and long UDS probes upset some GMT900 trucks mid-scan.
    const reply = await sendOptional(scanner, step.command, step.timeoutMs || 2500);
    sections.push({ label: (node.label || node.response) + " " + step.label, raw: reply });
    if (api.replyHasVehicleData(reply)) nodeAnswered = true;
  }
  return nodeAnswered;
}

/** Optional short ABS probe only — never the old 22-module marathon. */
async function probeAbsShort(scanner, sections) {
  const api = scanApi();
  const nodes = api.SIERRA_ABS_PROBE_NODES || api.GM_CANDIDATE_NODES || [];
  const answered = [];
  log(
    "Short ABS probe for " +
      primaryVehicleLabel() +
      " (" +
      nodes.length +
      " candidates, soft headers, no extended session)."
  );
  await sendOptional(scanner, "ATH1", 2000);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    log("ABS candidate " + (node.label || node.request) + " (" + (index + 1) + " of " + nodes.length + ").");
    await applyNodeHeaderSoft(scanner, node);
    const nodeAnswered = await readModuleStepsSafe(scanner, node, sections);
    if (nodeAnswered) {
      answered.push({ request: node.request, response: node.response, label: node.label || "" });
      rememberNode(node);
    }
  }
  await restoreFunctional(scanner);
  return answered;
}

/** Default Read codes: emissions only. Stops before the bus thrash that was cranking/upsetting the truck. */
async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    log("Quick emissions read for " + primaryVehicleLabel() + ". Key on, engine off. ABS is a separate button.");
    await prepareAdapter(scanner);

    const stored = await readModeFamily(scanner, "03", "stored codes", 12000);
    if (stored.error && !stored.codes.length && /incomplete|did not reply|rejected/i.test(stored.error.message || stored.error)) {
      throw new Error(stored.error.message || String(stored.error));
    }
    let codes = showCodes(stored.codes, stored.reply, "Stored codes");

    const pending = await readModeFamily(scanner, "07", "pending codes", 10000);
    codes = showCodes(mergeUnique(codes, pending.codes), [stored.reply, pending.reply].filter(Boolean).join("\n"), "Stored/pending codes");

    const permanent = await readModeFamily(scanner, "0A", "permanent codes", 8000);
    codes = showCodes(
      mergeUnique(codes, permanent.codes),
      [stored.reply, pending.reply, permanent.reply].filter(Boolean).join("\n"),
      "Codes"
    );

    const statusReply = await sendOptional(scanner, "0101", 6000);
    lastMilOn = /41\s*01\s*[8-9A-F]/i.test(String(statusReply).replace(/\s+/g, ""));
    if (statusReply) {
      log(
        lastMilOn
          ? "Engine / MIL status: on (at least one computer)."
          : "Engine / MIL status: off on answering computers."
      );
    }

    await restoreFunctional(scanner);
    log("Emissions read finished. Truck bus left at functional OBD address — no deep module sweep.");

    if (!codes.length) {
      if (!lastMilOn) {
        log(
          "No engine codes and MIL off — Clear will not change a check-engine light that is already off. " +
            "If the brake / ABS light is on, tap Probe ABS (short), then Clear. FIXD often cannot reach Sierra EBCM."
        );
      } else {
        log("MIL looks on but Mode 03/07 returned no codes. Retry key on, engine off.");
      }
    } else {
      log("Tap Clear engine / brake lights to send Mode 04 (and ABS clear if a module answered).");
    }
  });
}

async function probeAbsOnly() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    await prepareAdapter(scanner);
    const sections = [];
    const hits = await probeAbsShort(scanner, sections);
    const report = scanApi().buildReport(sections);
    if (report.uniqueCodes.length) {
      const existing = field.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      showCodes(mergeUnique(existing, report.uniqueCodes), sections.map((s) => s.raw).join("\n"), "Codes incl. ABS");
    }
    if (report.chassisCodes.length) {
      log("ABS/chassis codes: " + report.chassisCodes.join(", ") + ". Tap Clear to try clearing them.");
    } else if (hits.length) {
      log("ABS candidates answered but returned no C-codes.");
    } else {
      log(
        "No ABS/EBCM answer on FIXD for " +
          primaryVehicleLabel() +
          ". Brake light cannot be cleared through this adapter — need an EBCM-capable tool."
      );
    }
  });
}

function confirmClear() {
  const dialog = el("clearCodesDialog");
  const confirmBtn = el("btnClearVehicleConfirm");
  const cancelBtn = el("btnClearVehicleCancel");
  if (!dialog || typeof dialog.showModal !== "function" || !confirmBtn) {
    return Promise.resolve(
      window.confirm(
        "Clear engine (Mode 04) and try ABS/brake module clear on " +
          primaryVehicleLabel() +
          "? Park, key on, engine off."
      )
    );
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
    log("Clear for " + primaryVehicleLabel() + " — engine Mode 04, then short ABS clear tries. Key on, engine off.");

    await prepareAdapter(scanner);
    await restoreFunctional(scanner);

    const beforeStored = await readModeFamily(scanner, "03", "stored codes before clear", 10000);
    const beforePending = await readModeFamily(scanner, "07", "pending codes before clear", 8000);
    const before = mergeUnique(beforeStored.codes.slice(), beforePending.codes);
    showCodes(before, [beforeStored.reply, beforePending.reply].filter(Boolean).join("\n"), "Before clear");

    log("Clearing engine / check-engine path (Mode 04).");
    let emissions = await sendOptional(scanner, api.CLEAR_EMISSIONS, 8000);
    if (!clearAccepted(emissions)) {
      await prepareAdapter(scanner);
      await restoreFunctional(scanner);
      emissions = await sendLogged(scanner, api.CLEAR_EMISSIONS, 8000);
    }
    if (clearAccepted(emissions)) log("Mode 04 accepted — engine light should clear if codes were only emissions stored/pending.");
    else log("Mode 04 inconclusive.");

    const clearTargets = [];
    const seen = new Set();
    function addTarget(node) {
      const key = String(node.request || "").toUpperCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      clearTargets.push(node);
    }
    answeredNodes.forEach(addTarget);
    (api.SIERRA_ABS_PROBE_NODES || api.GM_CANDIDATE_NODES || []).forEach(addTarget);

    log("Trying brake / ABS module clear on " + clearTargets.length + " short-list candidates (soft headers only).");
    let absCleared = 0;
    await sendOptional(scanner, "ATH1", 2000);
    for (const node of clearTargets) {
      await applyNodeHeaderSoft(scanner, node);
      const cleared = await sendOptional(scanner, api.CLEAR_MODULE, 5000);
      if (clearAccepted(cleared)) {
        absCleared++;
        log("Module clear accepted at " + (node.label || node.request) + ".");
      }
    }
    await restoreFunctional(scanner);

    if (!absCleared) {
      log(
        "No ABS/EBCM accepted a clear on FIXD. Brake / ABS dash light may stay on for " +
          primaryVehicleLabel() +
          " until an EBCM-capable tool clears it."
      );
    }

    log("Rescanning emissions after clear.");
    await prepareAdapter(scanner);
    const afterStored = await readModeFamily(scanner, "03", "stored codes after clear", 10000);
    const afterPending = await readModeFamily(scanner, "07", "pending codes after clear", 8000);
    const after = mergeUnique(afterStored.codes.slice(), afterPending.codes);
    showCodes(after, [afterStored.reply, afterPending.reply].filter(Boolean).join("\n"), "After clear");

    const gone = before.filter((code) => !after.includes(code));
    const stayed = after.filter((code) => before.includes(code));
    if (gone.length) log("Engine codes cleared on rescan: " + gone.join(", ") + ".");
    if (stayed.length) log("Still present after clear: " + stayed.join(", ") + ".");
    if (!before.length && !after.length && !lastMilOn) {
      log("Engine path already empty before clear. Brake light depends on ABS module reachability above.");
    }
  });
}

function wireScannerUi() {
  if (!panel) return;
  const lead = panel.querySelector(".lead");
  const heading = panel.querySelector("h2");
  const help = panel.querySelector("p.small.mt-8");
  // Keep launch text simple — do not call scanApi() during cold start.
  setText(
    lead,
    "Connect a FIXD or generic ELM327-style BLE OBD-II reader, then Read codes. Tuned for " +
      primaryVehicleLabel() +
      ". FIXD claim is " +
      FIXD_COMPATIBILITY +
      "."
  );
  setText(heading, "Connect OBD-II Scanner");
  setText(
    help,
    "Read codes is a short emissions scan only so the Sierra stays quiet. Probe ABS (short) is optional. Clear engine / brake lights sends Mode 04 and soft ABS clears. FIXD may not reach EBCM. No simulated data."
  );
  setText(connect, "Connect OBD-II Scanner");
  setText(top, "Connect");
  if (clear) setText(clear, "Clear engine / brake lights");
  if (probeAbsBtn) setText(probeAbsBtn, "Probe ABS (short)");
  if (scanAll) scanAll.hidden = false;
  const demoBtn = el("btnBtDemo");
  if (demoBtn) demoBtn.remove();
  const gate = el("btIphoneGate");
  if (gate) gate.hidden = true;
  try {
    available = capacitorBleAvailable();
  } catch (_) {
    available = false;
  }
  setText(
    el("btSupport"),
    available
      ? "iPhone Bluetooth ready. Tuned for " + primaryVehicleLabel() + ". FIXD claim " + FIXD_COMPATIBILITY + "."
      : "The native Bluetooth connection is unavailable in this copy."
  );
  if (top) top.onclick = () => choose();
  if (connect) connect.onclick = () => choose();
  if (scanAll) scanAll.onclick = () => choose();
  if (read) read.onclick = readVehicle;
  if (probeAbsBtn) probeAbsBtn.onclick = probeAbsOnly;
  if (clear) clear.onclick = clearVehicle;
  if (disconnect) {
    disconnect.onclick = () =>
      perform(async () => {
        await release(active);
        log("Disconnected.");
      });
  }
  buttons();
}

async function choose() {
  if (panel) {
    panel.hidden = false;
    panel.scrollIntoView({ block: "start" });
  }
  if (active || !available) return;
  await perform(async () => {
    if (output) output.textContent = "";
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
    log("Choose FIXD or another ELM327-style BLE adapter. Primary truck: " + primaryVehicleLabel() + ".");
    log("FIXD compatibility is " + FIXD_COMPATIBILITY + ".");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    adapterReady = false;
    answeredNodes = [];
    const name = device.name || "BLE adapter";
    const fixdName = device.isFixdName ? " (FIXD-named device)" : "";
    log("Connected to " + name + fixdName + ". Tap Read codes (short emissions only). Use Probe ABS only if needed.");
  });
}

window.ATDDIphoneScanner = {
  async resetSession() {
    await release(active);
    if (output) output.textContent = "Idle. Tap Connect, with the adapter powered in the OBD port.";
  },
  ELM_ADAPTER_INIT,
};

try {
  wireScannerUi();
} catch (error) {
  // Never let scanner wiring abort the Capacitor shell before the UI opens.
  try {
    const support = el("btSupport");
    if (support) support.textContent = "Scanner UI failed to start: " + (error && error.message ? error.message : error);
  } catch (_) {
    /* ignore */
  }
}
