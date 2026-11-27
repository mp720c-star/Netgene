/**
 * ATDD hardware acceptance matrix A1–A11 — synthetic / mocked fixtures only.
 *
 * Source: ATDD_Scanner_Protocol_Inventory_and_Acceptance_Matrix_GROK_20261117.md
 * Every device × platform cell remains HARDWARE_STATUS = NOT_TESTED until a
 * dated live log (adapter ATI/STI, vehicle ATDP, raw transcript) is stored.
 * Fixtures below are labeled SYNTHETIC. They never prove scanner compatibility.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import {
  ALLOWED_ELM_ADAPTER_INIT,
  assertAllowedObdCommand,
} from "../web/js/obd-command-guard.js";
import { ELM_PROBE_SEQUENCE } from "../web/js/fixd-protocol-probe.js";
import {
  createScannerSession,
  createSimulatedTransport,
} from "../web/js/scanner-session.js";
import { parseMode03FrameAware } from "../web/js/obd-protocol-v3-frame-aware.js";

export const HARDWARE_STATUS = "NOT_TESTED";
export const FIXTURE_LABEL = "SYNTHETIC";

const classicRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../classic");

function loadVehicleScan() {
  const context = { window: {}, globalThis: {} };
  context.globalThis = context.window;
  runInNewContext(
    fs.readFileSync(path.join(classicRoot, "obdVehicleScan.js"), "utf8"),
    context,
  );
  return context.window.ATDDVehicleScan;
}

/** Scripted ELM transport with labeled SYNTHETIC replies. */
function createAcceptanceTransport(options = {}) {
  const {
    failAfterConnect = false,
    timeoutOn = null,
    disconnectOnce = false,
  } = options;
  let connected = false;
  let connectCount = 0;
  const sent = [];

  const replies = {
    ATZ: "ELM327 v1.5\r\n>",
    ATI: "ELM327 v1.5\r\n>",
    ATE0: "OK\r>",
    ATL0: "OK\r>",
    ATS0: "OK\r>",
    ATH0: "OK\r>",
    ATSP0: "OK\r>",
    ATDP: "AUTO, ISO 15765-4 (CAN 11/500)\r\n>",
    "0100": "41 00 BE 1F A8 13\r>",
    "010C": "41 0C 1F 40\r>", // SYNTHETIC ~2000 rpm
    "010D": "41 0D 3C\r>", // SYNTHETIC 60 km/h
    "0105": "41 05 64\r>", // SYNTHETIC coolant °C = 60
    "0902": "49 02 01 31 47 31 4A 43 35 34 34 34 52 37 32 35 32 33 36 37\r>",
    "03": "43 02 03 01 04 20\r>",
    "07": "47 01 03 01\r>",
    "0A": "4A 01 04 20\r>",
  };

  return {
    kind: "acceptance-synthetic",
    fixtureLabel: FIXTURE_LABEL,
    hardwareStatus: HARDWARE_STATUS,
    sent,
    async scan() {
      return [{ id: "syn-elm", name: "SYNTHETIC ELM327 (NOT LIVE HARDWARE)" }];
    },
    async connect() {
      connectCount += 1;
      if (failAfterConnect && connectCount === 1) {
        throw new Error("Scanner timeout");
      }
      if (disconnectOnce && connectCount === 2) {
        // second connect after simulated power-cycle
      }
      connected = true;
    },
    async inspectServices() {
      return [
        {
          uuid: "0000fff0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            { uuid: "0000fff1-0000-1000-8000-00805f9b34fb", properties: { notify: true } },
            { uuid: "0000fff2-0000-1000-8000-00805f9b34fb", properties: { write: true } },
          ],
        },
      ];
    },
    async send(cmd) {
      const c = String(cmd).trim().toUpperCase().replace(/\s+/g, "");
      sent.push(c);
      if (!connected) throw new Error("Not connected");
      if (timeoutOn && c === timeoutOn) {
        throw new Error("Scanner timeout");
      }
      if (Object.prototype.hasOwnProperty.call(replies, c)) {
        return replies[c];
      }
      if (c.startsWith("AT")) return "OK\r>";
      return "NO DATA\r>";
    },
    async disconnect() {
      connected = false;
    },
  };
}

function decodeMode01(pidHex, reply) {
  const bytes = String(reply)
    .toUpperCase()
    .match(/[0-9A-F]{2}/g)
    ?.map((b) => parseInt(b, 16));
  if (!bytes || bytes.length < 3) return null;
  const idx = bytes.findIndex((b, i) => b === 0x41 && bytes[i + 1] === pidHex);
  if (idx < 0) return null;
  const a = bytes[idx + 2];
  const b = bytes[idx + 3];
  if (pidHex === 0x0c) return ((a * 256 + b) / 4); // rpm
  if (pidHex === 0x0d) return a; // km/h
  if (pidHex === 0x05) return a - 40; // °C
  return null;
}

