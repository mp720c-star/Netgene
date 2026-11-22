import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atdd = path.resolve(classic, "..");

function loadWindow(filePath, ctx) {
  const windowObj = ctx || { window: {} };
  if (!windowObj.window) windowObj.window = windowObj;
  windowObj.globalThis = windowObj.window;
  runInNewContext(fs.readFileSync(filePath, "utf8"), windowObj);
  return windowObj.window;
}

const win = { window: {}, console };
loadWindow(path.join(classic, "data/dtc-db.js"), win);
loadWindow(path.join(classic, "data/common-jobs.js"), win);
loadWindow(path.join(classic, "diagnosticsEngine.js"), win);
const Engine = win.window.DiagEngine;
const db = win.window.DTC_DB_DATA;
assert.ok(Engine && db && db.length > 0);

const UNKNOWN = Engine.UNKNOWN_CODE || "Unknown code – not in database";
const NO_DATA = Engine.NO_DATA || "No data – not enough information";

const unknown = Engine.lookupCodes(db, ["Z9999"]);
assert.equal(unknown.length, 1);
assert.equal(unknown[0].inDatabase, false);
assert.equal(unknown[0].description, UNKNOWN);
assert.equal(JSON.stringify(unknown[0].detailed.likelyParts), "[]");
assert.equal(JSON.stringify(unknown[0].detailed.firstChecks), "[]");
assert.equal(JSON.stringify(unknown[0].detailed.diySteps), "[]");
assert.equal(unknown[0].detailed.unknown, true);
assert.equal(unknown[0].subsystem, "");

const known = Engine.lookupCodes(db, ["P0300"]);
assert.equal(known[0].inDatabase, true);
assert.equal(known[0].detailed.generic, false);
assert.ok(known[0].detailed.diySteps.length > 0);

const empty = Engine.buildAnalysis({ dtcs: [], symptoms: [], notes: "" }, db);
assert.equal(empty.outcome.kind, "needs_more_evidence");
assert.equal(empty.outcome.title, NO_DATA);
assert.equal(empty.outcome.confidence, 0);
assert.equal(JSON.stringify(empty.outcome.likelyParts), "[]");
assert.equal(JSON.stringify(empty.outcome.firstChecks), "[]");
assert.equal((empty.rankedHypotheses || []).length, 0);
assert.equal(empty.summary.confidence, 0);

const onlyUnknown = Engine.buildAnalysis({ dtcs: ["Z9999"], symptoms: [], notes: "" }, db);
assert.equal(onlyUnknown.outcome.kind, "unknown_code");
assert.equal(onlyUnknown.outcome.title, UNKNOWN);
assert.equal(onlyUnknown.outcome.confidence, 0);
assert.equal(JSON.stringify(onlyUnknown.outcome.likelyParts), "[]");
assert.equal((onlyUnknown.rankedHypotheses || []).length, 0);

const fromKnown = Engine.buildAnalysis({ dtcs: ["P0300"], symptoms: [], notes: "" }, db);
assert.notEqual(fromKnown.outcome.kind, "unknown_code");
assert.notEqual(fromKnown.outcome.title, UNKNOWN);
assert.ok(fromKnown.codeCards[0].inDatabase);

const html = fs.readFileSync(path.join(classic, "index.html"), "utf8");
assert.doesNotMatch(html, /id="btnBtDemo"/);
assert.doesNotMatch(html, /Demo only/);

const bluetooth = fs.readFileSync(path.join(classic, "bluetooth.js"), "utf8");
assert.doesNotMatch(bluetooth, /function runDemo/);
assert.doesNotMatch(bluetooth, /applyCodesToScanner\(\["P0300"/);

const scannerUi = fs.readFileSync(path.join(atdd, "web/js/scanner-ui.js"), "utf8");
assert.doesNotMatch(scannerUi, /createSimulatedTransport/);
assert.doesNotMatch(scannerUi, /function startDemo/);
assert.doesNotMatch(scannerUi, /id="demoBtn"/);
assert.doesNotMatch(scannerUi, /Demo only/);

const webApp = fs.readFileSync(path.join(atdd, "web/js/app.js"), "utf8");
assert.doesNotMatch(webApp, /fetch\('\.\/data\/cdi-models\.json'/);
assert.match(webApp, /Sample and demo CDI models are not shipped/);

const engineSrc = fs.readFileSync(path.join(classic, "diagnosticsEngine.js"), "utf8");
assert.doesNotMatch(engineSrc, /Math\.max\(35,/);
assert.doesNotMatch(engineSrc, /Code not found in bundled database\. Use the DIY steps below/);

console.log("no-fabricated-outputs tests passed");
