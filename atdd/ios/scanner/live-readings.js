/**
 * SAE J1979 / ISO 15031-5 Mode 01 live data.
 *
 * A number is returned only when the scanner reply contains the service 0x41
 * response and every data byte that formula needs. A missing reply, a short
 * frame, NO DATA, or a negative response produces no value.
 *
 * PID support bits follow SAE J1979: for a 4-byte map whose first PID is
 * base+1, bit 7 of the first byte is that PID. PID 0x20 and 0x60 are the
 * "more PIDs" bits, not sensor values.
 */

export const LIVE_ITEMS = Object.freeze([
  { pid: "04", bytes: 1, name: "Calculated engine load", unit: "%", places: 1 },
  { pid: "05", bytes: 1, name: "Engine coolant temperature", unit: "°C", places: 0 },
  { pid: "0C", bytes: 2, name: "Engine speed", unit: "rpm", places: 0 },
  { pid: "0D", bytes: 1, name: "Vehicle speed", unit: "km/h", places: 0 },
  { pid: "0F", bytes: 1, name: "Intake air temperature", unit: "°C", places: 0 },
  { pid: "11", bytes: 1, name: "Throttle position", unit: "%", places: 1 },
  { pid: "42", bytes: 2, name: "Control module voltage", unit: "V", places: 2 },
]);

/** What this Bluetooth LE app can open, and what it will not pretend to read. */
export const BLUETOOTH_SUPPORT = Object.freeze({
  compatible: Object.freeze([
    {
      id: "ble-elm-fff0",
      summary: "ELM327-style BLE UART on service FFF0 (notify FFF1, write FFF2) when the adapter answers AT commands and Mode 01/03 with an ELM prompt.",
    },
    {
      id: "ble-elm-ffe0",
      summary: "ELM327-style BLE UART on service FFE0 / characteristic FFE1 when the adapter answers the same ELM text protocol.",
    },
    {
      id: "ble-elm-18f0",
      summary: "Vlinker-style BLE serial on service 18F0 (notify 2AF0, write 2AF1) when the adapter answers the same ELM text protocol.",
    },
    {
      id: "ble-nordic-uart",
      summary: "Nordic UART service 6E400001 when the adapter speaks the same ELM text protocol on the write and notify characteristics.",
    },
  ]),
  unsupported: Object.freeze([
    {
      id: "fixd-proprietary",
      summary: "FIXD's own protocol is unverified. A Bluetooth name containing FIXD is not a reading. If AT commands do not return an ELM prompt, no live value is shown.",
    },
    {
      id: "classic-bluetooth-serial",
      summary: "Classic Bluetooth serial (SPP) adapters are not opened. ATDD Connect uses Bluetooth Low Energy only.",
    },
    {
      id: "wifi-elm",
      summary: "Wi-Fi ELM adapters are not a Bluetooth connection.",
    },
    {
      id: "iphone-safari",
      summary: "iPhone Safari and a Home Screen web page have no Web Bluetooth. Live data needs the native ATDD Connect app.",
    },
  ]),
});

export const NO_LIVE_READING = "No live reading from the scanner.";

const ITEM_BY_PID = new Map(LIVE_ITEMS.map((item) => [item.pid, item]));

function pidByte(pid) {
  const value = Number.parseInt(pid, 16);
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new Error("PID " + pid + " is not a Mode 01 identifier.");
  }
  return value;
}

function lineBytes(line) {
  const parts = String(line).trim().split(/\s+/).filter(Boolean);
  const byte = (part) => /^[0-9A-F]{2}$/i.test(part);
  if (parts.length > 1 && parts.every(byte)) {
    return parts.map((part) => Number.parseInt(part, 16));
  }
  // ELM can leave an 11-bit CAN id (7E8) in front of the PCI and payload.
  if (parts.length > 2 && /^[0-9A-F]{3}$/i.test(parts[0]) && parts.slice(1).every(byte)) {
    return parts.slice(1).map((part) => Number.parseInt(part, 16));
  }
  if (parts.length === 1 && /^[0-9A-F]+$/i.test(parts[0]) && parts[0].length % 2 === 0) {
    const bytes = [];
    for (let i = 0; i < parts[0].length; i += 2) {
      bytes.push(Number.parseInt(parts[0].slice(i, i + 2), 16));
    }
    return bytes;
  }
  return null;
}

