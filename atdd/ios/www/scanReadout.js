/**
 * Inline Mode 03 results shown directly under the Connect OBD-II Scanner card.
 * Codes must come from a successful parser result. This module never invents
 * a DTC or a meaning that is not in the packaged database.
 */
(function (root) {
  const UNKNOWN_CODE = "Unknown code – not in database";
  const NO_STORED_CODES = "No stored codes";
  const COULD_NOT_PARSE = "could not parse";

  function lookupScannedCode(code, lookupFn) {
    const normalized = String(code || "").trim().toUpperCase();
    if (typeof lookupFn === "function") {
      const custom = lookupFn(normalized);
      if (custom && custom.inDatabase) {
        return { code: normalized, description: String(custom.description || ""), inDatabase: true };
      }
      return { code: normalized, description: UNKNOWN_CODE, inDatabase: false };
    }
    const unknown = (root && root.DiagEngine && root.DiagEngine.UNKNOWN_CODE) || UNKNOWN_CODE;
    const baseline = (root && root.DTC_DB_DATA) || [];
    const additions = (root && root.DTC_SAE_GENERIC_ADDITIONS) || [];
    const row = baseline.concat(additions).find((item) => String(item.code).toUpperCase() === normalized);
    if (row) return { code: normalized, description: row.description, inDatabase: true };
    return { code: normalized, description: unknown, inDatabase: false };
  }

  function codeItem(code, lookupFn, badge) {
    const info = lookupScannedCode(code, lookupFn);
    return {
      code,
      badge: badge || "",
      description: info.inDatabase ? info.description : UNKNOWN_CODE,
      inDatabase: !!info.inDatabase
    };
  }

  function buildReportReadout(result, lookupFn) {
    const report = result.report;
    const raw = String(result.reply || "");
    if (!report.answered) {
      return {
        status: "no-reply",
        title: "The vehicle did not reply",
        message: "The vehicle did not reply. No codes were added.",
        raw,
        items: [],
        report
      };
    }
    const items = [];
    (report.modules || []).forEach((module) => {
      (module.stored || []).forEach((code) => items.push(codeItem(code, lookupFn, "Stored")));
      (module.pending || []).forEach((code) => items.push(codeItem(code, lookupFn, "Pending")));
      (module.permanent || []).forEach((code) => items.push(codeItem(code, lookupFn, "Permanent")));
      (module.moduleCodes || []).forEach((row) => items.push(codeItem(row.code, lookupFn, row.label || "Module")));
    });
    const unique = Array.isArray(report.uniqueCodes) ? report.uniqueCodes.length : 0;
    return {
      status: "report",
      title: unique === 1 ? "1 code from this scan" : unique + " codes from this scan",
      raw,
      items,
      report
    };
  }

  function buildScanReadout(result, lookupFn) {
    if (!result || result.ok === false) {
      return {
        status: "parse-error",
        title: COULD_NOT_PARSE,
        message: COULD_NOT_PARSE,
        raw: String(result && (result.reply || result.raw) || ""),
        error: result && result.error ? String(result.error) : "",
        items: []
      };
    }
    if (result.report && Array.isArray(result.report.modules)) {
      return buildReportReadout(result, lookupFn);
    }
    const codes = Array.isArray(result.codes)
      ? result.codes.map((code) => String(code || "").trim().toUpperCase()).filter(Boolean)
      : [];
    if (!codes.length) {
      return {
        status: "empty",
        title: NO_STORED_CODES,
        message: NO_STORED_CODES,
        raw: String(result.reply || ""),
        items: []
      };
    }
    return {
      status: "ok",
      title: codes.length === 1 ? "1 stored code" : codes.length + " stored codes",
      items: codes.map((code) => {
        const info = lookupScannedCode(code, lookupFn);
        return {
          code,
          description: info.inDatabase ? info.description : UNKNOWN_CODE,
          inDatabase: !!info.inDatabase
        };
      }),
      raw: String(result.reply || "")
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openCodeGuidance(code) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized || typeof document === "undefined") return;
    const field = document.getElementById("codes");
    if (field) {
      field.value = normalized;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const lookup = document.getElementById("btnLookup");
    if (lookup) lookup.click();
    const results = document.getElementById("codeResults") || document.getElementById("lookupCard");
    if (results && typeof results.scrollIntoView === "function") {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runDiagnosisFromScan() {
    if (typeof document === "undefined") return;
    const diagnose = document.getElementById("btnRunDiagnosis") || document.getElementById("btnRunDiagnosisTop");
    if (diagnose) diagnose.click();
    const resultsTab = document.getElementById("tabBtnResults");
    if (resultsTab) resultsTab.click();
    const results = document.getElementById("results");
    if (results && typeof results.scrollIntoView === "function") {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function nextStepsHtml(model) {
    const hasCodes = Array.isArray(model.items) && model.items.length > 0;
    if (!hasCodes) return "";
    return (
      '<div class="scan-next-steps">' +
        '<p class="scan-note">Tap a code for lookup, or run Diagnose for repair steps and how-to checks.</p>' +
        '<div class="row secondary-actions">' +
          '<button type="button" class="warn" data-run-diagnosis>Diagnose and repair steps</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderScanReadout(model, rootEl) {
    const card = typeof document !== "undefined" ? document.getElementById("scanReadoutCard") : null;
    const target = rootEl || (typeof document !== "undefined" ? document.getElementById("scanReadout") : null);
    if (card) card.hidden = false;
    if (!target) return model;
    if (!model || model.status === "parse-error") {
      const raw = model && model.raw ? escapeHtml(model.raw) : "(empty reply)";
      target.innerHTML =
        '<p class="scan-readout-error">' + escapeHtml(COULD_NOT_PARSE) + "</p>" +
        '<pre class="scan-readout-raw">' + raw + "</pre>";
      return model;
    }
    if (model.status === "empty") {
      target.innerHTML = '<p class="scan-readout-empty">' + escapeHtml(NO_STORED_CODES) + "</p>";
      return model;
    }
    if (model.status === "no-reply") {
      target.innerHTML = '<p class="scan-readout-empty">' + escapeHtml(model.message) + "</p>";
      return model;
    }
    if (model.status === "report") {
      target.innerHTML = renderReport(model) + nextStepsHtml(model);
      bindReadoutActions(target);
      return model;
    }
    target.innerHTML = model.items.map((item) => {
      const meaning = item.inDatabase ? item.description : UNKNOWN_CODE;
      return (
        '<button type="button" class="scan-code" data-open-guidance="' + escapeHtml(item.code) + '">' +
          '<span class="code">' + escapeHtml(item.code) + "</span>" +
          '<span class="meta">' + escapeHtml(meaning) + "</span>" +
        "</button>"
      );
    }).join("") + nextStepsHtml(model);
    bindReadoutActions(target);
    return model;
  }

  function bindReadoutActions(target) {
    target.querySelectorAll("[data-open-guidance]").forEach((button) => {
      button.addEventListener("click", () => openCodeGuidance(button.getAttribute("data-open-guidance")));
    });
    target.querySelectorAll("[data-run-diagnosis]").forEach((button) => {
      button.addEventListener("click", () => runDiagnosisFromScan());
    });
  }

  function statusRow(label, value) {
    if (value == null || value === "") return "";
    return "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>";
  }

  function codeButton(item) {
    const badge = item.badge ? item.badge + " · " : "";
    const meaning = item.inDatabase ? item.description : UNKNOWN_CODE;
    return (
      '<button type="button" class="scan-code" data-open-guidance="' + escapeHtml(item.code) + '">' +
        '<span class="code">' + escapeHtml(item.code) + "</span>" +
        '<span class="meta">' + escapeHtml(badge + meaning) + "</span>" +
      "</button>"
    );
  }

  function buttonsFor(codes, items, badge) {
    return codes.map((code) => {
      const item = items.find((row) => row.code === code && (!badge || row.badge === badge)) || { code, description: UNKNOWN_CODE, inDatabase: false, badge: badge || "" };
      return codeButton(item);
    }).join("");
  }

  function renderReport(model) {
    const report = model.report || {};
    const modules = report.modules || [];
    const distance = typeof report.distance === "function" ? report.distance : null;
    const chassis = report.chassisCodes || [];
    let html = '<p class="scan-note">' + escapeHtml(model.title) + "</p>";
    if (chassis.length) {
      html += '<section class="scan-module"><h3>Chassis codes the vehicle sent</h3>';
      html += chassis.map((code) => {
        const item = model.items.find((row) => row.code === code) || { code, description: UNKNOWN_CODE, inDatabase: false, badge: "" };
        return codeButton(item);
      }).join("") + "</section>";
    } else {
      html += '<p class="scan-note">No chassis-module codes were in this adapter\'s replies. ABS and other chassis codes are listed when that module answers.</p>';
    }
    modules.forEach((module) => {
      const rows = [
        statusRow("Check engine light", module.mil == null ? null : module.mil ? "On" : "Off"),
        statusRow("Stored code count", module.dtcCount == null ? null : String(module.dtcCount)),
        statusRow("Distance since cleared", distance ? distance(module.distanceClearKm) : null),
        statusRow("Warmups since cleared", module.warmups == null ? null : String(module.warmups)),
        statusRow("Distance with light on", distance ? distance(module.distanceMilKm) : null),
        statusRow("Loop", module.loop && module.loop.length ? module.loop.join(", ") : null),
        statusRow("VIN", module.vin),
        statusRow("ID text", module.vin ? null : module.idText)
      ].join("");
      let body = rows ? '<dl class="scan-kvs">' + rows + "</dl>" : "";
      if (module.sawStored) {
        body += '<p class="scan-section-label">Stored</p>' + (module.stored.length ? buttonsFor(module.stored, model.items, "Stored") : '<p class="scan-note">No stored codes</p>');
      }
      if (module.sawPending) {
        body += '<p class="scan-section-label">Pending</p>' + (module.pending.length ? buttonsFor(module.pending, model.items, "Pending") : '<p class="scan-note">No pending codes</p>');
      }
      if (module.sawPermanent) {
        body += '<p class="scan-section-label">Permanent</p>' + (module.permanent.length ? buttonsFor(module.permanent, model.items, "Permanent") : '<p class="scan-note">No permanent codes</p>');
      }
      if (module.moduleCodes && module.moduleCodes.length) {
        body += '<p class="scan-section-label">Module codes</p>' + module.moduleCodes.map((row) => {
          const item = model.items.find((entry) => entry.code === row.code && entry.badge === row.label) || { code: row.code, description: UNKNOWN_CODE, inDatabase: false, badge: row.label };
          return codeButton(item);
        }).join("");
      }
      if (body) html += '<section class="scan-module"><h3>' + escapeHtml(module.title || module.id) + "</h3>" + body + "</section>";
    });
    return html;
  }

  function showScanReadout(result, lookupFn, rootEl) {
    return renderScanReadout(buildScanReadout(result, lookupFn), rootEl);
  }

  root.ATDDScanReadout = {
    UNKNOWN_CODE,
    NO_STORED_CODES,
    COULD_NOT_PARSE,
    lookupScannedCode,
    buildScanReadout,
    renderScanReadout,
    showScanReadout,
    openCodeGuidance,
    runDiagnosisFromScan
  };
})(typeof window !== "undefined" ? window : globalThis);
