import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ios = path.resolve(classic, "../ios");

function loadApi(filePath) {
  const ctx = { window: {}, globalThis: null };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  runInNewContext(fs.readFileSync(filePath, "utf8"), ctx);
  return ctx.ATDDSessionReset;
}

const Reset = loadApi(path.join(classic, "sessionReset.js"));
assert.ok(Reset && typeof Reset.clearCurrentSession === "function");

function memoryStorage(initial) {
  const data = { ...(initial || {}) };
  return {
    data,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    }
  };
}

function fakeDom() {
  const nodes = {};
  const make = (id, extra) => {
    nodes[id] = {
      id,
      value: "",
      checked: false,
      hidden: false,
      innerHTML: "stale",
      textContent: "stale",
      src: "blob:old",
      srcObject: { kind: "stream" },
      hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this, name); },
      removeAttribute(name) { delete this[name]; },
      pause() { this.paused = true; },
      load() { this.loaded = true; },
      ...extra
    };
    return nodes[id];
  };
  [
    "make", "model", "engine", "mileage", "nickname", "codes", "notes", "dbQuery",
    "fluidCapacity", "fluidNotes", "vehicleQuery", "symptomQuery", "jobQuery", "solutionQuery",
    "year", "trans", "fuel", "fluidType", "fluidLevel", "fluidColor", "fluidSmell",
    "vehicleTypeFilter", "vehicleMakeFilter", "vehicleYearFilter",
    "symptomSystemFilter", "symptomTierFilter",
    "flagRodKnock", "flagLowCompression", "flagBurnsOil", "flagMetalInOil", "flagNeedRebuild",
    "sym_0", "sym_1",
    "codeResults", "results", "fluidOut", "audioSummary", "imageSummary",
    "selectedVehiclePanel", "cdiPinoutView", "symptomEntryView", "btLog",
    "btnAudioRecord", "photoPreview", "frameImage", "audioPreview", "videoPreview",
    "audioFile", "photoFile", "videoFile"
  ].forEach((id) => make(id));
  nodes.codes.value = "P0300\nP0420";
  nodes.notes.value = "Stalls warm";
  nodes.make.value = "Ford";
  nodes.model.value = "F-150";
  nodes.year.value = "2014";
  nodes.vehicleQuery.value = "F-150";
  nodes.symptomQuery.value = "misfire";
  nodes.sym_0.checked = true;
  nodes.sym_1.checked = true;
  nodes.flagRodKnock.checked = true;
  nodes.codeResults.innerHTML = "<div>P0300</div>";
  nodes.results.innerHTML = "<div>Diagnosis</div>";
  nodes.selectedVehiclePanel.hidden = false;
  nodes.selectedVehiclePanel.innerHTML = "<div>Selected</div>";
  nodes.btLog.textContent = "Connected. Codes: P0300";
  nodes.btnAudioRecord.textContent = "Stop Audio Recording";
  return {
    nodes,
    byId(id) { return nodes[id] || null; }
  };
}

{
  const storage = memoryStorage({
    "atdd.savedVehicles": JSON.stringify([{ id: "v1", name: "Work truck", year: "2014", make: "Ford", model: "F-150" }]),
    "atd_case_latest": JSON.stringify({ notes: "saved case", dtcs: ["P0300"] }),
    "atdd.saved_vehicles": JSON.stringify([{ id: "legacy" }]),
    atd_legal_ok: "1"
  });
  const { byId, nodes } = fakeDom();
  const state = {
    audioBlob: { size: 12 },
    audioSummary: { rms: 0.2 },
    imageSummary: { whiteRatio: 0.1 },
    lastAnalysis: { summary: { primaryFinding: "misfire" } },
    lastAnalysisText: "a report",
    selectedVehicle: { id: "ford-f150", make: "Ford" },
    currentStream: { getTracks() { return []; } }
  };

  const result = Reset.clearCurrentSession({
    storage,
    deleteSaved: false,
    byId,
    state,
    symptomCount: 2
  });

  assert.equal(result.savedKept, true);
  assert.equal(result.deletedSaved, false);
  assert.equal(JSON.stringify(result.removedKeys), "[]");
  assert.equal(storage.getItem("atdd.savedVehicles"), JSON.stringify([{ id: "v1", name: "Work truck", year: "2014", make: "Ford", model: "F-150" }]));
  assert.ok(storage.getItem("atd_case_latest"));
  assert.ok(storage.getItem("atdd.saved_vehicles"));
  assert.equal(storage.getItem("atd_legal_ok"), "1");
  assert.equal(result.legalAcceptance, "1");

  assert.equal(state.audioBlob, null);
  assert.equal(state.audioSummary, null);
  assert.equal(state.imageSummary, null);
  assert.equal(state.lastAnalysis, null);
  assert.equal(state.lastAnalysisText, "");
  assert.equal(state.selectedVehicle, null);
  assert.equal(state.currentStream, null);

  assert.equal(nodes.codes.value, "");
  assert.equal(nodes.notes.value, "");
  assert.equal(nodes.make.value, "");
  assert.equal(nodes.model.value, "");
  assert.equal(nodes.year.value, "");
  assert.equal(nodes.vehicleQuery.value, "");
  assert.equal(nodes.symptomQuery.value, "");
  assert.equal(nodes.sym_0.checked, false);
  assert.equal(nodes.sym_1.checked, false);
  assert.equal(nodes.flagRodKnock.checked, false);
  assert.equal(nodes.codeResults.innerHTML, "");
  assert.equal(nodes.results.innerHTML, Reset.RESULTS_PLACEHOLDER);
  assert.equal(nodes.fluidOut.textContent, "Fluid guidance will show here.");
  assert.equal(nodes.audioSummary.textContent, "No audio yet.");
  assert.equal(nodes.imageSummary.textContent, "No photo or frame yet.");
  assert.equal(nodes.selectedVehiclePanel.hidden, true);
  assert.equal(nodes.selectedVehiclePanel.innerHTML, "");
  assert.equal(nodes.btLog.textContent, Reset.IDLE_BT_LOG);
  assert.equal(nodes.btnAudioRecord.textContent, "Start listening");
  console.log("session-reset: current state is fully cleared and saved vehicles/history are kept by default");
}