function replyLines(reply) {
  return String(reply)
    .replace(/\r/g, "\n")
    .replace(/SEARCHING[.\u2026]*/gi, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== ">");
}

/**
 * PIDs marked supported in one 4-byte SAE map.
 * @param {string} reply
 * @param {"00"|"40"} mapPid The PID that was requested (0100 or 0140).
 * @returns {string[]} Uppercase PIDs, including the trailing "more PIDs" bit.
 */
export function supportBitmap(reply, mapPid) {
  const text = String(reply ?? "");
  if (!text.includes(">")) throw new Error("The scanner reply is incomplete.");
  if (/\bNO DATA\b/i.test(text)) throw new Error("The vehicle did not report which live data it supports.");
  const base = pidByte(mapPid);
  const wanted = base;
  for (const line of replyLines(text)) {
    if (/^7F\b/i.test(line.replace(/\s+/g, ""))) {
      throw new Error("The vehicle rejected the live-data support request.");
    }
    const bytes = lineBytes(line);
    if (!bytes) continue;
    for (let i = 0; i + 5 < bytes.length; i += 1) {
      if (bytes[i] !== 0x41 || bytes[i + 1] !== wanted) continue;
      const data = bytes.slice(i + 2, i + 6);
      if (data.length !== 4) continue;
      const supported = [];
      for (let bitIndex = 0; bitIndex < 32; bitIndex += 1) {
        const byte = data[Math.floor(bitIndex / 8)];
        const bit = 7 - (bitIndex % 8);
        if ((byte >> bit) & 1) {
          supported.push((base + 1 + bitIndex).toString(16).toUpperCase().padStart(2, "0"));
        }
      }
      return supported;
    }
  }
  throw new Error("The support reply did not contain a complete Mode 01 map.");
}

/** Mode 01 commands for the known items whose PIDs the vehicle marked supported. */
export function liveCommands(supportedPids) {
  const supported = new Set((supportedPids || []).map((pid) => String(pid).toUpperCase()));
  return LIVE_ITEMS.filter((item) => supported.has(item.pid)).map((item) => "01" + item.pid);
}

function payloadBytes(reply, pid, count) {
  const text = String(reply ?? "");
  if (!text.includes(">")) throw new Error("The scanner reply is incomplete.");
  if (/\bNO DATA\b/i.test(text)) throw new Error(NO_LIVE_READING);
  const wanted = pidByte(pid);
  let rejected = false;
  for (const line of replyLines(text)) {
    const packed = line.replace(/\s+/g, "");
    if (/^7F01/i.test(packed)) rejected = true;
    const bytes = lineBytes(line);
    if (!bytes) continue;
    for (let i = 0; i + 1 < bytes.length; i += 1) {
      if (bytes[i] !== 0x41 || bytes[i + 1] !== wanted) continue;
      const data = bytes.slice(i + 2, i + 2 + count);
      if (data.length === count) return data;
    }
  }
  if (rejected) throw new Error("The vehicle rejected PID " + String(pid).toUpperCase() + ".");
  throw new Error(NO_LIVE_READING);
}

/** Decode one Mode 01 reply. Throws instead of returning a guessed number. */
export function readingFromReply(pid, reply) {
  const item = ITEM_BY_PID.get(String(pid).toUpperCase());
  if (!item) throw new Error("This app does not decode PID " + pid + ".");
  const data = payloadBytes(reply, item.pid, item.bytes);
  const a = data[0];
  const b = data[1];
  let value;
  switch (item.pid) {
    case "04":
    case "11":
      value = (a * 100) / 255;
      break;
    case "05":
    case "0F":
      value = a - 40;
      break;
    case "0C":
      value = ((a * 256) + b) / 4;
      break;
    case "0D":
      value = a;
      break;
    case "42":
      value = ((a * 256) + b) / 1000;
      break;
    default:
      throw new Error("This app does not decode PID " + item.pid + ".");
  }
  if (!Number.isFinite(value)) throw new Error(NO_LIVE_READING);
  const shown = item.places === 0 ? String(Math.round(value)) : value.toFixed(item.places);
  return {
    pid: item.pid,
    name: item.name,
    unit: item.unit,
    value,
    display: shown + " " + item.unit,
    raw: String(reply),
  };
}

export function unsupportedSummary() {
  return BLUETOOTH_SUPPORT.unsupported.map((item) => item.summary).join(" ");
}
