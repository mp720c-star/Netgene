/**
 * OBD protocol v3 — frame-aware parser (ISO-TP / multi-ECU / negatives).
 *
 * IMPORT NOTE (2026-11-17):
 * The OneDrive file `obd-protocol-v3-frame-aware.js` from
 * ATDD_BLE_IPHONE_REVIEW_20261117 was NOT present in this Cloud Agent VM.
 * This module continues the stated v3 goals (5/5 simulated tests → expanded
 * coverage) without inventing ATDD repair-code databases or claiming FIXD
 * hardware verification. If/when the original file is dropped into
 * mike-ai/recovery/private/inbox/, replace or diff-merge this module.
 *
 * Rules:
 * - Never emit DTCs from incomplete / negative / NO DATA responses.
 * - Simulated fixtures must be labeled by callers (provenance: simulated).
 */

const SINGLE_FRAME = 0x0;
const FIRST_FRAME = 0x1;
const CONSECUTIVE_FRAME = 0x2;
const FLOW_CONTROL = 0x3;

export function decodeDtcPair(a, b) {
  if (a == null || b == null) return null;
  if (a === 0 && b === 0) return null;
  const type = ["P", "C", "B", "U"][(a & 0xc0) >> 6];
  const d1 = (a & 0x30) >> 4;
  const d2 = (a & 0x0f).toString(16).toUpperCase();
  const d3 = ((b & 0xf0) >> 4).toString(16).toUpperCase();
  const d4 = (b & 0x0f).toString(16).toUpperCase();
  return `${type}${d1}${d2}${d3}${d4}`;
}

export function hexToBytes(hex) {
  const cleaned = String(hex).replace(/[^0-9A-Fa-f]/g, "");
  if (cleaned.length % 2 !== 0) return null;
  const out = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    out.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return out;
}

export function classifyNegativeResponse(bytes) {
  // ISO 14229 / UDS: 0x7F <SID> <NRC>
  if (!bytes || bytes.length < 3) return null;
  if (bytes[0] !== 0x7f) return null;
  return {
    kind: "negative_response",
    sid: bytes[1],
    nrc: bytes[2],
    codes: []
  };
}

/**
 * Parse one ISO-TP CAN frame (PCI + payload). Does not invent data.
 */
export function parseIsoTpFrame(bytes) {
  if (!bytes || !bytes.length) {
    return { kind: "incomplete", reason: "empty_frame", codes: [] };
  }
  const pciType = bytes[0] >> 4;
  const pciInfo = bytes[0] & 0x0f;

  if (pciType === SINGLE_FRAME) {
    const len = pciInfo;
    const payload = bytes.slice(1, 1 + len);
    if (payload.length < len) {
      return { kind: "incomplete", reason: "single_frame_short", codes: [] };
    }
    return { kind: "single", length: len, payload };
  }

  if (pciType === FIRST_FRAME) {
    if (bytes.length < 2) {
      return { kind: "incomplete", reason: "first_frame_short", codes: [] };
    }
    const totalLength = (pciInfo << 8) | bytes[1];
    const payload = bytes.slice(2);
    return {
      kind: "first",
      totalLength,
      payload,
      nextSn: 1
    };
  }

  if (pciType === CONSECUTIVE_FRAME) {
    return {
      kind: "consecutive",
      sn: pciInfo,
      payload: bytes.slice(1)
    };
  }

  if (pciType === FLOW_CONTROL) {
    return {
      kind: "flow_control",
      flag: pciInfo,
      payload: bytes.slice(1),
      codes: []
    };
  }

  return { kind: "unknown_pci", codes: [] };
}

/**
 * Assemble ISO-TP multi-frame payloads in order. Drops incomplete assemblies.
 */
