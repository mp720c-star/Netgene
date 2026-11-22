/* Current-session reset for classic ATDD (and packaged iOS www).
 * Browser script and Node-testable. Never sends an OBD command.
 * Saved vehicles / history are kept unless deleteSaved is explicitly true.
 */
(function (root) {
  const SAVED_VEHICLE_AND_HISTORY_KEYS = [
    "atdd.savedVehicles",
    "atdd.vehicles",
    "atdd.saved_vehicles",
    "ATDD_SAVED_VEHICLES",
    "savedVehicles",
    "vehicles",
    "atd_case_latest"
  ];

  const PRESERVED_KEYS = ["atd_legal_ok"];

  const TEXT_FIELD_IDS = [
    "make", "model", "engine", "mileage", "nickname", "codes", "notes", "dbQuery",
    "fluidCapacity", "fluidNotes", "vehicleQuery", "symptomQuery", "jobQuery", "solutionQuery"
  ];

  const SELECT_FIELD_IDS = [
    "year", "trans", "fuel", "fluidType", "fluidLevel", "fluidColor", "fluidSmell",
    "vehicleTypeFilter", "vehicleMakeFilter", "vehicleYearFilter",
    "symptomSystemFilter", "symptomTierFilter"
  ];

  const FLAG_IDS = [
    "flagRodKnock", "flagLowCompression", "flagBurnsOil", "flagMetalInOil", "flagNeedRebuild"
  ];

  const RESULTS_PLACEHOLDER = "Nothing yet. Capture sound or a photo, or enter a code, then tap Diagnose now.";
  const IDLE_BT_LOG = "Idle. Tap Connect, with the adapter powered in the OBD port.";

  function getItem(storage, key) {
    if (!storage || typeof storage.getItem !== "function") return null;
    try { return storage.getItem(key); } catch (_) { return null; }
  }

  function removeItem(storage, key) {
    if (!storage || typeof storage.removeItem !== "function") return;
    try { storage.removeItem(key); } catch (_) { /* quota / private mode */ }
  }

  function snapshotSaved(storage) {
    const out = {};
    SAVED_VEHICLE_AND_HISTORY_KEYS.concat(PRESERVED_KEYS).forEach((key) => {
      out[key] = getItem(storage, key);
    });
    return out;
  }

  function deleteSavedVehiclesAndHistory(storage) {
    if (!storage) return [];
    const removed = [];
    SAVED_VEHICLE_AND_HISTORY_KEYS.forEach((key) => {
      if (getItem(storage, key) != null) removed.push(key);
      removeItem(storage, key);
    });
    return removed;
  }

  function clearSessionState(state) {
    if (!state) return state;
    state.audioBlob = null;
    state.audioSummary = null;
    state.imageSummary = null;
    state.lastAnalysis = null;
    state.lastAnalysisText = "";
    state.selectedVehicle = null;
    state.currentStream = null;
    return state;
  }

  function setValue(el, value) {
    if (!el) return;
    el.value = value;
  }

  function setChecked(el, on) {
    if (!el) return;
    el.checked = !!on;
  }

  function clearElement(el) {
    if (!el) return;
    el.innerHTML = "";
  }

  function applyDomClear(byId, options) {
    const opts = options || {};
    const symptomCount = Number(opts.symptomCount || 0);
    TEXT_FIELD_IDS.forEach((id) => setValue(byId(id), ""));
    SELECT_FIELD_IDS.forEach((id) => setValue(byId(id), ""));
    FLAG_IDS.forEach((id) => setChecked(byId(id), false));
    for (let i = 0; i < symptomCount; i++) setChecked(byId("sym_" + i), false);

    const codeResults = byId("codeResults");
    if (codeResults) codeResults.innerHTML = "";
    const results = byId("results");
    if (results) results.innerHTML = RESULTS_PLACEHOLDER;
    const fluidOut = byId("fluidOut");
    if (fluidOut) fluidOut.textContent = "Fluid guidance will show here.";
    const audioSummary = byId("audioSummary");
    if (audioSummary) audioSummary.textContent = "No audio yet.";
    const imageSummary = byId("imageSummary");
    if (imageSummary) imageSummary.textContent = "No photo or frame yet.";

    ["selectedVehiclePanel", "cdiPinoutView", "symptomEntryView"].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.hidden = true;
      el.innerHTML = "";
    });

    const btLog = byId("btLog");
    if (btLog) btLog.textContent = IDLE_BT_LOG;

    const recBtn = byId("btnAudioRecord");
    if (recBtn) recBtn.textContent = "Start listening";

    ["photoPreview", "frameImage"].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.removeAttribute("src");
      el.hidden = true;
    });
    const audio = byId("audioPreview");
    if (audio) {
      audio.removeAttribute("src");
      if (typeof audio.load === "function") audio.load();
    }
    const video = byId("videoPreview");
    if (video) {
      try { video.pause(); } catch (_) { /* ignore */ }
      video.srcObject = null;
      if (video.hasAttribute("src")) video.removeAttribute("src");
    }
    const fileInputs = ["audioFile", "photoFile", "videoFile"];
    fileInputs.forEach((id) => setValue(byId(id), ""));
  }

  /**
   * Clear the in-progress scan / selected vehicle.
   * Does not send OBD writes. Does not delete saved vehicles or history
   * unless options.deleteSaved is true. Never removes atd_legal_ok.
   */
  function clearCurrentSession(options) {
    const opts = options || {};
    const storage = opts.storage;
    const deleteSaved = !!opts.deleteSaved;
    const before = snapshotSaved(storage);

    if (opts.state) clearSessionState(opts.state);
    if (typeof opts.byId === "function") {
      applyDomClear(opts.byId, { symptomCount: opts.symptomCount || 0 });
    }

    let removedKeys = [];
    if (deleteSaved) {
      removedKeys = deleteSavedVehiclesAndHistory(storage);
    }

    PRESERVED_KEYS.forEach((key) => {
      // Belt and suspenders: this action must not drop legal acceptance.
      if (before[key] != null && getItem(storage, key) == null && storage && typeof storage.setItem === "function") {
        try { storage.setItem(key, before[key]); } catch (_) { /* ignore */ }
      }
    });

    const after = snapshotSaved(storage);
    return {
      deletedSaved: deleteSaved,
      removedKeys,
      savedKept: !deleteSaved,
      legalAcceptance: after["atd_legal_ok"],
      savedSnapshotAfter: after
    };
  }

  const api = {
    SAVED_VEHICLE_AND_HISTORY_KEYS,
    PRESERVED_KEYS,
    TEXT_FIELD_IDS,
    SELECT_FIELD_IDS,
    FLAG_IDS,
    RESULTS_PLACEHOLDER,
    IDLE_BT_LOG,
    snapshotSaved,
    deleteSavedVehiclesAndHistory,
    clearSessionState,
    applyDomClear,
    clearCurrentSession
  };

  root.ATDDSessionReset = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
