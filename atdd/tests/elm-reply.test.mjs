import assert from "node:assert/strict";
import { reassembleElmReply } from "../web/js/elm-reply.js";
import { storedCodes } from "../ios/www/scanner/stored-codes.js";

const firstRow = "006\r0: 43 02 03 00\r>";
assert.equal(reassembleElmReply(firstRow, "03"), null);

const bothRows = firstRow + "1: 04 20\r>";
const joined = reassembleElmReply(bothRows, "03");
assert.equal(joined, "006\r0: 43 02 03 00\r1: 04 20\r>");
assert.deepEqual(storedCodes(joined), ["P0300", "P0420"]);

const perLinePrompt = "006\r>\r0: 43 02 03 00\r>\r1: 04 20\r>";
assert.deepEqual(storedCodes(reassembleElmReply(perLinePrompt, "03")), ["P0300", "P0420"]);

assert.equal(reassembleElmReply("03\r>", "03"), null);
assert.equal(reassembleElmReply("43 01 03 00\r>", "03"), "43 01 03 00\r>");
assert.equal(reassembleElmReply("OK\r>", "ATE0"), "OK\r>");

const firstFrame = "7E8 10 08 43 03 03 00 04 20\r>";
assert.equal(reassembleElmReply(firstFrame, "03"), null);
const iso = firstFrame + "7E8 21 01 71 00 00 00 00 00\r>";
assert.deepEqual(storedCodes(reassembleElmReply(iso, "03")), ["P0300", "P0420", "P0171"]);

console.log("elm-reply: multiline prompts stay open until every declared byte arrives");