export function assembleIsoTp(frames) {
  if (!Array.isArray(frames) || !frames.length) {
    return { ok: false, reason: "no_frames", payload: null };
  }

  const parsed = frames.map((f) =>
    Array.isArray(f) ? parseIsoTpFrame(f) : parseIsoTpFrame(hexToBytes(f) || [])
  );

  if (parsed[0].kind === "single") {
    return { ok: true, payload: parsed[0].payload };
  }

  if (parsed[0].kind !== "first") {
    return { ok: false, reason: "missing_first_frame", payload: null };
  }

  const total = parsed[0].totalLength;
  let buf = [...parsed[0].payload];
  let expectSn = 1;

  for (let i = 1; i < parsed.length; i++) {
    const fr = parsed[i];
    if (fr.kind === "flow_control") continue;
    if (fr.kind !== "consecutive") {
      return { ok: false, reason: "unexpected_frame", payload: null };
    }
    if (fr.sn !== (expectSn & 0x0f)) {
      return { ok: false, reason: "sequence_mismatch", payload: null };
    }
    buf = buf.concat(fr.payload);
    expectSn += 1;
  }

  if (buf.length < total) {
    return { ok: false, reason: "incomplete_message", payload: null, have: buf.length, need: total };
  }

  return { ok: true, payload: buf.slice(0, total) };
}

/**
 * Extract Mode 03/07/0A DTCs from a completed OBD payload (service+data).
 * serviceByte examples: 0x43 (positive response to 0x03).
 */
export function extractDtcsFromPayload(payload, { serviceByte = 0x43 } = {}) {
  if (!payload || !payload.length) {
    return { codes: [], provenance: "empty", rejected: "empty_payload" };
  }

  const neg = classifyNegativeResponse(payload);
  if (neg) {
    return { codes: [], provenance: "negative_response", rejected: neg };
  }

  let start = 0;
  if (payload[0] === serviceByte) {
    start = 1;
    // Optional count byte used by some adapters
    if (payload.length > 1 && payload[1] <= 16 && payload.length === 2 + payload[1] * 2) {
      start = 2;
    }
  } else if (payload[0] === serviceByte - 0x40) {
    // Echo of request SID without positive offset — treat as incomplete/invalid for DTC emit
    return { codes: [], provenance: "request_echo", rejected: "not_positive_response" };
  }

  const codes = [];
  for (let i = start; i + 1 < payload.length; i += 2) {
    const code = decodeDtcPair(payload[i], payload[i + 1]);
    if (code) codes.push(code);
  }

  // De-dupe while preserving order
  const seen = new Set();
  const unique = [];
  for (const c of codes) {
    if (seen.has(c)) continue;
    seen.add(c);
    unique.push(c);
  }

  return { codes: unique, provenance: "ecu_payload", duplicatesRemoved: codes.length - unique.length };
}

/**
 * Parse multi-ECU ELM-style lines that include headers (e.g. "7E8 10 0E 43 ...").
 * When headers are absent, treats the stream as a single ECU.
 */
function looksLikeClassicServiceLine(bytes) {
  // Classic ELM Mode 03/07/0A positive responses start with 43/47/4A — not ISO-TP PCI.
  if (!bytes || !bytes.length) return false;
  return bytes[0] === 0x43 || bytes[0] === 0x47 || bytes[0] === 0x4a || bytes[0] === 0x7f;
}

