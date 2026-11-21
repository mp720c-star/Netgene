/**
 * Read-only OBD-II PID helpers (ELM327-style ASCII replies).
 * Does not claim FIXD brand support. Only parses standard Mode 01 / 09 responses.
 */

export const READ_ONLY_PIDS = [
  { id: "rpm", modePid: "010C", name: "Engine RPM", unit: "rpm" },
  { id: "coolant", modePid: "0105", name: "Coolant temperature", unit: "°C" },
  { id: "speed", modePid: "010D", name: "Vehicle speed", unit: "km/h" },
  { id: "vin", modePid: "0902", name: "VIN", unit: null },
  { id: "dtc", modePid: "03", name: "Stored DTCs", unit: null },
];

/** Hex payload from ELM lines, stripping prompts and AT chatter. */
export function extractHexPayload(text) {
  const cleaned = String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^SEARCHING/i.test(l) &&
        l !== ">" &&
        !/^OK$/i.test(l) &&
        !/^AT/i.test(l) &&
        !/^STOPPED$/i.test(l) &&
        !/^BUSY$/i.test(l),
    );
  const hexChunks = [];
  for (const line of cleaned) {
    const noSpaces = line.replace(/\s+/g, "").toUpperCase();
    if (!/^[0-9A-F]+$/.test(noSpaces)) continue;
    hexChunks.push(noSpaces);
  }
  return hexChunks.join("");
}

export function hexToBytes(hex) {
  const cleaned = String(hex || "").replace(/[^0-9A-Fa-f]/g, "");
  if (!cleaned || cleaned.length % 2 !== 0) return null;
  const out = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    out.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return out;
}

/**
 * Parse Mode 01 PID 0C — RPM = ((A*256)+B)/4
 */
export function parseRpmResponse(text) {
  const hex = extractHexPayload(text);
  const idx = hex.indexOf("410C");
  if (idx < 0) {
    return { ok: false, reason: "no_410C", value: null, unit: "rpm", raw: text };
  }
  const bytes = hexToBytes(hex.slice(idx + 4));
  if (!bytes || bytes.length < 2) {
    return { ok: false, reason: "short_payload", value: null, unit: "rpm", raw: text };
  }
  const value = ((bytes[0] << 8) + bytes[1]) / 4;
  return { ok: true, value, unit: "rpm", raw: text };
}

/**
 * Parse Mode 01 PID 05 — coolant °C = A - 40
 */
export function parseCoolantResponse(text) {
  const hex = extractHexPayload(text);
  const idx = hex.indexOf("4105");
  if (idx < 0) {
    return { ok: false, reason: "no_4105", value: null, unit: "°C", raw: text };
  }
  const bytes = hexToBytes(hex.slice(idx + 4));
  if (!bytes || bytes.length < 1) {
    return { ok: false, reason: "short_payload", value: null, unit: "°C", raw: text };
  }
  return { ok: true, value: bytes[0] - 40, unit: "°C", raw: text };
}

/**
 * Parse Mode 01 PID 0D — speed km/h = A
 */
export function parseSpeedResponse(text) {
  const hex = extractHexPayload(text);
  const idx = hex.indexOf("410D");
  if (idx < 0) {
    return { ok: false, reason: "no_410D", value: null, unit: "km/h", raw: text };
  }
  const bytes = hexToBytes(hex.slice(idx + 4));
  if (!bytes || bytes.length < 1) {
    return { ok: false, reason: "short_payload", value: null, unit: "km/h", raw: text };
  }
  return { ok: true, value: bytes[0], unit: "km/h", raw: text };
}

/**
 * Parse Mode 09 PID 02 — VIN (ISO 15031-5 / ELM multi-line).
 * Returns null VIN when payload is incomplete — never invents characters.
 */
export function parseVinResponse(text) {
  const upper = String(text || "").toUpperCase();
  if (/\bNO DATA\b/.test(upper) || /\bERROR\b/.test(upper)) {
    return { ok: false, reason: "negative_or_no_data", vin: null, raw: text };
  }
  const hex = extractHexPayload(text);
  // Look for 49 02 … response; VIN ASCII often follows after count byte(s).
  let idx = hex.indexOf("4902");
  if (idx < 0) {
    return { ok: false, reason: "no_4902", vin: null, raw: text };
  }
  let payload = hex.slice(idx + 4);
  // Drop leading frame index / count nibbles commonly seen in ELM dumps.
  // Keep only printable ASCII A-Z0-9 for VIN.
  const bytes = hexToBytes(payload);
  if (!bytes) {
    return { ok: false, reason: "bad_hex", vin: null, raw: text };
  }
  let chars = "";
  for (const b of bytes) {
    if (b >= 0x30 && b <= 0x39) chars += String.fromCharCode(b);
    else if (b >= 0x41 && b <= 0x5a) chars += String.fromCharCode(b);
    else if (b >= 0x61 && b <= 0x7a) chars += String.fromCharCode(b).toUpperCase();
  }
  // VIN is 17 chars when fully present; reject invented padding.
  const vinMatch = chars.match(/[A-HJ-NPR-Z0-9]{17}/);
  if (!vinMatch) {
    return {
      ok: false,
      reason: chars.length ? "incomplete_vin" : "no_ascii_vin",
      vin: null,
      partial: chars || null,
      raw: text,
    };
  }
  return { ok: true, vin: vinMatch[0], raw: text };
}

export function parsePidReply(modePid, text) {
  const id = String(modePid || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (id === "010C") return { pid: "010C", ...parseRpmResponse(text) };
  if (id === "0105") return { pid: "0105", ...parseCoolantResponse(text) };
  if (id === "010D") return { pid: "010D", ...parseSpeedResponse(text) };
  if (id === "0902") return { pid: "0902", ...parseVinResponse(text) };
  return { pid: id, ok: false, reason: "unsupported_pid_parser", raw: text };
}
