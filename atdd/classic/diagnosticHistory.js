/**
 * ATDD diagnostic history — vehicle scan snapshots only.
 * Separate from the optional "delete ATDD scan history" UI action.
 * Never invents codes; stores only what a scan report already contained.
 */
(function (root) {
  "use strict";

  var STORAGE_KEY = "atdd_diagnostic_history_v1";
  var MAX_ENTRIES = 40;

  function loadRaw() {
    try {
      var text = localStorage.getItem(STORAGE_KEY);
      if (!text) return [];
      var parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function saveRaw(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function summarizeCodes(codes) {
    return (codes || []).map(function (c) {
      return String(c || "").toUpperCase();
    }).filter(Boolean);
  }

  function addEntry(entry) {
    var rows = loadRaw();
    var record = {
      id: "hist_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
      savedAt: new Date().toISOString(),
      kind: entry.kind || "scan",
      label: entry.label || "Vehicle scan",
      vehicle: entry.vehicle || null,
      adapterName: entry.adapterName || "",
      codesBefore: summarizeCodes(entry.codesBefore),
      codesAfter: summarizeCodes(entry.codesAfter),
      cleared: summarizeCodes(entry.cleared),
      remained: summarizeCodes(entry.remained),
      appeared: summarizeCodes(entry.appeared),
      modulesReached: Array.isArray(entry.modulesReached) ? entry.modulesReached.slice() : [],
      notes: String(entry.notes || ""),
      source: "vehicle", // never confuse with ATDD UI case history
    };
    rows.unshift(record);
    saveRaw(rows);
    return record;
  }

  function listEntries() {
    return loadRaw();
  }

  function deleteAllHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function deleteEntry(id) {
    var rows = loadRaw().filter(function (row) {
      return row.id !== id;
    });
    return saveRaw(rows);
  }

  root.ATDDDiagnosticHistory = {
    STORAGE_KEY: STORAGE_KEY,
    addEntry: addEntry,
    listEntries: listEntries,
    deleteAllHistory: deleteAllHistory,
    deleteEntry: deleteEntry,
  };
})(typeof window !== "undefined" ? window : globalThis);