export function parseMultiEcuElmLines(text) {
  const lines = String(text)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && l !== ">" && !/^SEARCHING/i.test(l) && !/^OK$/i.test(l) && !/^NO DATA$/i.test(l) && !/^STOPPED$/i.test(l) && !/^UNABLE/i.test(l) && !/^CAN ERROR/i.test(l) && !/^BUS/i.test(l) && !/^ERR/i.test(l));

  if (!lines.length) {
    const joinedUpper = String(text).toUpperCase();
    if (/\bNO DATA\b/.test(joinedUpper)) {
      return { ok: false, reason: "no_data", ecus: [], codes: [] };
    }
    return { ok: false, reason: "no_data_or_empty", ecus: [], codes: [] };
  }

  // Detect negative textual responses
  const joinedUpper = String(text).toUpperCase();
  if (/\bNO DATA\b/.test(joinedUpper) && lines.every((l) => !/^[0-9A-F]/i.test(l))) {
    return { ok: false, reason: "no_data", ecus: [], codes: [] };
  }

  const byEcu = new Map();
  const classicByEcu = new Map();

  for (const line of lines) {
    const parts = line.split(/\s+/).filter(Boolean);
    let ecuId = "default";
    let hexParts = parts;
    let headerStripped = false;
    // Header present if first token looks like 3–8 hex CAN ID and remaining starts with PCI…
    if (parts.length >= 2 && /^[0-9A-Fa-f]{3,8}$/.test(parts[0]) && /^[0-9A-Fa-f]{2}$/.test(parts[1])) {
      const maybePci = parseInt(parts[1], 16);
      const pciType = maybePci >> 4;
      if (pciType <= 3) {
        ecuId = parts[0].toUpperCase();
        hexParts = parts.slice(1);
        headerStripped = true;
      }
    }
    const bytes = hexToBytes(hexParts.join(""));
    if (!bytes) continue;

    // Classic ELM (no CAN header / no ISO-TP): service response bytes directly
    if (!headerStripped && looksLikeClassicServiceLine(bytes)) {
      if (!classicByEcu.has(ecuId)) classicByEcu.set(ecuId, []);
      classicByEcu.get(ecuId).push(bytes);
      continue;
    }

    if (!byEcu.has(ecuId)) byEcu.set(ecuId, []);
    byEcu.get(ecuId).push(bytes);
  }

  const ecus = [];
  const allCodes = [];

  for (const [ecuId, payloads] of classicByEcu) {
    // Concatenate classic multi-line Mode 03 continuations
    const merged = payloads.reduce((acc, p) => acc.concat(p), []);
    // If multiple lines each start with 43, parse each separately then merge codes
    let codes = [];
    let duplicatesRemoved = 0;
    if (payloads.every((p) => p[0] === merged[0])) {
      for (const p of payloads) {
        const extracted = extractDtcsFromPayload(p);
        codes.push(...extracted.codes);
        duplicatesRemoved += extracted.duplicatesRemoved || 0;
      }
    } else {
      const extracted = extractDtcsFromPayload(merged);
      codes = extracted.codes;
      duplicatesRemoved = extracted.duplicatesRemoved || 0;
    }
    const seenLocal = new Set();
    const unique = [];
    for (const c of codes) {
      if (seenLocal.has(c)) {
        duplicatesRemoved += 1;
        continue;
      }
      seenLocal.add(c);
      unique.push(c);
    }
    ecus.push({
      ecuId,
      ok: true,
      codes: unique,
      provenance: "ecu_payload",
      duplicatesRemoved,
      framing: "classic_elm"
    });
    allCodes.push(...unique);
  }

  for (const [ecuId, frames] of byEcu) {
    const assembled = assembleIsoTp(frames);
    if (!assembled.ok) {
      ecus.push({ ecuId, ok: false, reason: assembled.reason, codes: [], framing: "iso-tp" });
      continue;
    }
    const extracted = extractDtcsFromPayload(assembled.payload);
    ecus.push({
      ecuId,
      ok: true,
      codes: extracted.codes,
      provenance: extracted.provenance,
      duplicatesRemoved: extracted.duplicatesRemoved || 0,
      framing: "iso-tp"
    });
    allCodes.push(...extracted.codes);
  }

  const seen = new Set();
  const codes = [];
  for (const c of allCodes) {
    if (seen.has(c)) continue;
    seen.add(c);
    codes.push(c);
  }

  return { ok: codes.length > 0 || ecus.some((e) => e.ok && e.provenance === "ecu_payload"), ecus, codes };
}

/**
 * High-level Mode 03 parse entry used by ATDD BLE / web shells.
 */
export function parseMode03FrameAware(text, { provenance = "unspecified" } = {}) {
  const result = parseMultiEcuElmLines(text);
  return {
    ...result,
    provenance,
    isSimulated: provenance === "simulated",
    // Callers MUST NOT present simulated results as live scanner data.
    displayPolicy: provenance === "simulated" ? "label_as_simulated" : "live_or_imported"
  };
}

export const PROTOCOL_V3_META = {
  name: "obd-protocol-v3-frame-aware",
  version: "3.1.0-cloud-continuation",
  source: "netgene/atdd/obd (OneDrive original not imported)",
  fixdClaim: "UNVERIFIED",
  elm327Claim: "PARSER_ONLY — transport/protocol must be probed per adapter"
};
