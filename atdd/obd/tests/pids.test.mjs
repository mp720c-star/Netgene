import assert from "node:assert/strict";
import {
  parseRpmResponse,
  parseCoolantResponse,
  parseSpeedResponse,
  parseVinResponse,
  parsePidReply,
} from "../pids.js";

{
  const rpm = parseRpmResponse("41 0C 1A F8\r>");
  assert.equal(rpm.ok, true);
  assert.equal(rpm.value, 1726);
  console.log("ok rpm");
}

{
  const cool = parseCoolantResponse("41 05 7B\r>");
  assert.equal(cool.ok, true);
  assert.equal(cool.value, 83);
  console.log("ok coolant");
}

{
  const speed = parseSpeedResponse("41 0D 3C\r>");
  assert.equal(speed.ok, true);
  assert.equal(speed.value, 60);
  console.log("ok speed");
}

{
  const vin = parseVinResponse(
    "49 02 01 31 48 47 43 4D 38 32 36 33 33 41 30 30 34 33 35 32\r>",
  );
  assert.equal(vin.ok, true);
  assert.equal(vin.vin, "1HGCM82633A004352");
  console.log("ok vin");
}

{
  const miss = parseVinResponse("NO DATA\r>");
  assert.equal(miss.ok, false);
  assert.equal(miss.vin, null);
  console.log("ok vin no-data");
}

{
  const parsed = parsePidReply("010C", "41 0C 0B B8\r>");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value, 750);
  console.log("ok parsePidReply");
}

console.log("pids.test.mjs passed");
