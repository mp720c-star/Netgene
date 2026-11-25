/**
 * Parse ELM327 replies into the codes and status the vehicle actually sent.
 * This file never fills a missing code, VIN, or module name.
 */
(function (root) {
  "use strict";

  var FUEL_SYSTEM = {
    1: "Open loop — engine not warmed up",
    2: "Closed loop",
    4: "Open loop — driving conditions",
    8: "Open loop — fault",
    16: "Closed loop — oxygen sensor fault"
  };

  var FUNCTIONAL_READS = Object.freeze([
    { command: "0100", timeoutMs: 15000, label: "which computers answer" },
    { command: "0101", timeoutMs: 6000, label: "check-engine light and code count" },
    { command: "0103", timeoutMs: 5000, label: "loop status" },
    { command: "0121", timeoutMs: 5000, label: "distance with the light on" },
    { command: "0130", timeoutMs: 5000, label: "warmups since codes cleared" },
    { command: "0131", timeoutMs: 5000, label: "distance since codes cleared" },
    { command: "03", timeoutMs: 12000, label: "stored codes" },
    { command: "07", timeoutMs: 12000, label: "pending codes" },
    { command: "0A", timeoutMs: 12000, label: "permanent codes" },
    { command: "0902", timeoutMs: 12000, label: "VIN" },
    { command: "090A", timeoutMs: 8000, label: "module name" }
  ]);

  var PHYSICAL_NODES = Object.freeze([
    { request: "7E0", response: "7E8" },
    { request: "7E1", response: "7E9" },
    { request: "7E2", response: "7EA" },
    { request: "7E3", response: "7EB" },
    { request: "7E4", response: "7EC" },
    { request: "7E5", response: "7ED" },
    { request: "7E6", response: "7EE" },
    { request: "7E7", response: "7EF" }
  ]);

  // 29-bit physical addresses on the same diagnostic CAN. A silent address is
  // not given a name or a code.
  var EXTRA_NODES = Object.freeze([
    { request: "18DA11F1", response: "18DAF111" },
    { request: "18DA18F1", response: "18DAF118" },
    { request: "18DA28F1", response: "18DAF128" },
    { request: "18DA40F1", response: "18DAF140" },
    { request: "18DA60F1", response: "18DAF160" }
  ]);

  var MODULE_READS = Object.freeze([
    { command: "03", timeoutMs: 4000, label: "stored codes" },
    { command: "07", timeoutMs: 4000, label: "pending codes" },
    { command: "0A", timeoutMs: 4000, label: "permanent codes" },
    { command: "1902FF", timeoutMs: 4000, label: "module codes" }
  ]);

  var RESTORE_HEADER = Object.freeze(["ATFCSM0", "ATAR", "ATSH7DF"]);
  var CLEAR_EMISSIONS = "04";
  var CLEAR_MODULE = "14FFFFFF";
  var EXTENDED_SESSION = "1003";
  var DEFAULT_SESSION = "1001";

  function decodeDtcPair(a, b) {
    if (a == null || b == null || (a === 0 && b === 0)) return null;
    var type = ["P", "C", "B", "U"][(a & 0xc0) >> 6];
    return (
      type +
      ((a & 0x30) >> 4).toString(16) +
      (a & 0x0f).toString(16) +
      ((b & 0xf0) >> 4).toString(16) +
      (b & 0x0f).toString(16)
    ).toUpperCase();
  }

  function hexBytes(text) {
    var compact = String(text || "").replace(/\s+/g, "");
    if (!/^[0-9A-F]+$/i.test(compact) || compact.length % 2) return [];
    var out = [];
    for (var i = 0; i < compact.length; i += 2) out.push(parseInt(compact.slice(i, i + 2), 16));
    return out;
  }

  function parseElmReply(raw) {
    var lines = String(raw || "").replace(/>/g, "").split(/[\r\n]+/);
    var out = [];
    var pending = {};
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim().replace(/^SEARCHING\.\.\.\s*/i, "");
      if (!line) continue;
      if (/^(OK|SEARCHING\.\.\.|\?|STOPPED|NO DATA|UNABLE TO CONNECT|CAN ERROR|BUS INIT|BUFFER FULL|ERROR)$/i.test(line)) {
        if (/NO DATA|UNABLE TO CONNECT|CAN ERROR/i.test(line)) out.push({ kind: "notice", text: line.toUpperCase() });
        continue;
      }
      if (/^[0-9A-F]{3}$/i.test(line) && i + 1 < lines.length && /^[0-9A-F]:/i.test(lines[i + 1])) {
        var numbered = [];
        var row = 0;
        var broken = false;
        while (i + 1 < lines.length && /^[0-9A-F]:/i.test(lines[i + 1])) {
          var parts = lines[++i].split(":");
          if (parseInt(parts[0], 16) !== (row++ % 16)) broken = true;
          numbered = numbered.concat(hexBytes(parts[1] || ""));
        }
        if (!broken && numbered.length) out.push({ kind: "data", ecu: null, bytes: numbered });
        continue;
      }
      var upper = line.toUpperCase();
      var header = upper.match(/^([0-9A-F]{3}|[0-9A-F]{8})\s+([0-9A-F ]+)$/);
      var ecu = null;
      var hex = upper;
      if (header) {
        ecu = header[1];
        hex = header[2];
      }
      if (!/^[0-9A-F ]+$/.test(hex.trim())) continue;
      var bytes = hexBytes(hex);
      if (!bytes.length) continue;
      var pci = bytes[0] >> 4;
      var key = ecu || "";
      if (pci === 0 && (bytes[0] & 0x0f) > 0 && (bytes[0] & 0x0f) <= bytes.length - 1) {
        out.push({ kind: "data", ecu: ecu, bytes: bytes.slice(1, 1 + (bytes[0] & 0x0f)) });
        continue;
      }
      if (pci === 1 && bytes.length >= 2) {
        pending[key] = { total: ((bytes[0] & 0x0f) << 8) | bytes[1], bytes: bytes.slice(2), next: 1 };
        continue;
      }
      if (pci === 2 && pending[key] && (bytes[0] & 0x0f) === (pending[key].next & 0x0f)) {
        pending[key].bytes = pending[key].bytes.concat(bytes.slice(1));
        pending[key].next += 1;
        if (pending[key].bytes.length >= pending[key].total) {
          out.push({ kind: "data", ecu: ecu, bytes: pending[key].bytes.slice(0, pending[key].total) });
          delete pending[key];
        }
        continue;
      }
      if (pci === 3) continue;
      out.push({ kind: "data", ecu: ecu, bytes: bytes });
    }
    return out;
  }

  function readCountedPairs(data) {
    var bytes = data.slice();
    if (bytes.length % 2 === 1) {
      var count = bytes[0];
      bytes = bytes.slice(1, 1 + count * 2);
    }
    var codes = [];
    for (var i = 0; i + 1 < bytes.length; i += 2) {
      var code = decodeDtcPair(bytes[i], bytes[i + 1]);
      if (code) codes.push(code);
    }
    return codes;
  }

  function readUds(bytes) {
    var records = [];
    for (var i = 3; i + 3 < bytes.length; i += 4) {
      var code = decodeDtcPair(bytes[i], bytes[i + 1]);
      if (!code) continue;
      var status = bytes[i + 3];
      var labels = [];
      if (status & 0x08) labels.push("confirmed");
      if (status & 0x04) labels.push("pending");
      if (status & 0x80) labels.push("warning light");
      if (!labels.length) labels.push("status " + status.toString(16).toUpperCase());
      records.push({
        code: code,
        failureType: bytes[i + 2],
        status: status,
        label: labels.join(", ")
      });
    }
    return records;
  }

  function interpretPayload(bytes) {
    if (!bytes || !bytes.length) return null;
    var sid = bytes[0];
    if (sid === 0x7f && bytes.length >= 3) return { type: "negative", service: bytes[1], nrc: bytes[2] };
    if (sid === 0x43 || sid === 0x47 || sid === 0x4a) {
      return {
        type: "dtc",
        kind: sid === 0x43 ? "stored" : sid === 0x47 ? "pending" : "permanent",
        codes: readCountedPairs(bytes.slice(1))
      };
    }
    if (sid === 0x41 && bytes.length >= 3) return { type: "pid", pid: bytes[1], data: bytes.slice(2) };
    if (sid === 0x49 && bytes.length >= 2) return { type: "info", pid: bytes[1], data: bytes.slice(2) };
    if (sid === 0x59 && bytes[1] === 0x02) return { type: "uds", records: readUds(bytes) };
    return null;
  }

  function printable(bytes) {
    var text = "";
    for (var i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) text += String.fromCharCode(bytes[i]);
    }
    return text.trim();
  }

  function textAfterCount(data) {
    if (!data || !data.length) return "";
    var direct = printable(data);
    if (data[0] > 0 && data[0] < 8 && data.length > 1) {
      var rest = printable(data.slice(1));
      if (rest.length >= direct.length) return rest;
    }
    return direct;
  }

  function asVin(text) {
    var vin = String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (vin.length === 17 && !/[IOQ]/.test(vin)) return vin;
    return null;
  }

  function blank(id) {
    return {
      id: id,
      reportedName: null,
      mil: null,
      dtcCount: null,
      loop: [],
      distanceMilKm: null,
      distanceClearKm: null,
      warmups: null,
      vin: null,
      idText: null,
      stored: [],
      pending: [],
      permanent: [],
      moduleCodes: [],
      sawStored: false,
      sawPending: false,
      sawPermanent: false
    };
  }

  function addUnique(list, codes) {
    for (var i = 0; i < codes.length; i++) {
      if (list.indexOf(codes[i]) === -1) list.push(codes[i]);
    }
  }

  function word16(data) {
    if (!data || data.length < 2) return null;
    return (data[0] << 8) | data[1];
  }

  function applyInterpreted(module, interpreted) {
    if (!interpreted) return;
    if (interpreted.type === "dtc") {
      if (interpreted.kind === "stored") module.sawStored = true;
      if (interpreted.kind === "pending") module.sawPending = true;
      if (interpreted.kind === "permanent") module.sawPermanent = true;
      addUnique(module[interpreted.kind], interpreted.codes);
      return;
    }
    if (interpreted.type === "uds") {
      interpreted.records.forEach(function (record) {
        if (!module.moduleCodes.some(function (item) { return item.code === record.code && item.status === record.status; })) {
          module.moduleCodes.push(record);
        }
      });
      return;
    }
    if (interpreted.type === "pid") {
      var data = interpreted.data;
      if (interpreted.pid === 0x01 && data.length >= 1) {
        module.mil = (data[0] & 0x80) !== 0;
        module.dtcCount = data[0] & 0x7f;
      } else if (interpreted.pid === 0x03) {
        data.forEach(function (value) {
          if (!value) return;
          var label = FUEL_SYSTEM[value] || ("Status " + value);
          if (module.loop.indexOf(label) === -1) module.loop.push(label);
        });
      } else if (interpreted.pid === 0x21) {
        module.distanceMilKm = word16(data);
      } else if (interpreted.pid === 0x30 && data.length >= 1) {
        module.warmups = data[0];
      } else if (interpreted.pid === 0x31) {
        module.distanceClearKm = word16(data);
      }
      return;
    }
    if (interpreted.type === "info") {
      var text = textAfterCount(interpreted.data);
      if (interpreted.pid === 0x02) {
        var vin = asVin(text);
        if (vin) module.vin = vin;
        else if (text.length >= 4) module.idText = text;
      } else if (interpreted.pid === 0x0a && text) {
        module.reportedName = text;
      }
    }
  }

  function defaultTitle(id, reportedName) {
    if (reportedName) return reportedName + " (" + id + ")";
    if (id === "7E8") return "Engine (7E8)";
    if (!id || id === "OBD") return "On-board diagnostics";
    return "Module " + id;
  }

  function formatDistance(km) {
    if (typeof km !== "number" || !isFinite(km)) return null;
    var miles = Math.round(km * 0.621371 * 10) / 10;
    return km + " km (" + miles.toFixed(1) + " mi)";
  }

  function eachCode(module, visit) {
    ["stored", "pending", "permanent"].forEach(function (kind) {
      module[kind].forEach(function (code) { visit(code); });
    });
    module.moduleCodes.forEach(function (row) { visit(row.code); });
  }

  function buildReport(sections) {
    var modules = new Map();
    var notices = [];
    var answered = false;
    function ensure(id) {
      var key = id || "OBD";
      if (!modules.has(key)) modules.set(key, blank(key));
      return modules.get(key);
    }
    (sections || []).forEach(function (section) {
      parseElmReply(section && section.raw).forEach(function (message) {
        if (message.kind === "notice") {
          if (notices.indexOf(message.text) === -1) notices.push(message.text);
          return;
        }
        var interpreted = interpretPayload(message.bytes);
        if (!interpreted || interpreted.type === "negative") {
          if (interpreted && interpreted.type === "negative") answered = true;
          return;
        }
        answered = true;
        applyInterpreted(ensure(message.ecu), interpreted);
      });
    });
    var list = Array.from(modules.values()).map(function (module) {
      var copy = Object.assign({}, module);
      copy.title = defaultTitle(module.id, module.reportedName);
      return copy;
    });
    var unique = [];
    var chassis = [];
    list.forEach(function (module) {
      eachCode(module, function (code) {
        if (unique.indexOf(code) === -1) unique.push(code);
        if (code.charAt(0) === "C" && chassis.indexOf(code) === -1) chassis.push(code);
      });
    });
    return {
      modules: list,
      uniqueCodes: unique,
      chassisCodes: chassis,
      answered: answered,
      notices: notices,
      distance: formatDistance
    };
  }

  function adapterHeader(node) {
    var request = node.request;
    var commands = [];
    if (request.length === 8) commands.push("ATCP18");
    commands.push("ATSH" + request, "ATCRA" + node.response, "ATFCSH" + request, "ATFCSD300000", "ATFCSM1");
    return commands;
  }

  function needsExtendedSession(raw) {
    var compact = String(raw || "").toUpperCase().replace(/[^0-9A-F]/g, "");
    return compact.indexOf("7F197E") !== -1 || compact.indexOf("7F1922") !== -1 || compact.indexOf("7F1911") !== -1;
  }

  function replyHasVehicleData(raw) {
    return parseElmReply(raw).some(function (message) {
      return message.kind === "data" && interpretPayload(message.bytes);
    });
  }

  root.ATDDVehicleScan = {
    FUNCTIONAL_READS: FUNCTIONAL_READS,
    PHYSICAL_NODES: PHYSICAL_NODES,
    EXTRA_NODES: EXTRA_NODES,
    MODULE_READS: MODULE_READS,
    RESTORE_HEADER: RESTORE_HEADER,
    CLEAR_EMISSIONS: CLEAR_EMISSIONS,
    CLEAR_MODULE: CLEAR_MODULE,
    EXTENDED_SESSION: EXTENDED_SESSION,
    DEFAULT_SESSION: DEFAULT_SESSION,
    decodeDtcPair: decodeDtcPair,
    parseElmReply: parseElmReply,
    interpretPayload: interpretPayload,
    buildReport: buildReport,
    formatDistance: formatDistance,
    adapterHeader: adapterHeader,
    needsExtendedSession: needsExtendedSession,
    replyHasVehicleData: replyHasVehicleData
  };
})(typeof window !== "undefined" ? window : globalThis);
