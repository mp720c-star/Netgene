/**
 * Join BLE notifications into one ELM327 reply.
 *
 * Many adapters print ">" after each line of a multiline vehicle response,
 * and iOS delivers those lines as separate notifications. Stopping at the
 * first ">" cuts the reply off before the later rows arrive, which surfaces
 * as "Incomplete multiline vehicle response."
 *
 * A reply is ready when a prompt has been seen and every declared multiline
 * byte count or ISO-TP first frame already has its bytes. Intermediate
 * prompts are removed so the parser sees one trailer ">".
 */

function linesOf(buffer) {
  return String(buffer)
    .replace(/\r/g, "\n")
    .replace(/>/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^SEARCHING\.{0,3}$/i.test(line));
}

function hexBytes(text) {
  const parts = String(text).trim().split(/\s+/).filter(Boolean);
  if (!parts.length || parts.some((part) => !/^[0-9A-F]{2}$/i.test(part))) return null;
  return parts.map((part) => Number.parseInt(part, 16));
}

/**
 * @param {string} buffer Notifications concatenated so far.
 * @param {string} [command] Command just written, so its echo is not a finished reply.
 * @returns {string|null} One reply ending in ">", or null while bytes are still missing.
 */
export function reassembleElmReply(buffer, command) {
  const text = String(buffer ?? "");
  if (!text.includes(">")) return null;
  const lines = linesOf(text);
  const echo = String(command || "").trim().toUpperCase();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[0-9A-F]{3}$/i.test(line)) {
      const need = Number.parseInt(line, 16);
      let got = 0;
      let rows = 0;
      i += 1;
      while (got < need && i < lines.length && /^[0-9A-F]:/i.test(lines[i])) {
        const hex = lines[i].slice(lines[i].indexOf(":") + 1).replace(/\s+/g, "");
        if (!hex || hex.length % 2 !== 0 || !/^[0-9A-F]+$/i.test(hex)) return null;
        got += hex.length / 2;
        rows += 1;
        i += 1;
      }
      if (need > 0 && (!rows || got < need)) return null;
      continue;
    }

    const frame = line.match(/^([0-9A-F]{3}|[0-9A-F]{8})\s+(.+)$/i);
    const bytes = frame ? hexBytes(frame[2]) : null;
    if (frame && bytes && (bytes[0] >> 4) === 1) {
      if (bytes.length < 2) return null;
      const total = ((bytes[0] & 0x0f) << 8) | bytes[1];
      let got = Math.max(0, bytes.length - 2);
      const ecu = frame[1].toUpperCase();
      let sequence = 1;
      i += 1;
      while (got < total) {
        if (i >= lines.length) return null;
        const next = lines[i].match(/^([0-9A-F]{3}|[0-9A-F]{8})\s+(.+)$/i);
        const nextBytes = next ? hexBytes(next[2]) : null;
        if (!next || !nextBytes || next[1].toUpperCase() !== ecu) return null;
        if ((nextBytes[0] >> 4) !== 2 || (nextBytes[0] & 0x0f) !== (sequence & 0x0f)) return null;
        got += Math.max(0, nextBytes.length - 1);
        sequence += 1;
        i += 1;
      }
      continue;
    }
    i += 1;
  }

  const payload = lines.filter((line) => line.toUpperCase() !== echo);
  if (!payload.length) return null;
  return payload.join("\r") + "\r>";
}
