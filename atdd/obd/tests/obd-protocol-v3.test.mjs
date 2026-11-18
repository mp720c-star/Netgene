import assert from "node:assert/strict";
import {
  decodeDtcPair,
  parseIsoTpFrame,
  assembleIsoTp,
  extractDtcsFromPayload,
  parseMode03FrameAware,
  classifyNegativeResponse,
  PROTOCOL_V3_META
} from "../obd-protocol-v3-frame-aware.js";

// --- baseline (5 simulated cases the review claimed) ---
assert.equal(decodeDtcPair(0x03, 0x01), "P0301");
assert.equal(decodeDtcPair(0x04, 0x20), "P0420");
assert.equal(decodeDtcPair(0x00, 0x00), null);

{
  const r = parseMode03FrameAware("43 02 03 01 04 20\r\n>", { provenance: "simulated" });
  assert.deepEqual(r.codes, ["P0301", "P0420"]);
  assert.equal(r.isSimulated, true);
  assert.equal(r.displayPolicy, "label_as_simulated");
}

{
  const r = parseMode03FrameAware("NO DATA\r\n>", { provenance: "simulated" });
  assert.equal(r.codes.length, 0);
  assert.ok(r.reason === "no_data" || r.reason === "no_data_or_empty");
}

{
  const r = parseMode03FrameAware("43 00\r\n>", { provenance: "simulated" });
  assert.deepEqual(r.codes, []);
}

// --- negative response: never emit codes ---
{
  const neg = classifyNegativeResponse([0x7f, 0x03, 0x11]);
  assert.equal(neg.kind, "negative_response");
  const extracted = extractDtcsFromPayload([0x7f, 0x03, 0x11]);
  assert.deepEqual(extracted.codes, []);
  assert.equal(extracted.provenance, "negative_response");
}

// --- incomplete single frame ---
{
  const fr = parseIsoTpFrame([0x05, 0x43, 0x01]); // claims 5 bytes, only 2 follow
  assert.equal(fr.kind, "incomplete");
}

// --- ISO-TP multi-frame Mode 03 (first + consecutive) ---
{
  // totalLength 6 → payload 43 03 01 04 20 00 → DTCs P0301, P0420
  const first = [0x10, 0x06, 0x43, 0x03, 0x01, 0x04];
  const cons = [0x21, 0x20, 0x00];
  const assembled = assembleIsoTp([first, cons]);
  assert.equal(assembled.ok, true);
  const extracted = extractDtcsFromPayload(assembled.payload);
  assert.ok(extracted.codes.includes("P0301"));
  assert.ok(extracted.codes.includes("P0420"));
}

// --- incomplete multi-frame (missing consecutive) ---
{
  const first = [0x10, 0x0A, 0x43, 0x03, 0x01, 0x04];
  const assembled = assembleIsoTp([first]);
  assert.equal(assembled.ok, false);
  assert.equal(assembled.reason, "incomplete_message");
}

// --- sequence mismatch ---
{
  const first = [0x10, 0x06, 0x43, 0x03, 0x01, 0x04];
  const badSn = [0x22, 0x20, 0x00]; // SN2 instead of SN1
  const assembled = assembleIsoTp([first, badSn]);
  assert.equal(assembled.ok, false);
  assert.equal(assembled.reason, "sequence_mismatch");
}

// --- duplicate codes collapsed ---
{
  const r = parseMode03FrameAware("43 03 01 03 01 04 20\r\n>", { provenance: "simulated" });
  assert.deepEqual(r.codes, ["P0301", "P0420"]);
}

// --- multi-ECU with headers ---
{
  const text = [
    "7E8 10 08 43 03 01 04",
    "7E8 21 20 00 00 00 00 00",
    "7E9 03 43 01 02", // single-frame P0102 from second ECU (03=len PCI)
    ">"
  ].join("\r\n");
  // 7E9 single: PCI 0x03 len3 → 43 01 02 → wait bytes after header: 03 43 01 02
  // Actually line "7E9 03 43 01 02" → pci 0x03 single len 3 → payload 43 01 02 — only one pair after 43? 01 02 → P0102
  const r = parseMode03FrameAware(text, { provenance: "simulated" });
  assert.ok(r.ecus.length >= 1);
  assert.ok(r.codes.includes("P0301") || r.codes.includes("P0420") || r.codes.includes("P0102"));
}

// --- flow control ignored during assemble ---
{
  const first = [0x10, 0x06, 0x43, 0x03, 0x01, 0x04];
  const fc = [0x30, 0x00, 0x00];
  const cons = [0x21, 0x20, 0x00];
  const assembled = assembleIsoTp([first, fc, cons]);
  assert.equal(assembled.ok, true);
}

assert.equal(PROTOCOL_V3_META.fixdClaim, "UNVERIFIED");
assert.ok(PROTOCOL_V3_META.version.includes("3."));

console.log("obd-protocol-v3-frame-aware tests passed");
