import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, console };
context.globalThis = context.window;
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-db.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-sae-generic-additions.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-guidance-overlay.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/common-jobs.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "dtcGuidance.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "diagnosticsEngine.js"), "utf8"), context);

const Diag = context.window.DiagEngine;
const Guidance = context.window.DtcGuidance;

const absCodes = ["C0035", "C0040", "C0045", "C0050", "C0110", "C0121", "C0131", "C0161", "U0121"];
for (const code of absCodes) {
  const guide = Diag.diyStepsFor(code, "abs_brakes");
  assert.ok(Array.isArray(guide) && guide.length >= 3, code + " needs DIY steps");
  const tiered = Guidance.guidanceFor(code);
  assert.ok(tiered && tiered.code === code, code + " needs tiered guidance");
  assert.ok(Guidance.DETAILED_EXISTING.has(code), code + " should be detailed-existing");
}

console.log("abs-repair-guidance: ABS/chassis DIY packs covered", absCodes.length);
