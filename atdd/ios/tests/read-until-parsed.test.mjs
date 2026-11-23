import assert from "node:assert/strict";
import { readUntilParsed } from "../scanner/read-until-parsed.js";
import { storedCodes } from "../www/scanner/stored-codes.js";

const bad = "NO DATA\r>";
const good = "43 01 03 00\r>";

let sent = [];
let failures = [];
const result = await readUntilParsed({
  request: async () => {
    const reply = sent.length === 0 ? bad : good;
    sent.push(reply);
    return reply;
  },
  parse: storedCodes,
  shouldContinue: () => true,
  onFailure: async (info) => { failures.push(info.kind); },
  pause: async () => {},
});
assert.equal(result.ok, true);
assert.deepEqual(result.codes, ["P0300"]);
assert.equal(result.attempt, 2);
assert.deepEqual(sent, [bad, good]);
assert.deepEqual(failures, ["parse"]);

let calls = 0;
let open = true;
const stopped = await readUntilParsed({
  request: async () => {
    calls += 1;
    if (calls === 2) open = false;
    throw new Error("Timed out waiting for a complete scanner reply.");
  },
  parse: storedCodes,
  shouldContinue: () => open,
  onFailure: async () => {},
  pause: async () => {},
});
assert.equal(stopped.ok, false);
assert.equal(stopped.stopped, true);
assert.equal(calls, 2);

const empty = await readUntilParsed({
  request: async () => "43 00\r>",
  parse: storedCodes,
  shouldContinue: () => true,
  onFailure: async () => { throw new Error("a parsed empty code list must not retry"); },
  pause: async () => { throw new Error("a parsed empty code list must not retry"); },
});
assert.equal(empty.ok, true);
assert.deepEqual(empty.codes, []);
assert.equal(empty.attempt, 1);

console.log("read-until-parsed: retries a bad Mode 03 reply, stops when cancelled, and keeps a parsed empty list");