function decodeVin(reply) {
  const bytes = String(reply)
    .toUpperCase()
    .match(/[0-9A-F]{2}/g)
    ?.map((b) => parseInt(b, 16));
  if (!bytes) return "";
  const start = bytes.findIndex((b, i) => b === 0x49 && bytes[i + 1] === 0x02);
  if (start < 0) return "";
  // 49 02 01 <17 ascii>
  const chars = bytes.slice(start + 3, start + 3 + 17).map((n) => String.fromCharCode(n));
  return chars.join("");
}

// --- A1 Pair / bond (discover) ---
{
  const transport = createAcceptanceTransport();
  const session = createScannerSession(transport);
  const devices = await session.scan();
  assert.ok(devices.length >= 1, "A1: at least one device");
  assert.match(devices[0].name, /SYNTHETIC/i, "A1: fixture labeled SYNTHETIC");
  assert.equal(HARDWARE_STATUS, "NOT_TESTED");
  console.log("A1 ok — discover (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A2 Connect transport ---
{
  const transport = createAcceptanceTransport();
  const session = createScannerSession(transport);
  const devices = await session.scan();
  await session.connect(devices[0].id);
  assert.equal(session.getState().status, "connected");
  console.log("A2 ok — connect (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A3 ATZ + ATI ---
{
  const transport = createAcceptanceTransport();
  const session = createScannerSession(transport);
  await session.scan();
  await session.connect("syn-elm");
  const probe = await session.probeProtocol();
  assert.match(session.getState().transcript, /TX ATZ/, "A3: ATZ sent");
  assert.match(session.getState().transcript, /TX ATI/, "A3: ATI sent");
  assert.match(session.getState().transcript, /ELM327/, "A3: firmware id logged");
  assert.match(session.getState().transcript, />/, "A3: prompt present");
  assert.ok(probe);
  assert.equal(assertAllowedObdCommand("ATI"), "ATI");
  console.log("A3 ok — ATZ/ATI identity (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A4 ATSP0 then ATDP ---
{
  assert.ok(ELM_PROBE_SEQUENCE.includes("ATSP0"));
  assert.ok(ELM_PROBE_SEQUENCE.includes("ATDP"));
  assert.equal(assertAllowedObdCommand("ATDP"), "ATDP");
  const transport = createAcceptanceTransport();
  const session = createScannerSession(transport);
  await session.scan();
  await session.connect("syn-elm");
  await session.probeProtocol();
  const tx = session.getState().transcript;
  assert.match(tx, /TX ATSP0/);
  assert.match(tx, /TX ATDP/);
  assert.match(tx, /ISO 15765|CAN/i, "A4: protocol name logged");
  console.log("A4 ok — ATSP0/ATDP protocol (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A5 0100 supported PIDs ---
{
  assert.equal(assertAllowedObdCommand("0100"), "0100");
  const transport = createAcceptanceTransport();
  const session = createScannerSession(transport);
  await session.scan();
  await session.connect("syn-elm");
  await session.probeProtocol();
  assert.match(session.getState().transcript, /41 00 BE 1F A8 13/);
  console.log("A5 ok — 0100 bitmap (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A6 Mode 03 / 07 / 0A ---
{
  const transport = createAcceptanceTransport();
  await transport.scan();
  await transport.connect("syn-elm");
  const stored = parseMode03FrameAware(await transport.send("03"), {
    provenance: "acceptance-synthetic",
  });
  const pending = parseMode03FrameAware(await transport.send("07"), {
    provenance: "acceptance-synthetic",
  });
  const permanent = parseMode03FrameAware(await transport.send("0A"), {
    provenance: "acceptance-synthetic",
  });
  assert.deepEqual(stored.codes, ["P0301", "P0420"]);
  assert.ok(pending.codes.includes("P0301"));
  assert.ok(permanent.codes.includes("P0420"));
  assert.equal(stored.presentedAsLive, undefined);
  assert.notEqual(stored.isSimulated === true && stored.presentedAsLive === true, true);

  const scan = loadVehicleScan();
  const report = scan.buildReport([{ raw: "43 02 03 01 04 20\r47 01 03 01\r4A 01 04 20\r>" }]);
  assert.ok(report.uniqueCodes.includes("P0301"));
  assert.ok(report.uniqueCodes.includes("P0420"));
  console.log("A6 ok — stored/pending/permanent DTCs (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A7 0902 VIN ---
{
  assert.equal(assertAllowedObdCommand("0902"), "0902");
  const transport = createAcceptanceTransport();
  await transport.scan();
  await transport.connect("syn-elm");
  const reply = await transport.send("0902");
  const vin = decodeVin(reply);
  assert.equal(vin.length, 17, "A7: 17-char VIN");
  assert.match(vin, /^[A-HJ-NPR-Z0-9]{17}$/);
  console.log("A7 ok — VIN decode (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A8 Mode 04 gated (not in probe / New scan) ---
{
  assert.ok(!ELM_PROBE_SEQUENCE.includes("04"), "A8: probe must not clear codes");
  assert.ok(!ALLOWED_ELM_ADAPTER_INIT.includes("04"));
  // Confirmed clear remains allowed by the guard, but only via the explicit clear path.
  assert.equal(assertAllowedObdCommand("04"), "04");
  const bluetooth = fs.readFileSync(path.join(classicRoot, "bluetooth.js"), "utf8");
  assert.match(bluetooth, /clearCodesDialog|Clear vehicle codes|btnBtClearVehicle/);
  const html = fs.readFileSync(path.join(classicRoot, "index.html"), "utf8");
  assert.match(html, /id="clearCodesDialog"/);
  console.log("A8 ok — Mode 04 gated behind confirmed clear (not in probe)");
}

// --- A9 Timeout — no fabricated codes ---
{
  const transport = createAcceptanceTransport({ timeoutOn: "03" });
  const session = createScannerSession(transport);
  await session.scan();
  await session.connect("syn-elm");
  await session.probeProtocol();
  await assert.rejects(() => session.readStoredDtcs(), /Scanner timeout/);
  assert.equal(session.getState().lastDtcs, null);
  const silent = loadVehicleScan().buildReport([{ raw: "NO DATA\r>" }]);
  assert.deepEqual(JSON.parse(JSON.stringify(silent.uniqueCodes)), []);
  console.log("A9 ok — timeout / empty reply yields no fabricated codes");
}

// --- A10 Reconnect re-inits ---
{
  const transport = createAcceptanceTransport({ disconnectOnce: true });
  const session = createScannerSession(transport);
  await session.scan();
  await session.connect("syn-elm");
  await session.probeProtocol();
  const firstInit = transport.sent.filter((c) =>
    ["ATZ", "ATI", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0", "ATDP"].includes(c),
  );
  assert.ok(firstInit.includes("ATZ"));
  await session.disconnect();
  await session.scan();
  await session.connect("syn-elm");
  transport.sent.length = 0;
  await session.probeProtocol();
  assert.ok(transport.sent.includes("ATZ"), "A10: re-init sends ATZ");
  assert.ok(transport.sent.includes("ATSP0"), "A10: re-init sends ATSP0");
  console.log("A10 ok — reconnect re-runs init (SYNTHETIC; hardware NOT_TESTED)");
}

// --- A11 Live PIDs 010C / 010D / 0105 ---
{
  for (const pid of ["010C", "010D", "0105"]) {
    assert.equal(assertAllowedObdCommand(pid), pid);
  }
  const transport = createAcceptanceTransport();
  await transport.scan();
  await transport.connect("syn-elm");
  const rpm = decodeMode01(0x0c, await transport.send("010C"));
  const speed = decodeMode01(0x0d, await transport.send("010D"));
  const coolant = decodeMode01(0x05, await transport.send("0105"));
  assert.equal(rpm, 2000);
  assert.equal(speed, 60);
  assert.equal(coolant, 60);
  // Plausible ranges only — values are SYNTHETIC, not vehicle evidence.
  assert.ok(rpm > 0 && rpm < 8000);
  assert.ok(speed >= 0 && speed <= 250);
  assert.ok(coolant > -40 && coolant < 150);
  console.log("A11 ok — live PID decode (SYNTHETIC; hardware NOT_TESTED)");
}

// Simulated transport still labeled, never presented as live
{
  const session = createScannerSession(createSimulatedTransport());
  assert.equal(session.getState().provenance, "simulated");
  await session.scan();
  await session.connect("sim-elm");
  await session.probeProtocol();
  const dtcs = await session.readStoredDtcs();
  assert.equal(dtcs.presentedAsLive, false);
  assert.equal(dtcs.isSimulated, true);
}

console.log(
  `acceptance-matrix.test.mjs passed — A1–A11 synthetic fixtures only; hardware cells remain ${HARDWARE_STATUS}`,
);
