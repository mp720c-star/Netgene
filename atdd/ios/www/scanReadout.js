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
    target.innerHTML = model.items.map((item) => {
      const meaning = item.inDatabase ? item.description : UNKNOWN_CODE;
      return (
        '<button type="button" class="scan-code" data-open-guidance="' + escapeHtml(item.code) + '">' +
          '<span class="code">' + escapeHtml(item.code) + "</span>" +
          '<span class="meta">' + escapeHtml(meaning) + "</span>" +
        "</button>"
      );
    }).join("");
    target.querySelectorAll("[data-open-guidance]").forEach((button) => {
      button.addEventListener("click", () => openCodeGuidance(button.getAttribute("data-open-guidance")));
    });
    return model;
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
    openCodeGuidance
  };
})(typeof window !== "undefined" ? window : globalThis);
