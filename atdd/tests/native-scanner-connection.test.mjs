import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate as nextTurn } from "node:timers/promises";
import {
  bleHexToText, textToBleHex, expandBleUuid, selectNativeBleChannel,
  createCapacitorBleTransport, assertAllowedAdapterSetupCommand,
} from "../web/js/capacitor-ble-transport.js";
import { prepareElmAdapter, adapterAcknowledged } from "../ios/scanner/elm-adapter.js";
import { storedCodes } from "../ios/www/scanner/stored-codes.js";

const uuid = expandBleUuid;
const profile = {
  uuid: "FFF0",
  characteristics: [
    { uuid: "FFF1", properties: { notify: true } },
    { uuid: "FFF2", properties: { write: true, writeWithoutResponse: true } },
  ],
};
const custom = (suffix) => ({
  uuid: "12345678-1234-1234-1234-" + suffix,
  characteristics: [
    { uuid: "22345678-1234-1234-1234-" + suffix, properties: { write: true } },
    { uuid: "32345678-1234-1234-1234-" + suffix, properties: { indicate: true } },
  ],
});

function fake({ services = [profile], reply = "43 01 03 00\r>", failSubscribe = false, enabled = { value: true } } = {}) {
  const listeners = new Map();
  const writes = [];
  let channel;
  let removals = 0;
  let disconnects = 0;
  let stops = 0;
  function emit(text) {
    // Version 6.1.0 iOS dataToString() returns CONTINUOUS hex, not spaced hex.
    listeners.get(channel)?.({ value: textToBleHex(text).replaceAll(" ", "") });
  }
  async function write(options, method) {
    const command = bleHexToText(options.value).trim();
    writes.push({ ...options, command, method });
    if (typeof reply === "function") await reply(command, emit);
    else if (reply !== null) emit(reply);
  }
  const ble = {
    initialize: async () => {},
    isEnabled: async () => enabled,
    requestDevice: async () => ({ deviceId: "PHONE", name: "OBD adapter" }),
    addListener: async (key, callback) => {
      listeners.set(key, callback);
      return { remove: async () => { removals++; listeners.delete(key); } };
    },
    connect: async () => {},
    getServices: async () => ({ services }),
    startNotifications: async ({ service, characteristic }) => {
      if (failSubscribe) throw new Error("Subscribe failed");
      const short = (value) => value.replace(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/, "$1");
      channel = "notification|PHONE|" + short(service) + "|" + short(characteristic);
    },
    stopNotifications: async () => { stops++; },
    disconnect: async () => { disconnects++; },
    write: async (options) => write(options, "write"),
    writeWithoutResponse: async (options) => write(options, "writeWithoutResponse"),
  };
  globalThis.window = { Capacitor: { isNativePlatform: () => true, Plugins: { BluetoothLe: ble } } };
  const scanner = createCapacitorBleTransport({ replyTimeoutMs: 40, setupTimeoutMs: 40 });
  return { scanner, ble, writes, emit, listeners, get removals() { return removals; }, get disconnects() { return disconnects; }, get stops() { return stops; } };
}

async function connect(fixture) {
  const [selected] = await fixture.scanner.scan();
  await fixture.scanner.connect(selected.id);
}

test("decodes the actual native continuous-hex notification format and rejects corruption", () => {
  assert.equal(bleHexToText("34332030312030332030300d3e"), "43 01 03 00\r>");
  assert.equal(bleHexToText("34 33 20 30 31 20 30 33 20 30 30 0D 3E"), "43 01 03 00\r>");
  assert.throws(() => bleHexToText("3433x0"), /not BLE hex/);
  assert.throws(() => bleHexToText("343"), /not BLE hex/);
  assert.throws(() => bleHexToText("NDMgMDE="), /not BLE hex/);
});

test("known UART wins even when an unrelated writable service is discovered first", () => {
  const found = selectNativeBleChannel([custom("111111111111"), profile]);
  assert.equal(found.profile, "clone-fff0");
  assert.equal(found.write.uuid, uuid("fff2"));
  assert.equal(found.notify.uuid, uuid("fff1"));
  assert.equal(found.inspected.length, 2);
  assert.equal(selectNativeBleChannel([custom("111111111111")]).profile, "custom-uart");
  assert.equal(selectNativeBleChannel([custom("111111111111")], true).write, null);
  assert.equal(selectNativeBleChannel([custom("111111111111"), custom("222222222222")]).write, null);
});

test("all four candidate UART layouts select exact read/write characteristics", () => {
  const layouts = [
    ["fff0", "fff1", "fff2"],
    ["ffe0", "ffe1", "ffe1"],
    ["18f0", "2af0", "2af1"],
    ["6e400001-b5a3-f393-e0a9-e50e24dcca9e", "6e400003-b5a3-f393-e0a9-e50e24dcca9e", "6e400002-b5a3-f393-e0a9-e50e24dcca9e"],
  ];
  for (const [service, notify, write] of layouts) {
    const characteristics = notify === write
      ? [{ uuid: write, properties: { writeWithoutResponse: true, notify: true } }]
      : [{ uuid: write, properties: { writeWithoutResponse: true } }, { uuid: notify, properties: { indicate: true } }];
    const found = selectNativeBleChannel([{ uuid: service, characteristics }]);
    assert.equal(found.write.uuid, uuid(write));
    assert.equal(found.notify.uuid, uuid(notify));
  }
});

