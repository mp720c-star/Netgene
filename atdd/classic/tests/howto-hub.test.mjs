import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, console };
context.globalThis = context.window;
runInNewContext(fs.readFileSync(path.join(classic, "data/howto-hub.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-db.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-sae-generic-additions.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/dtc-guidance-overlay.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "data/common-jobs.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "dtcGuidance.js"), "utf8"), context);
runInNewContext(fs.readFileSync(path.join(classic, "diagnosticsEngine.js"), "utf8"), context);

const pack = context.window.HOWTO_HUB_DATA;
assert.ok(pack && Array.isArray(pack.categories) && pack.categories.length >= 4);

const ids = pack.categories.map((c) => c.id);
assert.equal(ids.join(","), "obd_basics,scanners,abs_chassis,diagnose_flow");

const allCodes = new Set(context.window.DtcGuidance.allCodes().map((r) => r.code));
const jobIds = new Set(context.window.DiagEngine.listCommonJobs().map((j) => j.id));
const newDiy = ["P0010", "P0068", "P2096", "P2196", "C0031", "C0200", "C0265", "U0140", "U0155"];

for (const code of newDiy) {
  assert.ok(context.window.DtcGuidance.DETAILED_EXISTING.has(code), code + " detailed-existing");
  const steps = context.window.DiagEngine.diyStepsFor(code, "powertrain_general");
  assert.ok(Array.isArray(steps) && steps.length >= 3, code + " diy steps");
}

for (const cat of pack.categories) {
  assert.ok(cat.title && cat.blurb && Array.isArray(cat.articles) && cat.articles.length >= 1, cat.id);
  for (const article of cat.articles) {
    assert.ok(article.id && article.title && article.summary, article.id);
    assert.ok(Array.isArray(article.steps) && article.steps.length >= 3, article.id + " steps");
    for (const link of article.links || []) {
      if (link.kind === "code") assert.ok(allCodes.has(link.target), "hub code " + link.target);
      if (link.kind === "job") assert.ok(jobIds.has(link.target), "hub job " + link.target);
      if (link.kind === "tab") assert.ok(["scan", "vehicle", "symptoms", "results", "more"].includes(link.target), link.target);
    }
  }
}

const scanners = pack.categories.find((c) => c.id === "scanners");
assert.ok(scanners.articles.some((a) => /ELM327|Bluetooth|Clear codes/i.test(a.title + a.summary)));

console.log("howto-hub tests passed", {
  categories: pack.categories.length,
  articles: pack.categories.reduce((n, c) => n + c.articles.length, 0),
  newDiy: newDiy.length
});
