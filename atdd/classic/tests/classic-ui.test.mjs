import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const classic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(classic, "index.html"), "utf8");
const css = fs.readFileSync(path.join(classic, "styles.css"), "utf8");
const app = fs.readFileSync(path.join(classic, "app.js"), "utf8");

assert.match(css, /--font:\s*-apple-system,\s*system-ui,\s*"SF Pro Text",\s*"Segoe UI",\s*Roboto,\s*sans-serif/);
assert.match(css, /--text-body:\s*1\.0625rem/);
assert.match(css, /--lh:\s*1\.45/);
assert.match(css, /--h1:\s*1\.5rem/);
assert.match(css, /--h2:\s*1\.25rem/);
assert.match(css, /--h3:\s*1\.0625rem/);
assert.match(css, /--tap:\s*44px/);
const h1 = parseFloat(css.match(/--h1:\s*([0-9.]+)rem/)[1]);
const h2 = parseFloat(css.match(/--h2:\s*([0-9.]+)rem/)[1]);
const h3 = parseFloat(css.match(/--h3:\s*([0-9.]+)rem/)[1]);
assert.ok(h1 > h2 && h2 > h3, `type scale should be h1 > h2 > h3, got ${h1}, ${h2}, ${h3}`);
console.log("classic-ui: system font stack and h1 > h2 > h3 type scale");

for (const tab of ["scan", "vehicle", "symptoms", "results", "more"]) {
  assert.match(html, new RegExp(`data-tab="${tab}"`));
}
assert.match(html, /class="tabbar"/);
assert.match(html, />Scan<\/button>/);
assert.match(html, />Vehicle<\/button>/);
assert.match(html, />Symptoms<\/button>/);
assert.match(html, />Results<\/button>/);
assert.match(html, />More<\/button>/);
assert.match(html, /id="howtoHubCard"/);
assert.match(html, /id="howtoHubCats"/);
assert.match(html, /id="howtoHubArticles"/);
assert.match(html, /class="hub-topic-grid"/);
assert.match(html, /id="btnGuidesTop"/);
assert.match(html, /data-open-hub="scanners"/);
assert.match(html, /class="flow-steps"/);
assert.match(html, /id="codeStep"/);
assert.match(html, /id="evidenceDetails"/);
assert.match(html, /src="\.\/data\/howto-hub\.js"/);
assert.match(html, /id="jobsCard"/);
assert.match(html, /id="rebuildCard"/);
assert.match(app, /function renderHowtoHub/);
assert.match(app, /function openHowtoHub/);
assert.match(app, /function openEvidencePanel/);
assert.match(app, /function wireHowtoHub/);
assert.match(app, /HOWTO_HUB_DATA/);
assert.match(app, /hub-topic/);
assert.match(app, /howto-hub-section/);
assert.match(html, /id="computerCard"/);
assert.match(html, /id="fluidCard"/);
assert.match(html, /id="privacyCard"/);
assert.match(html, />Diagnose<\/button>/);
assert.match(html, />Listen<\/button>/);
assert.match(html, />Look<\/button>/);
assert.match(html, />Code<\/button>/);
assert.match(html, />Guides<\/button>/);
assert.match(html, /id="btnBluetoothTop"/);
assert.match(html, /id="btnNewScanTop"/);
assert.match(html, /id="btnClearCodes"/);
assert.doesNotMatch(html, /id="btnClearCase"/);
assert.doesNotMatch(html, /id="btnNewScanVehicle"/);
assert.doesNotMatch(html, /id="btnNewScanResults"/);
console.log("classic-ui: tab bar and compact top bar are present");

assert.match(app, /function showTab/);
assert.match(app, /hasIntent/);
assert.match(app, /No list yet\. Type a symptom or pick a system above/);
assert.match(app, /SYMPTOM_GROUPS/);
assert.match(app, /function dedupeEvidence/);
assert.match(app, /resultDetails\('Tests and fixes'/);
assert.match(app, /Unknown code – not in database/);
assert.match(app, /No data – not enough information/);
assert.match(app, /General guidance – not a diagnosis for this exact vehicle/);
console.log("classic-ui: symptom list waits for search, results stay honest");

console.log("classic-ui.test.mjs passed");
