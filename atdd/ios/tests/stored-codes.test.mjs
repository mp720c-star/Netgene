import assert from "node:assert/strict";
import { storedCodes } from "../www/scanner/stored-codes.js";

const accepted = [
  ["43 00\r>", []],
  ["43000000000000\r>", []],
  ["03\rSEARCHING...\r43 01 03 00\r>", ["P0300"]],
  ["43 03 00 04 20\r>", ["P0300", "P0420"]],
  ["006\r0: 43 02 03 00\r1: 04 20\r>", ["P0300", "P0420"]],
  ["006\r0: 43 02 03 00\r1: 04 20 00 00 00\r>", ["P0300", "P0420"]],
  ["7E8 04 43 01 03 00 FF FF FF\r7E9 04 43 01 04 20 00 00 00\r>", ["P0300", "P0420"]],
  ["7E8 10 08 43 03 03 00 04 20\r7E8 21 01 71 00 00 00 00 00\r>", ["P0300", "P0420", "P0171"]],
];
for (const [reply, expected] of accepted) assert.deepEqual(storedCodes(reply), expected);
const rejected = [
  "", "03\r>", "NO DATA\r>", "STOPPED\r>", "7F 03 11\r>", "41 00 00\r>", "43\r>", "43 01\r>",
  "43 02 03 00\r>", "43 01 00 00\r>", "43 03 00", "43 00\r>43 00\r>",
  "7E8 05 43 01 03\r>", "7E8 10 08 43 03 03 00 04 20\r>", "7E8 03 7F 03 11\r>",
  "006\r0: 43 02 03 00\r2: 04 20\r>", "43 00\r7E9 02 43\r>", "43 00\rCAN ERROR\r>",
];
for (const reply of rejected) assert.throws(() => storedCodes(reply), String(reply));
console.log(accepted.length + " known replies decoded, " + rejected.length + " invalid/incomplete replies rejected (fixtures).");
