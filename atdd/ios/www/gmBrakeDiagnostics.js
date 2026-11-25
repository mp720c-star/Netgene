/**
 * GM brake / chassis diagnostic helpers for ATDD Connect.
 *
 * Fail-closed rules:
 * - A module is "reachable" only when the adapter returns vehicle data.
 * - Live parameters are shown only when a verified decode exists for a real reply.
 * - Candidate addresses and DIDs are probed and logged; silence is reported as
 *   unavailable, never filled with sample values.
 * - FIXD / ELM327 access to GMT900 EBCM is not assumed. Many consumer adapters
 *   only reach powertrain ECUs on OBD HS-CAN.
 */
(function (root) {
  "use strict";

  var PRIMARY_VEHICLE = Object.freeze({
    year: 2008,
    make: "GMC",
    model: "Sierra 1500",
    trim: "SLT",
    engine: "5.3L V8",
    platform: "GMT900",
  });

  /**
   * Candidate ISO-TP headers for GM light trucks. verification:
   * - powertrain_standard: OBD-II emissions addresses (widely confirmed)
   * - candidate_gmt900: reported for some GMT900 tools; must be proven live
   * - candidate: alternate aftermarket headers; silence is expected until proven
   */
  var GM_MODULE_CANDIDATES = Object.freeze([
    {
      id: "ecm",
      title: "Engine",
      roles: Object.freeze(["engine"]),
      request: "7E0",
      response: "7E8",
      verification: "powertrain_standard",
    },
    {
      id: "tcm",
      title: "Transmission",
      roles: Object.freeze(["transmission"]),
      request: "7E1",
      response: "7E9",
      verification: "powertrain_standard",
    },
    {
      id: "ebcm_hs_241",
      title: "ABS / EBCM",
      roles: Object.freeze(["abs", "traction", "stabilitrak"]),
      request: "241",
      response: "641",
      verification: "candidate_gmt900",
      note: "Common aftermarket EBCM header on some GM trucks. FIXD may not reach it.",
    },
    {
      id: "ebcm_hs_24c",
      title: "ABS / EBCM (alt)",
      roles: Object.freeze(["abs", "traction"]),
      request: "24C",
      response: "64C",
      verification: "candidate",
      note: "Alternate HS-CAN EBCM header seen in aftermarket docs. Unproven on FIXD.",
    },
    {
      id: "bcm_body",
      title: "Body Control Module",
      roles: Object.freeze(["bcm", "parking_brake"]),
      request: "244",
      response: "644",
      verification: "candidate_gmt900",
      note: "BCM often sits on GMLAN. Consumer OBD dongles frequently cannot reach it.",
    },
    {
      id: "ext_11",
      title: "Module 18DA11F1",
      roles: Object.freeze(["chassis"]),
      request: "18DA11F1",
      response: "18DAF111",
      verification: "candidate",
    },
    {
      id: "ext_28",
      title: "Module 18DA28F1",
      roles: Object.freeze(["chassis"]),
      request: "18DA28F1",
      response: "18DAF128",
      verification: "candidate",
    },
    {
      id: "ext_40",
      title: "Module 18DA40F1",
      roles: Object.freeze(["abs", "chassis"]),
      request: "18DA40F1",
      response: "18DAF140",
      verification: "candidate",
    },
  ]);

  /**
   * Live-data parameters. Each entry lists candidate Mode 22 DIDs.
   * Until a DID returns a verified decode profile, status stays unavailable.
   */
  var LIVE_PARAMETERS = Object.freeze([
    {
      id: "wheel_speed_lf",
      label: "Left front wheel speed",
      section: "live",
      moduleRoles: Object.freeze(["abs"]),
      dids: Object.freeze(["220B01", "221720", "222001"]),
      unit: "km/h",
      decode: null,
      reasonUnavailable:
        "No verified wheel-speed DID/scaling for this module reply. Raw answers are logged only.",
    },
    {
      id: "wheel_speed_rf",
      label: "Right front wheel speed",
      section: "live",
      moduleRoles: Object.freeze(["abs"]),
      dids: Object.freeze(["220B02", "221721", "222002"]),
      unit: "km/h",
      decode: null,
      reasonUnavailable:
        "No verified wheel-speed DID/scaling for this module reply. Raw answers are logged only.",
    },
    {
      id: "wheel_speed_lr",
      label: "Left rear wheel speed",
      section: "live",
      moduleRoles: Object.freeze(["abs"]),
      dids: Object.freeze(["220B03", "221722", "222003"]),
      unit: "km/h",
      decode: null,
      reasonUnavailable:
        "No verified wheel-speed DID/scaling for this module reply. Raw answers are logged only.",
    },
    {
      id: "wheel_speed_rr",
      label: "Right rear wheel speed",
      section: "live",
      moduleRoles: Object.freeze(["abs"]),
      dids: Object.freeze(["220B04", "221723", "222004"]),
      unit: "km/h",
      decode: null,
      reasonUnavailable:
        "No verified wheel-speed DID/scaling for this module reply. Raw answers are logged only.",
    },
    {
      id: "park_brake_switch",
      label: "Parking brake switch",
      section: "parking_brake",
      moduleRoles: Object.freeze(["bcm", "abs"]),
      dids: Object.freeze(["224001", "2219A0"]),
      unit: "",
      decode: null,
      reasonUnavailable: "Parking brake switch DID not confirmed from a module reply on this adapter.",
    },
    {
      id: "park_brake_status",
      label: "Parking brake applied / released",
      section: "parking_brake",
      moduleRoles: Object.freeze(["bcm", "abs"]),
      dids: Object.freeze(["224002", "2219A1"]),
      unit: "",
      decode: null,
      reasonUnavailable: "Parking brake status DID not confirmed from a module reply on this adapter.",
    },
    {
      id: "brake_fluid_level",
      label: "Brake fluid level switch",
      section: "parking_brake",
      moduleRoles: Object.freeze(["bcm", "abs"]),
      dids: Object.freeze(["224010"]),
      unit: "",
      decode: null,
      reasonUnavailable: "Brake fluid level DID not confirmed from a module reply on this adapter.",
    },
    {
      id: "brake_warn_request",
      label: "Brake warning light request",
      section: "parking_brake",
      moduleRoles: Object.freeze(["bcm", "abs"]),
      dids: Object.freeze(["224020"]),
      unit: "",
      decode: null,
      reasonUnavailable: "Brake warning request DID not confirmed from a module reply on this adapter.",
    },
    {
      id: "abs_warn_request",
      label: "ABS warning light request",
      section: "abs",
      moduleRoles: Object.freeze(["abs"]),
      dids: Object.freeze(["224021"]),
      unit: "",
      decode: null,
      reasonUnavailable: "ABS warning request DID not confirmed from a module reply on this adapter.",
    },
    {
      id: "traction_warn",
      label: "Traction control warning status",
      section: "traction",
      moduleRoles: Object.freeze(["traction", "abs"]),
      dids: Object.freeze(["224022"]),
      unit: "",
      decode: null,
      reasonUnavailable: "Traction warning DID not confirmed from a module reply on this adapter.",
    },
  ]);

  /** SAE J2012-aligned chassis codes reported on the Sierra; subtypes noted when known. */
  var PRIORITY_ABS_CODES = Object.freeze({
    C0035: {
      code: "C0035",
      title: "Left front wheel speed sensor circuit",
      sae: "Left Front Wheel Speed Sensor Circuit",
      gmNotes:
        "On GMT900 trucks this is typically the LF wheel-speed sensor circuit (open, short, or erratic). Confirm exact failure subtype (e.g. C0035 00/0A/0B) from the EBCM freeze data in service information — ATDD does not invent subtypes.",
      checks: [
        "Inspect the left-front wheel-speed harness at the strut and hub for rub-through.",
        "Check the sensor tip and tone ring for debris, cracks, or rust jacking.",
        "Measure sensor resistance only per the service manual range for this truck.",
      ],
    },
    C0045: {
      code: "C0045",
      title: "Left rear wheel speed sensor circuit",
      sae: "Left Rear Wheel Speed Sensor Circuit",
      gmNotes:
        "Typically LR wheel-speed sensor circuit on GMT900. Confirm subtype letters/bytes from EBCM data; do not assume open vs short without the module payload.",
      checks: [
        "Inspect the left-rear harness along the axle and frame clips.",
        "Check tone ring / encoder and bearing play at that corner.",
        "Do not clear and ignore — ABS and traction may be reduced.",
      ],
    },
    C0050: {
      code: "C0050",
      title: "Right rear wheel speed sensor circuit",
      sae: "Right Rear Wheel Speed Sensor Circuit",
      gmNotes:
        "Typically RR wheel-speed sensor circuit on GMT900. Verify subtype against SI for this VIN family.",
      checks: [
        "Inspect the right-rear harness and connector.",
        "Check tone ring / encoder condition.",
        "Compare live wheel speeds only when the EBCM actually returns verified data.",
      ],
    },
  });

  var HARDWARE_LIMITS = Object.freeze({
    adapter: "FIXD Bluetooth OBD-II (and other ELM327-style BLE adapters)",
    vehicle: PRIMARY_VEHICLE,
    fixdClaim: "UNVERIFIED",
    summary: [
      "FIXD exposes a BLE UART that often speaks a subset of ELM327. It is not assumed to support every AT command or every GM manufacturer header.",
      "GMT900 ABS/EBCM and BCM traffic frequently uses module addresses or GMLAN paths that consumer OBD adapters never reach from the 16-pin connector HS-CAN pins alone.",
      "If EBCM candidates stay silent, ATDD reports unreachable — it does not invent ABS codes, wheel speeds, or parking-brake states.",
      "Compatible alternatives (not purchased by this agent): a bidirectional scan tool with GM ABS coverage (OEM Tech 2/MDI-class or an aftermarket tool that documents EBCM access), or an ELM327 that documents HS-CAN physical addressing to the EBCM on this truck.",
    ],
    blockedActions: [
      "No module programming / reflash",
      "No ABS disable or warning-lamp suppress commands",
      "No security access / seed-key unlock",
      "No ATMA bus monitoring flood",
    ],
  });

  function codeSet(list) {
    var out = {};
    (list || []).forEach(function (code) {
      var c = String(code || "").toUpperCase();
      if (c) out[c] = true;
    });
    return out;
  }

  function uniqueCodes(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (code) {
      var c = String(code || "").toUpperCase();
      if (!c || seen[c]) return;
      seen[c] = true;
      out.push(c);
    });
    return out;
  }

  function collectCodesFromReport(report) {
    var codes = [];
    if (!report) return codes;
    if (Array.isArray(report.uniqueCodes)) codes = codes.concat(report.uniqueCodes);
    if (Array.isArray(report.chassisCodes)) codes = codes.concat(report.chassisCodes);
    (report.modules || []).forEach(function (mod) {
      codes = codes.concat(mod.stored || [], mod.pending || [], mod.permanent || []);
      (mod.moduleCodes || []).forEach(function (row) {
        if (row && row.code) codes.push(row.code);
      });
    });
    return uniqueCodes(codes);
  }

  function compareCodeSets(beforeCodes, afterCodes) {
    var before = codeSet(beforeCodes);
    var after = codeSet(afterCodes);
    var cleared = [];
    var remained = [];
    var returned = [];
    var appeared = [];
    Object.keys(before).forEach(function (code) {
      if (after[code]) remained.push(code);
      else cleared.push(code);
    });
    Object.keys(after).forEach(function (code) {
      if (!before[code]) appeared.push(code);
    });
    // "Returned" is reserved for a later third scan; same-session clear→rescan
    // treats newly absent codes as cleared and still-present as remained.
    return {
      cleared: cleared.sort(),
      remained: remained.sort(),
      returned: returned,
      appeared: appeared.sort(),
      couldNotClear: remained.slice(),
    };
  }

  function modulesForRole(role) {
    return GM_MODULE_CANDIDATES.filter(function (mod) {
      return (mod.roles || []).indexOf(role) >= 0;
    });
  }

  function parameterStatus(param, probe) {
    var base = {
      id: param.id,
      label: param.label,
      section: param.section,
      status: "unavailable",
      value: null,
      unit: param.unit || "",
      sourceModule: null,
      raw: "",
      note: param.reasonUnavailable,
    };
    if (!probe || !probe.attempts || !probe.attempts.length) return base;
    for (var i = 0; i < probe.attempts.length; i++) {
      var attempt = probe.attempts[i];
      if (!attempt || !attempt.positive) continue;
      // Positive Mode 62 reply without a verified decode: expose raw only.
      if (!param.decode) {
        return {
          id: param.id,
          label: param.label,
          section: param.section,
          status: "raw_unverified",
          value: null,
          unit: "",
          sourceModule: attempt.moduleId || null,
          raw: String(attempt.raw || ""),
          note:
            "Module answered " +
            (attempt.did || "DID") +
            ". Scaling/meaning is not verified for this vehicle — not shown as a live reading.",
        };
      }
      return {
        id: param.id,
        label: param.label,
        section: param.section,
        status: "ok",
        value: param.decode(attempt.bytes),
        unit: param.unit || "",
        sourceModule: attempt.moduleId || null,
        raw: String(attempt.raw || ""),
        note: "",
      };
    }
    return base;
  }

  function isPositiveDidReply(raw) {
    var text = String(raw || "").toUpperCase();
    if (!text || /NO DATA|UNABLE TO CONNECT|CAN ERROR|\?/.test(text)) return false;
    // UDS positive response to 22 is 62
    return /\b62[0-9A-F]{4}/.test(text.replace(/\s+/g, "")) || /\b62\s+[0-9A-F]{2}/.test(text);
  }

  function buildLiveSnapshot(probeResults) {
    return LIVE_PARAMETERS.map(function (param) {
      return parameterStatus(param, probeResults && probeResults[param.id]);
    });
  }

  function sectionizeReport(report, liveSnapshot) {
    var codes = collectCodesFromReport(report);
    var bySection = {
      engine: [],
      transmission: [],
      abs: [],
      traction: [],
      parking_brake: [],
      chassis: [],
      other: [],
    };
    codes.forEach(function (code) {
      var family = code.charAt(0);
      if (family === "P") bySection.engine.push(code);
      else if (family === "C") bySection.abs.push(code);
      else if (family === "U" && /0121|0073|0100|0101/.test(code.slice(1))) bySection.traction.push(code);
      else if (family === "B") bySection.parking_brake.push(code);
      else if (family === "C") bySection.chassis.push(code);
      else bySection.other.push(code);
    });
    // Traction-related chassis codes also listed under traction for UI.
    bySection.abs.forEach(function (code) {
      if (/C0035|C0040|C0045|C0050|C0055|C0110/.test(code) && bySection.traction.indexOf(code) < 0) {
        bySection.traction.push(code);
      }
    });
    return {
      sections: bySection,
      live: liveSnapshot || [],
      priorityAbs: Object.keys(PRIORITY_ABS_CODES)
        .filter(function (code) {
          return codes.indexOf(code) >= 0;
        })
        .map(function (code) {
          return PRIORITY_ABS_CODES[code];
        }),
      reachableModules: (report && report.modules) || [],
      hardware: HARDWARE_LIMITS,
    };
  }

  root.ATDDGmBrake = {
    PRIMARY_VEHICLE: PRIMARY_VEHICLE,
    GM_MODULE_CANDIDATES: GM_MODULE_CANDIDATES,
    LIVE_PARAMETERS: LIVE_PARAMETERS,
    PRIORITY_ABS_CODES: PRIORITY_ABS_CODES,
    HARDWARE_LIMITS: HARDWARE_LIMITS,
    collectCodesFromReport: collectCodesFromReport,
    compareCodeSets: compareCodeSets,
    modulesForRole: modulesForRole,
    parameterStatus: parameterStatus,
    isPositiveDidReply: isPositiveDidReply,
    buildLiveSnapshot: buildLiveSnapshot,
    sectionizeReport: sectionizeReport,
  };
})(typeof window !== "undefined" ? window : globalThis);
