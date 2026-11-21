import assert from "node:assert/strict";
import { createScannerSession, createSimulatedTransport } from "../web/js/scanner-session.js";

function createMockBleTransport() {
  return {
    kind: "web-bluetooth",
    async scan() {
      return [{ id: "ble-1", name: "Mock ELM327" }];
    },
    async connect() {},
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
      const c = String(cmd).trim().toUpperCase();
      if (c.startsWith("AT")) return "OK\r>";
      if (c === "0100") return "41 00 BE 1F A8 13\r>";
      if (c === "03") return "43 02 03 01 04 20\r>";
      return "NO DATA\r>";
    },
    async disconnect() {},
  };
}

{
  const session = createScannerSession(createSimulatedTransport());
  assert.equal(session.getState().provenance, "simulated");
  const devices = await session.scan();
  assert.ok(devices.length >= 1);
  assert.ok(devices.every((d) => /SIMULATED/i.test(d.name)));
  await session.connect(devices[0].id);
  const probe = await session.probeProtocol();
  assert.ok(probe);
  const dtcs = await session.readStoredDtcs();
  assert.equal(dtcs.isSimulated, true);
  assert.equal(dtcs.presentedAsLive, false);
  assert.ok(Array.isArray(dtcs.codes));
  assert.ok(dtcs.codes.length >= 1);
  console.log("ok simulated connect/probe/dtc");
}

{
  const session = createScannerSession(createMockBleTransport());
  assert.equal(session.getState().provenance, "web-bluetooth");
  const devices = await session.scan();
  await session.connect(devices[0].id);
  assert.equal(session.getState().status, "connected");
  assert.equal(session.getState().provenance, "web-bluetooth");
  await session.probeProtocol();
  const dtcs = await session.readStoredDtcs();
  assert.equal(dtcs.isSimulated, false);
  assert.equal(dtcs.presentedAsLive, true);
  assert.ok(dtcs.codes.includes("P0301") || dtcs.codes.length >= 1);
  console.log("ok web-bluetooth mock connect/probe/dtc");
}

console.log("scanner-session.test.mjs passed");
