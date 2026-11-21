import { assembleIsoTp, decodeDtcPair } from "../tools/js/obd-protocol-v3-frame-aware.js";

function bytes(text) {
  const hex = text.replace(/\s/g, "");
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error("Invalid bytes in the vehicle reply.");
  return hex.match(/../g).map((pair) => Number.parseInt(pair, 16));
}

function readPayload(payload, codes) {
  if (payload[0] === 0x7f) throw new Error("The vehicle rejected the stored-code request.");
  if (payload[0] !== 0x43 || payload.length < 2) throw new Error("Missing a complete stored-code response.");
  let data = payload.slice(1);
  const counted = data.length % 2 === 1;
  if (counted) {
    const count = data.shift();
    const length = count * 2;
    if (data.length < length || data.slice(length).some((b) => b !== 0)) {
      throw new Error("The vehicle's code count does not match its reply.");
    }
    data = data.slice(0, length);
  }
  let padding = false;
  for (let i = 0; i < data.length; i += 2) {
    const code = decodeDtcPair(data[i], data[i + 1]);
    if (!code) {
      if (counted) throw new Error("The vehicle's reply is missing a reported code.");
      padding = true;
    } else {
      if (padding) throw new Error("Unexpected data after the end of the code list.");
      codes.add(code);
    }
  }
}

// With headers off, ELM may return plain 43 payloads or a byte count and numbered
// rows. Some adapters retain CAN headers. Finish every ECU before reporting a result.
export function storedCodes(reply) {
  const response = String(reply).trim().toUpperCase();
  if (!/^[^>]*>$/.test(response)) throw new Error("The scanner reply is incomplete.");
  const lines = response.slice(0, -1).split(/[\r\n]+/)
    .map((line) => line.trim().replace(/^SEARCHING\.{3}\s*/, ""))
    .filter((line) => line && line !== "03");
  if (lines.length === 0) throw new Error("The vehicle did not reply.");
  const codes = new Set();
  const framed = new Map();
  let messages = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^[0-9A-F]{3}$/.test(line)) {
      const length = Number.parseInt(line, 16);
      const data = [];
      let row = 0;
      while (i + 1 < lines.length && /^[0-9A-F]:/.test(lines[i + 1])) {
        const [label, values] = lines[++i].split(":");
        if (Number.parseInt(label, 16) !== (row++ % 16)) throw new Error("A scanner response row is missing.");
        data.push(...bytes(values));
      }
      if (!row || data.length !== length) throw new Error("Incomplete multiline vehicle response.");
      readPayload(data, codes);
      messages++;
      continue;
    }
    const can = line.match(/^([0-9A-F]{3}|[0-9A-F]{8})\s+(.+)$/);
    if (can) {
      const frames = framed.get(can[1]) || [];
      frames.push(bytes(can[2]));
      framed.set(can[1], frames);
    } else {
      if (!/^[0-9A-F\s]+$/.test(line)) throw new Error("Scanner reported " + line.slice(0, 100) + ".");
      readPayload(bytes(line), codes);
      messages++;
    }
  }
  for (const frames of framed.values()) {
    if (frames[0][0] < 0x10 && frames.length !== 1) throw new Error("Unexpected extra vehicle frames.");
    const result = assembleIsoTp(frames);
    if (!result.ok) throw new Error("Incomplete vehicle frames (" + result.reason + ").");
    readPayload(result.payload, codes);
    messages++;
  }
  if (!messages) throw new Error("The vehicle did not return stored-code data.");
  return [...codes];
}