{
  const storage = memoryStorage({
    "atdd.savedVehicles": JSON.stringify([{ id: "v1" }]),
    "atd_case_latest": JSON.stringify({ notes: "keep or drop" }),
    "ATDD_SAVED_VEHICLES": JSON.stringify([{ id: "legacy2" }]),
    atd_legal_ok: "1"
  });
  const result = Reset.clearCurrentSession({
    storage,
    deleteSaved: true,
    byId: () => null,
    state: { lastAnalysis: { ok: true }, selectedVehicle: { id: "x" } }
  });
  assert.equal(result.deletedSaved, true);
  assert.equal(result.savedKept, false);
  assert.equal(storage.getItem("atdd.savedVehicles"), null);
  assert.equal(storage.getItem("atd_case_latest"), null);
  assert.equal(storage.getItem("ATDD_SAVED_VEHICLES"), null);
  assert.equal(storage.getItem("atd_legal_ok"), "1");
  assert.ok(result.removedKeys.includes("atdd.savedVehicles"));
  assert.ok(result.removedKeys.includes("atd_case_latest"));
  console.log("session-reset: optional flag deletes saved vehicles/history but keeps legal acceptance");
}

{
  const html = fs.readFileSync(path.join(classic, "index.html"), "utf8");
  assert.match(html, /id="btnNewScanTop"/);
  assert.doesNotMatch(html, /id="btnNewScanVehicle"/);
  assert.doesNotMatch(html, /id="btnNewScanResults"/);
  assert.match(html, /New scan \/ New vehicle/);
  assert.match(html, /id="btnClearCodes"/);
  assert.doesNotMatch(html, /id="btnClearCase"/);
  assert.match(html, /id="newScanDialog"/);
  assert.match(html, /id="chkDeleteSavedHistory"/);
  assert.match(html, /src="\.\/sessionReset\.js"/);
  assert.doesNotMatch(html, /id="chkDeleteSavedHistory"[^>]*checked/);
  const dialog = html.slice(html.indexOf('id="newScanDialog"'));
  assert.match(dialog, /also delete saved vehicles\/history/i);
  console.log("session-reset: New scan / New vehicle button and confirm dialog are in classic HTML");
}

{
  const app = fs.readFileSync(path.join(classic, "app.js"), "utf8");
  assert.match(app, /function openNewScanDialog/);
  assert.match(app, /function confirmNewScan/);
  assert.match(app, /window\.ATDDSessionReset/);
  assert.match(app, /Reset\.clearCurrentSession/);
  assert.match(app, /resetScannerSession/);
  assert.match(app, /chkDeleteSavedHistory/);
  assert.doesNotMatch(app, /sendCommand\(["']04/);
  assert.doesNotMatch(app, /resetScannerSession[\s\S]{0,400}send\(/);
  console.log("session-reset: app.js confirms first and calls session reset + BLE reset");
}

{
  const bluetooth = fs.readFileSync(path.join(classic, "bluetooth.js"), "utf8");
  assert.match(bluetooth, /resetSession:\s*disconnect/);
  const disconnectFn = bluetooth.slice(bluetooth.indexOf("async function disconnect()"), bluetooth.indexOf("async function connectLive"));
  assert.doesNotMatch(disconnectFn, /sendCommand/);
  assert.doesNotMatch(disconnectFn, /writeValue/);
  assert.doesNotMatch(disconnectFn, /["']04["']/);
  assert.match(disconnectFn, /device\.gatt\.disconnect/);
  console.log("session-reset: classic BLE reset disconnects without an OBD write or Mode 04");
}

{
  const scanner = fs.readFileSync(path.join(ios, "scanner/iphone-scanner.js"), "utf8");
  assert.match(scanner, /ATDDIphoneScanner/);
  assert.match(scanner, /async resetSession/);
  const resetStart = scanner.indexOf("async resetSession");
  const resetFn = scanner.slice(resetStart, resetStart + 400);
  assert.match(resetFn, /release\(active\)/);
  assert.doesNotMatch(resetFn, /\.send\(/);
  assert.doesNotMatch(resetFn, /["']04["']/);
  // Guard must stay unchanged: Mode 03 only, Mode 04 blocked in the read path.
  assert.match(scanner, /scanner\.send\("03"\)/);
  assert.match(scanner, /Mode 04 clear-codes and AT writes are blocked/);
  console.log("session-reset: iPhone scanner reset disconnects only; Mode 04 guard unchanged");
}

{
  const guard = fs.readFileSync(path.join(classic, "../web/js/obd-command-guard.js"), "utf8");
  assert.match(guard, /normalized === "04"/);
  assert.match(guard, /Mode 04/);
  console.log("session-reset: OBD command guard is unchanged");
}

console.log("session-reset.test.mjs passed");
