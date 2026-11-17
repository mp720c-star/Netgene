/** Pure OBD helpers — safe to unit-test without Bluetooth. */

export const SERVICE_CANDIDATES = [
  // Common cheap ELM327 BLE clones
  0xfff0,
  // Nordic UART (some adapters)
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  // Another frequent vendor service
  "0000fff0-0000-1000-8000-00805f9b34fb"
];

export const OPTIONAL_SERVICES = [
  0xfff0,
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  0xffe0
];

const WRITE_HINTS = ["fff2", "ffe1", "6e400002"];
const NOTIFY_HINTS = ["fff1", "ffe1", "6e400003"];

export function normalizeUuid(uuid) {
  return String(uuid).toLowerCase().replace(/-/g, "");
}

export function pickCharacteristics(characteristics) {
  let write = null;
  let notify = null;

  for (const ch of characteristics) {
    const id = normalizeUuid(ch.uuid);
    const props = ch.properties || {};
    if (!write && WRITE_HINTS.some((h) => id.includes(h)) && (props.write || props.writeWithoutResponse)) {
      write = ch;
    }
    if (!notify && NOTIFY_HINTS.some((h) => id.includes(h)) && props.notify) {
      notify = ch;
    }
  }

  if (!write) {
    write = characteristics.find((c) => c.properties?.write || c.properties?.writeWithoutResponse) || null;
  }
  if (!notify) {
    notify = characteristics.find((c) => c.properties?.notify || c.properties?.indicate) || null;
  }

  return { write, notify };
}

/** Decode Mode 03 DTC pair into P0xxx / C0xxx / B0xxx / U0xxx. */
export function decodeDtcPair(a, b) {
  if ((a === 0 && b === 0) || a == null || b == null) return null;
  const typeBits = (a & 0xc0) >> 6;
  const type = ["P", "C", "B", "U"][typeBits];
  const firstDigit = (a & 0x30) >> 4;
  const secondDigit = a & 0x0f;
  const thirdDigit = (b & 0xf0) >> 4;
  const fourthDigit = b & 0x0f;
  return `${type}${firstDigit}${secondDigit.toString(16).toUpperCase()}${thirdDigit.toString(16).toUpperCase()}${fourthDigit.toString(16).toUpperCase()}`;
}

/** Parse ELM/OBD hex payload lines for Mode 03 DTC frames. */
export function parseMode03Response(text) {
  const cleaned = String(text)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^SEARCHING/i.test(l) && l !== ">" && !/^OK$/i.test(l) && !/^AT/i.test(l));

  const hexChunks = [];
  for (const line of cleaned) {
    const noSpaces = line.replace(/\s+/g, "").toUpperCase();
    if (!/^[0-9A-F]+$/.test(noSpaces)) continue;
    hexChunks.push(noSpaces);
  }

  const joined = hexChunks.join("");
  // Prefer payload after 43 marker (Mode 03 positive response)
  let payload = joined;
  const idx = joined.indexOf("43");
  if (idx >= 0) payload = joined.slice(idx + 2);

  const bytes = [];
  for (let i = 0; i + 1 < payload.length; i += 2) {
    bytes.push(parseInt(payload.slice(i, i + 2), 16));
  }

  // Some adapters include a count byte after 43
  let start = 0;
  if (bytes.length && bytes[0] <= 16 && bytes.length === 1 + bytes[0] * 2) {
    start = 1;
  }

  const codes = [];
  for (let i = start; i + 1 < bytes.length; i += 2) {
    const code = decodeDtcPair(bytes[i], bytes[i + 1]);
    if (code) codes.push(code);
  }
  return [...new Set(codes)];
}

export function parseRpmResponse(text) {
  const bytes = extractPidBytes(text, "0C");
  if (!bytes || bytes.length < 2) return null;
  return Math.round(((bytes[0] * 256) + bytes[1]) / 4);
}

export function parseSpeedResponse(text) {
  const bytes = extractPidBytes(text, "0D");
  if (!bytes || bytes.length < 1) return null;
  return bytes[0];
}

function extractPidBytes(text, pid) {
  const joined = String(text)
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");
  const marker = `41${pid}`;
  const idx = joined.indexOf(marker);
  if (idx < 0) return null;
  const data = joined.slice(idx + marker.length);
  const bytes = [];
  for (let i = 0; i + 1 < data.length; i += 2) {
    bytes.push(parseInt(data.slice(i, i + 2), 16));
  }
  return bytes;
}

export function buildDemoMode03() {
  // Simulated ECU reply: P0301, P0420
  return "43 02 03 01 04 20\r\n>";
}

export function buildDemoRpm() {
  // 41 0C 1A F8 => ((0x1AF8)/4) = 1726 rpm
  return "41 0C 1A F8\r\n>";
}

export function buildDemoSpeed() {
  // 41 0D 37 => 55 km/h
  return "41 0D 37\r\n>";
}
