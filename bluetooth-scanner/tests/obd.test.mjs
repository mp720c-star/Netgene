import assert from "node:assert/strict";
import {
  decodeDtcPair,
  parseMode03Response,
  parseRpmResponse,
  parseSpeedResponse,
  pickCharacteristics,
  buildDemoMode03
} from "../obd.js";

assert.equal(decodeDtcPair(0x03, 0x01), "P0301");
assert.equal(decodeDtcPair(0x04, 0x20), "P0420");
assert.equal(decodeDtcPair(0x00, 0x00), null);

const codes = parseMode03Response(buildDemoMode03());
assert.deepEqual(codes, ["P0301", "P0420"]);

assert.equal(parseMode03Response("43 00\r\n>").length, 0);
assert.equal(parseRpmResponse("41 0C 1A F8\r\n>"), 1726);
assert.equal(parseSpeedResponse("41 0D 37\r\n>"), 55);

const picked = pickCharacteristics([
  { uuid: "0000fff1-0000-1000-8000-00805f9b34fb", properties: { notify: true } },
  { uuid: "0000fff2-0000-1000-8000-00805f9b34fb", properties: { write: true, writeWithoutResponse: true } }
]);
assert.ok(picked.write);
assert.ok(picked.notify);

console.log("bluetooth-scanner obd tests passed");
