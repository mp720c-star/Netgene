/**
 * Renders module diagnostic sections from a real scan report + live snapshot.
 * Unavailable parameters are labeled — never filled with sample values.
 */
(function (root) {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function codeList(codes) {
    if (!codes || !codes.length) {
      return '<p class="scan-note">No codes in this section from the vehicle.</p>';
    }
    return codes
      .map(function (code) {
        return (
          '<button type="button" class="scan-code" data-open-guidance="' +
          esc(code) +
          '"><span class="code">' +
          esc(code) +
          "</span></button>"
        );
      })
      .join("");
  }

  function liveRows(live) {
    if (!live || !live.length) {
      return '<p class="scan-note">No live-data probes were run.</p>';
    }
    return (
      '<dl class="scan-kvs">' +
      live
        .map(function (row) {
          var valueText;
          if (row.status === "ok") valueText = String(row.value) + (row.unit ? " " + row.unit : "");
          else if (row.status === "raw_unverified") valueText = "Unavailable as a reading (raw reply logged)";
          else valueText = "Unavailable";
          return (
            "<div><dt>" +
            esc(row.label) +
            "</dt><dd>" +
            esc(valueText) +
            (row.note ? '<div class="scan-note">' + esc(row.note) + "</div>" : "") +
            "</dd></div>"
          );
        })
        .join("") +
      "</dl>"
    );
  }

  function renderModuleDiagnostics(model, rootEl) {
    var card = document.getElementById("moduleDiagnosticsCard");
    var target = rootEl || document.getElementById("moduleDiagnostics");
    if (card) card.hidden = false;
    if (!target || !model) return model;

    var sections = model.sections || {};
    var html = "";
    html += '<section class="scan-module"><h3>Engine</h3>' + codeList(sections.engine) + "</section>";
    html += '<section class="scan-module"><h3>Transmission</h3>' + codeList(sections.transmission) + "</section>";
    html += '<section class="scan-module"><h3>ABS</h3>' + codeList(sections.abs) + "</section>";
    html += '<section class="scan-module"><h3>Traction Control</h3>' + codeList(sections.traction) + "</section>";
    html += '<section class="scan-module"><h3>Parking Brake</h3>' + liveRows((model.live || []).filter(function (r) { return r.section === "parking_brake"; })) + "</section>";
    html += '<section class="scan-module"><h3>Live Sensor Data</h3>' + liveRows((model.live || []).filter(function (r) { return r.section === "live" || r.section === "abs" || r.section === "traction"; })) + "</section>";

    if (model.priorityAbs && model.priorityAbs.length) {
      html += '<section class="scan-module"><h3>Priority ABS codes on this scan</h3>';
      model.priorityAbs.forEach(function (info) {
        html +=
          '<div class="scan-note"><strong>' +
          esc(info.code) +
          "</strong> — " +
          esc(info.title) +
          ". " +
          esc(info.gmNotes) +
          "</div>";
      });
      html += "</section>";
    }

    if (model.hardware && model.hardware.summary) {
      html += '<section class="scan-module"><h3>Hardware limits</h3><ul class="scan-note">';
      model.hardware.summary.forEach(function (line) {
        html += "<li>" + esc(line) + "</li>";
      });
      html += "</ul></section>";
    }

    target.innerHTML = html;
    target.querySelectorAll("[data-open-guidance]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (root.ATDDScanReadout && root.ATDDScanReadout.openCodeGuidance) {
          root.ATDDScanReadout.openCodeGuidance(button.getAttribute("data-open-guidance"));
        }
      });
    });
    return model;
  }

  function renderHistoryList() {
    var box = document.getElementById("diagnosticHistoryList");
    if (!box || !root.ATDDDiagnosticHistory) return;
    var rows = root.ATDDDiagnosticHistory.listEntries();
    if (!rows.length) {
      box.textContent = "No saved vehicle scans yet.";
      return;
    }
    box.innerHTML = rows
      .map(function (row) {
        return (
          '<div class="history-row">' +
          "<div><strong>" +
          esc(row.label) +
          "</strong> · " +
          esc(row.savedAt) +
          "</div>" +
          '<div class="scan-note">Codes: ' +
          esc((row.codesAfter && row.codesAfter.length ? row.codesAfter : row.codesBefore || []).join(", ") || "(none)") +
          "</div>" +
          (row.cleared && row.cleared.length
            ? '<div class="scan-note">Cleared: ' + esc(row.cleared.join(", ")) + "</div>"
            : "") +
          (row.remained && row.remained.length
            ? '<div class="scan-note">Remained: ' + esc(row.remained.join(", ")) + "</div>"
            : "") +
          "</div>"
        );
      })
      .join("");
  }

  function wireHistoryControls() {
    var refresh = document.getElementById("btnRefreshDiagHistory");
    var del = document.getElementById("btnDeleteDiagHistory");
    if (refresh) refresh.onclick = renderHistoryList;
    if (del) {
      del.onclick = function () {
        var dialog = document.getElementById("deleteHistoryDialog");
        if (!dialog || typeof dialog.showModal !== "function") {
          if (window.confirm("Delete ATDD scan history? This does not clear vehicle codes.")) {
            if (root.ATDDDiagnosticHistory) root.ATDDDiagnosticHistory.deleteAllHistory();
            renderHistoryList();
          }
          return;
        }
        var settled = false;
        var finish = function (ok) {
          if (settled) return;
          settled = true;
          dialog.close();
          if (ok && root.ATDDDiagnosticHistory) root.ATDDDiagnosticHistory.deleteAllHistory();
          renderHistoryList();
        };
        document.getElementById("deleteHistoryForm").addEventListener(
          "submit",
          function (event) {
            event.preventDefault();
            finish(true);
          },
          { once: true }
        );
        document.getElementById("btnDeleteHistoryCancel").addEventListener("click", function () {
          finish(false);
        }, { once: true });
        dialog.addEventListener("cancel", function () {
          finish(false);
        }, { once: true });
        dialog.showModal();
      };
    }
    renderHistoryList();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wireHistoryControls);
    } else {
      wireHistoryControls();
    }
  }

  root.ATDDModuleDiagnosticsUi = {
    renderModuleDiagnostics: renderModuleDiagnostics,
    renderHistoryList: renderHistoryList,
  };
})(typeof window !== "undefined" ? window : globalThis);