test("fragmented native replies reach the real stored-code parser; GATT alone is not a reading", async () => {
  const f = fake({ reply: async (_, emit) => { emit("43 01 "); await nextTurn(); emit("03 00\r>"); } });
  await connect(f);
  assert.equal(f.writes.length, 0);
  assert.equal(f.scanner.connectionInfo().adapterIdentified, false);
  assert.deepEqual(storedCodes(await f.scanner.send("03")), ["P0300"]);
  assert.equal(f.writes[0].characteristic, uuid("fff2"));
  assert.equal(f.writes[0].method, "write");
  await f.scanner.disconnect();
  assert.equal(f.removals, 3);
  assert.equal(f.stops, 1);
});

test("a no-response-only UART uses the supported native write method", async () => {
  const single = { uuid: "FFE0", characteristics: [{ uuid: "FFE1", properties: { notify: true, writeWithoutResponse: true } }] };
  const f = fake({ services: [single] });
  await connect(f);
  await f.scanner.send("03");
  assert.equal(f.writes[0].method, "writeWithoutResponse");
  await f.scanner.disconnect();
});

test("queued requests do not overlap and reconnect cannot send stale queued requests", async () => {
  const f = fake({ reply: null });
  await connect(f);
  const first = f.scanner.send("03");
  const second = f.scanner.send("0100");
  await nextTurn();
  assert.equal(f.writes.length, 1);
  f.emit("43 00\r>");
  await first;
  await nextTurn();
  assert.equal(f.writes.length, 2);
  f.emit("41 00 BE 1F A8 13\r>");
  await second;
  const third = f.scanner.send("03");
  const fourth = f.scanner.send("03");
  const thirdRejected = assert.rejects(third, /disconnected/i);
  const fourthRejected = assert.rejects(fourth, /disconnected/i);
  await nextTurn();
  await f.scanner.disconnect();
  await Promise.all([thirdRejected, fourthRejected]);
  assert.equal(f.writes.length, 3);
  await connect(f);
  f.emit("43 00\r>"); // unsolicited stale notification: no pending request
  const retry = f.scanner.send("03");
  await nextTurn();
  f.emit("43 01 04 20\r>");
  assert.deepEqual(storedCodes(await retry), ["P0420"]);
  await f.scanner.disconnect();
});

test("failed subscription and unsupported profiles release the native connection", async () => {
  const f = fake({ failSubscribe: true });
  await assert.rejects(connect(f), /Subscribe failed/);
  assert.equal(f.disconnects, 1);
  assert.equal(f.removals, 3);
  assert.equal(f.scanner.connectionInfo().connected, false);
  const unknown = fake({ services: [{ uuid: "180f", characteristics: [] }] });
  await assert.rejects(connect(unknown), /No supported scanner/);
  assert.equal(unknown.disconnects, 1);
  assert.equal(unknown.writes.length, 0);
  assert.equal(unknown.scanner.connectionInfo().services.length, 1);
});

test("Bluetooth disabled is handled for both raw and wrapper boolean formats", async () => {
  for (const enabled of [false, { value: false }]) {
    const f = fake({ enabled });
    await assert.rejects(f.scanner.scan(), /Bluetooth is off/);
    assert.equal(f.writes.length, 0);
  }
});

test("silent or corrupt replies fail rather than becoming an empty fault list", async () => {
  const f = fake({ reply: null });
  await connect(f);
  await assert.rejects(f.scanner.send("03"), /Timed out/);
  await nextTurn();
  assert.equal(f.scanner.connectionInfo().connected, false);
  await assert.rejects(f.scanner.send("03"), /disconnected/);
  const malformed = fake({ reply: async () => { malformed.listeners.get("notification|PHONE|fff0|fff1")?.({ value: "not hex" }); } });
  await connect(malformed);
  await assert.rejects(malformed.scanner.send("03"), /not BLE hex/);
  await malformed.scanner.disconnect();
  assert.throws(() => storedCodes("NO DATA\r>"));
});

test("explicit ELM setup requires identification and exact acknowledgements", async () => {
  const f = fake({ reply: async (command, emit) => emit(command === "ATI" ? "ATI\rELM327 v1.5\r>" : "OK\r>") });
  await connect(f);
  await assert.rejects(f.scanner.configureAdapter("ATE0"), /Identify/);
  await prepareElmAdapter(f.scanner);
  assert.deepEqual(f.writes.map((w) => w.command), ["ATI", "ATE0", "ATL0", "ATS1", "ATH0", "ATSP0"]);
  assert.equal(f.scanner.connectionInfo().adapterIdentified, true);
  await f.scanner.disconnect();
  const privateProtocol = fake({ reply: "?\r>" });
  await connect(privateProtocol);
  await assert.rejects(prepareElmAdapter(privateProtocol.scanner), /did not identify/);
  assert.deepEqual(privateProtocol.writes.map((w) => w.command), ["ATI"]);
  await privateProtocol.scanner.disconnect();
  assert.equal(adapterAcknowledged("OK\r>", "ATE0"), true);
  assert.equal(adapterAcknowledged("ATE0\rOK\r>", "ATE0"), true);
  for (const response of ["?\r>", "OK", "OK\rERROR\r>", "OK\r>OK\r>"]) assert.equal(adapterAcknowledged(response, "ATE0"), false);
});

test("clear codes, resets, persistent programming and command injection never reach native writes", async () => {
  const f = fake();
  await connect(f);
  for (const command of ["04", "ATZ", "ATE0", "ATSP0", "0902", "03\r04"]) {
    await assert.rejects(f.scanner.send(command), /Blocked/);
  }
  for (const command of ["04", "ATZ", "ATPP01ON", "ATD", "ATE0\r04", "ATI\rATE0"]) {
    assert.throws(() => assertAllowedAdapterSetupCommand(command), /Blocked/);
    await assert.rejects(f.scanner.configureAdapter(command), /Blocked/);
  }
  assert.equal(f.writes.length, 0);
  await f.scanner.disconnect();
});
