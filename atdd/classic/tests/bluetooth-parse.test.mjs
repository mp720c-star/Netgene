import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "bluetooth.js"), "utf8");
const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.runInNewContext(source, sandbox);

const { parseMode03Response, decodeDtcPair, claim } = sandbox.ATDDBluetooth;
assert.equal(String(claim), "UNVERIFIED");
assert.equal(String(decodeDtcPair(0x03, 0x00)), "P0300");
assert.equal(
  JSON.stringify([...parseMode03Response("43 02 03 00 04 20")].map(String)),
  JSON.stringify(["P0300", "P0420"])
);
assert.equal(
  JSON.stringify([...parseMode03Response("SEARCHING...\n43 01 03 00\n>")].map(String)),
  JSON.stringify(["P0300"])
);
console.log("atdd classic bluetooth-parse tests passed");
